'use strict';

const crypto = require('crypto');

const FHIR_RESOURCE_FIELDS = Object.freeze({
  Patient: 'demographics',
  AllergyIntolerance: 'medications',
  MedicationRequest: 'medications',
  MedicationStatement: 'medications',
  Condition: 'conditions',
  Observation: 'labs',
  DiagnosticReport: 'labs',
  CarePlan: 'care_plan',
  MolecularSequence: 'genomics',
});
const ALLOWED_FHIR_RESOURCES = new Set(Object.keys(FHIR_RESOURCE_FIELDS));
const SENSITIVE_FIELDS = new Set(['genomics', 'medications', 'labs', 'conditions', 'recommendations']);
const FIELD_GRANTS = Object.freeze({
  patient: new Set(['demographics', 'consents', 'care_plan', 'recommendations']),
  caseworker: new Set(['demographics', 'consents', 'care_plan']),
  clinician: new Set(['demographics', 'consents', 'care_plan', 'genomics', 'medications', 'labs', 'conditions', 'recommendations']),
  privacy_officer: new Set(['demographics', 'consents', 'care_plan', 'genomics', 'medications', 'labs', 'conditions', 'recommendations', 'audit']),
  auditor: new Set(['audit']),
});
const INTERACTION_PAIRS = new Set(['warfarin|trimethoprim-sulfamethoxazole', 'clarithromycin|simvastatin']);
const RENAL_DOSE_CODES = new Set(['metformin', 'gabapentin']);
const PREGNANCY_CONTRAINDICATED = new Set(['isotretinoin', 'warfarin']);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest = (value) => crypto.createHash('sha256').update(canonical(value)).digest('hex');
const clean = (value, name, max = 256) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${name} is required`);
  return value.trim();
};
const list = (value, name, max = 50) => {
  if (!Array.isArray(value) || value.length > max) throw new Error(`${name} must be an array with at most ${max} items`);
  return value;
};

function validateIdentity(identity) {
  const identifiers = list(identity?.identifiers, 'identifiers', 10).map((identifier) => ({
    system: clean(identifier?.system, 'identifier system'),
    value: clean(identifier?.value, 'identifier value'),
  }));
  if (!identifiers.length) throw new Error('at least one authoritative identifier is required');
  return {
    identifiers,
    birthDate: clean(identity?.birthDate, 'birthDate', 10),
    family: clean(identity?.family, 'family name', 120),
  };
}

function normalizeFhirBundle(bundle, source) {
  if (bundle?.resourceType !== 'Bundle' || !['collection', 'searchset', 'document'].includes(bundle.type) || !Array.isArray(bundle.entry)) throw new Error('FHIR collection, searchset, or document Bundle required');
  if (bundle.entry.length < 1 || bundle.entry.length > 1000) throw new Error('FHIR Bundle must contain 1 to 1000 entries');
  const sourceSystem = clean(source?.system, 'source system');
  let parsedSource;
  try { parsedSource = new URL(sourceSystem); } catch { throw new Error('source system must be an absolute URL'); }
  if (!['https:', 'http:'].includes(parsedSource.protocol)) throw new Error('source system must use HTTP(S)');
  const version = clean(source?.version, 'FHIR version', 32);
  if (!['R4', '4.0.1'].includes(version)) throw new Error('only FHIR R4 is supported');
  const retrievedAt = new Date(source?.retrievedAt);
  if (!Number.isFinite(retrievedAt.getTime()) || retrievedAt.getTime() > Date.now() + 300000) throw new Error('valid retrieval time required');
  const resources = bundle.entry.map((entry) => entry?.resource);
  for (const resource of resources) {
    if (!resource || !ALLOWED_FHIR_RESOURCES.has(resource.resourceType)) throw new Error(`unsupported FHIR resource: ${resource?.resourceType || 'missing'}`);
    clean(resource.id, 'FHIR resource id');
    if (resource.contained?.some((item) => item.resourceType === 'Binary')) throw new Error('contained Binary resources are not accepted');
  }
  if (resources.filter((resource) => resource.resourceType === 'Patient').length !== 1) throw new Error('Bundle must contain exactly one Patient');
  return { fhirVersion: version === '4.0.1' ? 'R4' : version, sourceSystem, retrievedAt: retrievedAt.toISOString(), bundleDigest: digest(bundle), resources };
}

function matchIdentity(patient, rawSubject) {
  const subject = validateIdentity(rawSubject);
  const patientIds = new Set((patient.identifier || []).filter((item) => item?.system && item?.value).map((item) => `${item.system}|${item.value}`));
  const matches = subject.identifiers.filter((item) => patientIds.has(`${item.system}|${item.value}`));
  if (!matches.length) return { matched: false, reason: 'no authoritative identifier match' };
  const conflicts = [];
  if (!patient.birthDate || subject.birthDate !== patient.birthDate) conflicts.push('birthDate');
  const patientFamilies = (patient.name || []).map((name) => name?.family?.trim().toLowerCase()).filter(Boolean);
  if (!patientFamilies.includes(subject.family.toLowerCase())) conflicts.push('family');
  return conflicts.length ? { matched: false, reason: 'demographic conflict', conflicts } : { matched: true, matchedIdentifiers: matches.length };
}

function authorizeConsent(consent, purpose, scope, at = new Date()) {
  if (!consent || consent.status !== 'active') throw new Error('active consent required');
  if (Date.parse(consent.valid_from || consent.validFrom) > at.getTime() || Date.parse(consent.valid_until || consent.validUntil) <= at.getTime()) throw new Error('consent outside validity period');
  const purposes = consent.purposes || [];
  const scopes = consent.scopes || [];
  if (!purposes.includes(purpose) || !scopes.includes(scope)) throw new Error('consent does not grant requested purpose and scope');
  return true;
}

function authorizeFields(role, fields, purpose, consent, ownership = false) {
  const grants = FIELD_GRANTS[role];
  if (!grants) throw new Error('unknown role');
  const requested = [...new Set(list(fields, 'fields', 10))];
  for (const field of requested) if (!grants.has(field)) throw new Error(`field denied: ${field}`);
  if (role === 'patient' && !ownership) throw new Error('patient may access only their own subject');
  if (requested.some((field) => SENSITIVE_FIELDS.has(field))) authorizeConsent(consent, purpose, 'sensitive_clinical');
  return requested;
}

function resourceFields(resources) {
  return [...new Set(resources.map((resource) => FHIR_RESOURCE_FIELDS[resource.resourceType]))];
}

function filterResources(resources, fields) {
  const requested = new Set(fields);
  return resources.filter((resource) => requested.has(FHIR_RESOURCE_FIELDS[resource.resourceType]));
}

function referenceCode(resource) {
  return String(resource?.code?.coding?.[0]?.code || resource?.medicationCodeableConcept?.coding?.[0]?.code || resource?.code?.text || resource?.medicationCodeableConcept?.text || '').toLowerCase();
}

function extractSafetyContext(resources) {
  const allergies = resources.filter((resource) => resource.resourceType === 'AllergyIntolerance').map(referenceCode).filter(Boolean);
  const activeMedications = resources.filter((resource) => ['MedicationRequest', 'MedicationStatement'].includes(resource.resourceType) && !['stopped', 'entered-in-error'].includes(resource.status)).map(referenceCode).filter(Boolean);
  const conditions = resources.filter((resource) => resource.resourceType === 'Condition' && resource.clinicalStatus?.coding?.[0]?.code !== 'inactive').map(referenceCode).filter(Boolean);
  const labs = resources.filter((resource) => resource.resourceType === 'Observation').map((resource) => ({ code: referenceCode(resource), value: resource.valueQuantity?.value, unit: resource.valueQuantity?.unit })).filter((lab) => lab.code);
  return { allergies, activeMedications, conditions, labs };
}

function validateProposal(proposal) {
  if (!['medication', 'care_plan'].includes(proposal?.type)) throw new Error('proposal type must be medication or care_plan');
  const medications = list(proposal.medications || [], 'proposal medications', 20).map((medication) => ({
    code: clean(medication?.code, 'medication code'),
    display: clean(medication?.display, 'medication display'),
    dose: Number(medication?.dose),
    unit: clean(medication?.unit, 'dose unit', 30),
    route: clean(medication?.route, 'route', 80),
  }));
  if (proposal.type === 'medication' && !medications.length) throw new Error('medication proposal requires at least one medication');
  if (medications.some((medication) => !Number.isFinite(medication.dose) || medication.dose <= 0)) throw new Error('medication dose must be positive');
  return { type: proposal.type, medications, rationale: clean(proposal.rationale, 'proposal rationale', 2000) };
}

function validateProvenance(provenance) {
  const sources = list(provenance?.sources, 'provenance sources', 20).map((source) => ({
    uri: clean(source?.uri, 'source URI'),
    version: clean(source?.version, 'source version', 80),
    retrievedAt: clean(source?.retrievedAt, 'source retrieval time', 40),
  }));
  if (!sources.length || sources.some((source) => !Number.isFinite(Date.parse(source.retrievedAt)))) throw new Error('versioned source provenance required');
  return { modelVersion: clean(provenance?.modelVersion, 'model version', 120), policyVersion: clean(provenance?.policyVersion, 'policy version', 120), sources };
}

function evaluateRecommendation(input) {
  clean(input.subjectId, 'subject');
  clean(input.authorId, 'author');
  const proposal = validateProposal(input.proposal);
  const provenance = validateProvenance(input.provenance);
  const safety = input.safety || {};
  const missing = ['allergies', 'activeMedications', 'conditions', 'labs'].filter((key) => !Array.isArray(safety[key]));
  if (missing.length) throw new Error(`missing safety data: ${missing.join(',')}`);
  const medicationCodes = proposal.medications.map((medication) => medication.code.toLowerCase());
  const contraindications = [];
  for (const medication of medicationCodes) if (safety.allergies.map(String).map((item) => item.toLowerCase()).includes(medication)) contraindications.push(`allergy:${medication}`);
  for (const medication of medicationCodes) for (const active of safety.activeMedications.map(String).map((item) => item.toLowerCase())) {
    const pair = [medication, active].sort().join('|');
    if (INTERACTION_PAIRS.has(pair)) contraindications.push(`interaction:${pair}`);
  }
  const egfr = safety.labs.find((lab) => ['egfr', '33914-3'].includes(String(lab.code).toLowerCase()));
  if (medicationCodes.some((code) => RENAL_DOSE_CODES.has(code)) && (!Number.isFinite(Number(egfr?.value)) || Number(egfr.value) < 30)) contraindications.push('renal_function_review');
  if (safety.conditions.map(String).map((item) => item.toLowerCase()).some((item) => ['pregnancy', '77386006'].includes(item)) && medicationCodes.some((code) => PREGNANCY_CONTRAINDICATED.has(code))) contraindications.push('pregnancy_contraindication');
  const confidence = Number(input.confidence);
  const minimumConfidence = Number(input.minimumConfidence);
  const uncertain = !Number.isFinite(confidence) || !Number.isFinite(minimumConfidence) || confidence < minimumConfidence;
  return {
    proposal,
    provenance,
    releaseable: false,
    status: contraindications.length ? 'safety_hold' : 'clinician_review_required',
    contraindications: [...new Set(contraindications)],
    uncertain,
    requiresClinician: true,
  };
}

function reviewRecommendation(recommendation, reviewer, decision) {
  if (!['clinician_review_required', 'safety_hold'].includes(recommendation.status)) throw new Error('recommendation is not reviewable');
  if (reviewer.role !== 'clinician') throw new Error('clinician role required');
  if (String(reviewer.id) === String(recommendation.author_id || recommendation.authorId)) throw new Error('independent clinician required');
  const reason = clean(decision?.reason, 'review rationale', 2000);
  if (reason.length < 8) throw new Error('review rationale required');
  if (!['approve', 'reject'].includes(decision?.decision)) throw new Error('decision must be approve or reject');
  if (decision.decision === 'approve' && recommendation.status === 'safety_hold') throw new Error('safety hold must be resolved through a new recommendation version');
  if (decision.decision === 'approve' && decision.attestation !== true) throw new Error('clinical safety attestation required');
  return { status: decision.decision === 'approve' ? 'approved' : 'rejected', reviewedBy: String(reviewer.id), reviewReason: reason, reviewedAt: new Date().toISOString() };
}

function keyFromHex(hex) {
  const key = Buffer.from(String(hex || ''), 'hex');
  if (key.length !== 32) throw new Error('data encryption key must be 32-byte hex');
  return key;
}
function encryptFields(value, keyHex, keyVersion, aad) {
  if (!keyVersion) throw new Error('key version required');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFromHex(keyHex), iv);
  cipher.setAAD(Buffer.from(aad));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return { algorithm: 'aes-256-gcm', keyVersion, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
}
function decryptFields(envelope, keyHex, aad) {
  if (envelope?.algorithm !== 'aes-256-gcm') throw new Error('unsupported encryption algorithm');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFromHex(keyHex), Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString('utf8'));
}

function retentionDecision(record, now = new Date()) {
  if (record.legal_hold ?? record.legalHold) return { action: 'retain', reason: 'legal_hold' };
  const retainUntil = record.retain_until || record.retainUntil;
  if (!retainUntil) return { action: 'review', reason: 'missing_retention' };
  return Date.parse(retainUntil) <= now.getTime() ? { action: 'eligible_for_controlled_deletion' } : { action: 'retain', reason: 'retention_period' };
}

function incidentPriority(input) {
  const regulated = input?.regulatedData === true;
  const exfiltration = input?.suspectedExfiltration === true;
  const ongoing = input?.ongoingAccess === true;
  return { severity: regulated && (exfiltration || ongoing) ? 'critical' : regulated ? 'high' : 'medium', revokeAccess: ongoing, preserveEvidence: true };
}

module.exports = { FHIR_RESOURCE_FIELDS, canonical, digest, validateIdentity, normalizeFhirBundle, matchIdentity, authorizeConsent, authorizeFields, resourceFields, filterResources, extractSafetyContext, validateProposal, validateProvenance, evaluateRecommendation, reviewRecommendation, encryptFields, decryptFields, retentionDecision, incidentPriority };
