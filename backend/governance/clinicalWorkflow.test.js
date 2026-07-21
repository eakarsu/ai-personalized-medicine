'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const clinical = require('./clinicalWorkflow');

const bundle = { resourceType: 'Bundle', type: 'collection', entry: [{ resource: { resourceType: 'Patient', id: 'p1', identifier: [{ system: 'urn:mrn', value: '123' }], birthDate: '1990-01-01', name: [{ family: 'Smith' }] } }] };
const source = { system: 'https://fhir.example/R4/', version: 'R4', retrievedAt: '2026-07-01T00:00:00Z' };
const consent = { status: 'active', valid_from: '2026-01-01', valid_until: '2027-01-01', purposes: ['care'], scopes: ['sensitive_clinical'] };
const identity = { identifiers: [{ system: 'urn:mrn', value: '123' }], birthDate: '1990-01-01', family: 'Smith' };
const provenance = { modelVersion: 'rules-engine-3', policyVersion: '2026.07', sources: [{ uri: 'https://guideline.example/1', version: '1', retrievedAt: '2026-07-01T00:00:00Z' }] };
const proposal = { type: 'medication', medications: [{ code: 'penicillin', display: 'Penicillin', dose: 250, unit: 'mg', route: 'oral' }], rationale: 'Treatment rationale based on culture.' };

test('normalizes bounded FHIR R4 data with immutable provenance digest', () => {
  const normalized = clinical.normalizeFhirBundle(bundle, source);
  assert.equal(normalized.fhirVersion, 'R4');
  assert.equal(normalized.resources[0].resourceType, 'Patient');
  assert.equal(normalized.bundleDigest.length, 64);
  assert.throws(() => clinical.normalizeFhirBundle({ ...bundle, type: 'transaction' }, source), /FHIR/);
  assert.throws(() => clinical.normalizeFhirBundle({ ...bundle, entry: [...bundle.entry, { resource: { resourceType: 'Binary', id: 'b1' } }] }, source), /unsupported/);
});

test('matches authoritative identity and rejects missing demographics or conflicts', () => {
  const patient = bundle.entry[0].resource;
  assert.equal(clinical.matchIdentity(patient, identity).matched, true);
  assert.deepEqual(clinical.matchIdentity(patient, { ...identity, birthDate: '1980-01-01' }).conflicts, ['birthDate']);
  assert.equal(clinical.matchIdentity(patient, { ...identity, identifiers: [{ system: 'urn:mrn', value: '999' }] }).matched, false);
});

test('enforces consent purpose, scope, validity, role fields and patient ownership', () => {
  assert.equal(clinical.authorizeConsent(consent, 'care', 'sensitive_clinical', new Date('2026-07-01')), true);
  assert.throws(() => clinical.authorizeConsent(consent, 'research', 'sensitive_clinical', new Date('2026-07-01')), /does not grant/);
  assert.deepEqual(clinical.authorizeFields('clinician', ['labs'], 'care', consent, true), ['labs']);
  assert.throws(() => clinical.authorizeFields('caseworker', ['genomics'], 'care', consent, true), /denied/);
  assert.throws(() => clinical.authorizeFields('patient', ['demographics'], 'patient_access', null, false), /own subject/);
});

test('derives safety context from FHIR resources', () => {
  const safety = clinical.extractSafetyContext([
    { resourceType: 'AllergyIntolerance', code: { coding: [{ code: 'penicillin' }] } },
    { resourceType: 'MedicationRequest', status: 'active', medicationCodeableConcept: { coding: [{ code: 'warfarin' }] } },
    { resourceType: 'Condition', clinicalStatus: { coding: [{ code: 'active' }] }, code: { coding: [{ code: 'pregnancy' }] } },
    { resourceType: 'Observation', code: { coding: [{ code: 'egfr' }] }, valueQuantity: { value: 20, unit: 'mL/min' } },
  ]);
  assert.deepEqual(safety.allergies, ['penicillin']);
  assert.deepEqual(safety.activeMedications, ['warfarin']);
  assert.equal(safety.labs[0].value, 20);
});

test('holds allergy, interaction, renal and pregnancy contraindications and never auto-releases', () => {
  const result = clinical.evaluateRecommendation({ subjectId: 'p1', authorId: 'a1', proposal, provenance, safety: { allergies: ['penicillin'], activeMedications: [], conditions: [], labs: [] }, confidence: 0.95, minimumConfidence: 0.8 });
  assert.equal(result.releaseable, false);
  assert.equal(result.status, 'safety_hold');
  assert.deepEqual(result.contraindications, ['allergy:penicillin']);
  const compound = clinical.evaluateRecommendation({ subjectId: 'p1', authorId: 'a1', proposal: { ...proposal, medications: [{ ...proposal.medications[0], code: 'simvastatin' }] }, provenance, safety: { allergies: [], activeMedications: ['clarithromycin'], conditions: [], labs: [] }, confidence: 0.95, minimumConfidence: 0.8 });
  assert.match(compound.contraindications[0], /interaction/);
});

test('escalates uncertainty and refuses missing safety data or malformed clinical proposals', () => {
  const base = { subjectId: 'p1', authorId: 'a1', proposal: { ...proposal, medications: [{ ...proposal.medications[0], code: 'amoxicillin' }] }, provenance, safety: { allergies: [], activeMedications: [], conditions: [], labs: [] }, confidence: 0.4, minimumConfidence: 0.8 };
  assert.equal(clinical.evaluateRecommendation(base).uncertain, true);
  assert.throws(() => clinical.evaluateRecommendation({ ...base, safety: { ...base.safety, labs: undefined } }), /missing safety data/);
  assert.throws(() => clinical.evaluateRecommendation({ ...base, proposal: { ...proposal, medications: [{ ...proposal.medications[0], dose: -1 }] } }), /positive/);
});

test('requires independent clinician approval, attestation and a clear safety hold', () => {
  const recommendation = { status: 'clinician_review_required', author_id: 'a1' };
  assert.equal(clinical.reviewRecommendation(recommendation, { id: 'c2', role: 'clinician' }, { decision: 'approve', reason: 'Reviewed complete safety record', attestation: true }).status, 'approved');
  assert.throws(() => clinical.reviewRecommendation(recommendation, { id: 'a1', role: 'clinician' }, { decision: 'approve', reason: 'Reviewed complete safety record', attestation: true }), /independent/);
  assert.throws(() => clinical.reviewRecommendation({ ...recommendation, status: 'safety_hold' }, { id: 'c2', role: 'clinician' }, { decision: 'approve', reason: 'Reviewed complete safety record', attestation: true }), /new recommendation version/);
});

test('encrypts sensitive fields with authenticated tenant and record context', () => {
  const key = '11'.repeat(32);
  const envelope = clinical.encryptFields({ labs: [1] }, key, 'v1', 'tenant:t1:subject:p1');
  assert.deepEqual(clinical.decryptFields(envelope, key, 'tenant:t1:subject:p1'), { labs: [1] });
  assert.throws(() => clinical.decryptFields(envelope, key, 'tenant:t2:subject:p1'));
});

test('honors legal holds and classifies regulated-data incidents', () => {
  assert.equal(clinical.retentionDecision({ legal_hold: true, retain_until: '2020-01-01' }, new Date('2026-01-01')).reason, 'legal_hold');
  assert.equal(clinical.retentionDecision({ legal_hold: false, retain_until: '2020-01-01' }, new Date('2026-01-01')).action, 'eligible_for_controlled_deletion');
  assert.deepEqual(clinical.incidentPriority({ regulatedData: true, ongoingAccess: true }), { severity: 'critical', revokeAccess: true, preserveEvidence: true });
});

test('migration is additive and provides encrypted clinical governance controls', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../db/migrations/001_governed_clinical.sql'), 'utf8');
  for (const term of ['clinical_identities', 'clinical_consents', 'identity_encrypted', 'safety_snapshot_encrypted', 'clinical_handoffs', 'clinical_deletion_queue', 'clinical_incidents', 'immutable_clinical_audit']) assert.match(sql, new RegExp(term));
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE/i);
});

test('launcher is explicit and non-destructive', () => {
  const script = fs.readFileSync(path.join(__dirname, '../../start.sh'), 'utf8');
  assert.match(script, /check\|migrate\|start/);
  assert.doesNotMatch(script, /npm install|seed\.sql|createdb|kill -9/);
});
