'use strict';

const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const clinical = require('../governance/clinicalWorkflow');
const fhirClient = require('../governance/fhirClient');

const router = express.Router();
router.use(auth);

const fail = (status, message) => Object.assign(new Error(message), { status });
const requireRole = (...roles) => (req, _res, next) => roles.includes(req.user.role) ? next() : next(fail(403, 'role is not permitted'));
const purpose = (req) => {
  const value = String(req.body?.purpose || req.query?.purpose || '').trim();
  if (!['care', 'care_coordination', 'patient_access', 'privacy_operations'].includes(value)) throw fail(400, 'approved access purpose is required');
  return value;
};
const subjectOwnership = (req, subjectId) => req.user.role !== 'patient' || String(req.user.subjectId || '') === String(subjectId);

function encryption(version) {
  let keys;
  try { keys = JSON.parse(process.env.CLINICAL_DATA_KEYS_JSON || '{}'); } catch { throw fail(503, 'clinical encryption is not configured'); }
  const activeVersion = version || process.env.CLINICAL_ACTIVE_KEY_VERSION;
  if (!activeVersion || !keys[activeVersion]) throw fail(503, 'clinical encryption is not configured for the requested key version');
  return { version: activeVersion, key: keys[activeVersion] };
}

async function audit(client, req, { subjectId = null, purpose: accessPurpose = 'privacy_operations', action, fields = [], outcome, details = {} }) {
  await client.query(
    'INSERT INTO clinical_audit_events(tenant_id,subject_id,actor_id,actor_role,purpose,action,fields,outcome,correlation_id,details) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [req.user.tenantId, subjectId, String(req.user.id), req.user.role, accessPurpose, action, JSON.stringify(fields), outcome, req.correlationId, JSON.stringify(details)],
  );
}

async function loadSubject(client, req, subjectId, lock = false) {
  const result = await client.query(`SELECT * FROM clinical_subjects WHERE id=$1 AND tenant_id=$2${lock ? ' FOR UPDATE' : ''}`, [subjectId, req.user.tenantId]);
  if (!result.rows[0]) throw fail(404, 'clinical subject not found');
  if (!subjectOwnership(req, subjectId)) throw fail(403, 'patient may access only their own subject');
  return result.rows[0];
}

async function activeConsent(client, req, subjectId, accessPurpose, scope = 'sensitive_clinical') {
  const result = await client.query(
    "SELECT * FROM clinical_consents WHERE tenant_id=$1 AND subject_id=$2 AND status='active' AND valid_from<=NOW() AND valid_until>NOW() ORDER BY created_at DESC",
    [req.user.tenantId, subjectId],
  );
  const consent = result.rows.find((row) => (row.purposes || []).includes(accessPurpose) && (row.scopes || []).includes(scope));
  clinical.authorizeConsent(consent, accessPurpose, scope);
  return consent;
}

router.get('/subjects', requireRole('caseworker', 'clinician', 'privacy_officer'), async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id,external_subject_ref,created_at FROM clinical_subjects WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 200', [req.user.tenantId]);
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.post('/subjects', requireRole('caseworker', 'clinician', 'privacy_officer'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const identity = clinical.validateIdentity(req.body.identity);
    const externalRef = String(req.body.externalSubjectRef || '').trim();
    if (!externalRef || externalRef.length > 200) throw fail(400, 'externalSubjectRef is required');
    const id = crypto.randomUUID();
    const key = encryption();
    const encrypted = clinical.encryptFields(identity, key.key, key.version, `tenant:${req.user.tenantId}:subject-identity:${id}`);
    await client.query('BEGIN');
    await client.query('INSERT INTO clinical_subjects(id,tenant_id,external_subject_ref,identity_digest,identity_encrypted,encryption_key_version) VALUES($1,$2,$3,$4,$5,$6)', [id, req.user.tenantId, externalRef, clinical.digest(identity), JSON.stringify(encrypted), key.version]);
    await audit(client, req, { subjectId: id, action: 'subject_created', fields: ['demographics'], outcome: 'allowed' });
    await client.query('COMMIT');
    res.status(201).json({ id, externalSubjectRef: externalRef });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/subjects/:subjectId/consents', requireRole('patient', 'caseworker', 'privacy_officer'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const id = crypto.randomUUID();
    const accessPurpose = purpose(req);
    const purposes = Array.isArray(req.body.purposes) ? [...new Set(req.body.purposes)] : [];
    const scopes = Array.isArray(req.body.scopes) ? [...new Set(req.body.scopes)] : [];
    if (!purposes.length || purposes.some((item) => !['care', 'care_coordination', 'patient_access'].includes(item))) throw fail(400, 'valid consent purposes are required');
    if (!scopes.length || scopes.some((item) => !['sensitive_clinical', 'care_plan'].includes(item))) throw fail(400, 'valid consent scopes are required');
    if (!req.body.sourceUri || !req.body.sourceVersion) throw fail(400, 'consent source provenance is required');
    await client.query('BEGIN');
    await loadSubject(client, req, req.params.subjectId, true);
    await client.query(
      'INSERT INTO clinical_consents(id,tenant_id,subject_id,status,purposes,scopes,valid_from,valid_until,source_uri,source_version,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [id, req.user.tenantId, req.params.subjectId, 'active', JSON.stringify(purposes), JSON.stringify(scopes), req.body.validFrom, req.body.validUntil, req.body.sourceUri, req.body.sourceVersion, String(req.user.id)],
    );
    await audit(client, req, { subjectId: req.params.subjectId, purpose: accessPurpose, action: 'consent_recorded', fields: ['consents'], outcome: 'allowed', details: { consentId: id } });
    await client.query('COMMIT');
    res.status(201).json({ id, status: 'active', purposes, scopes });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/subjects/:subjectId/consents/:consentId/revoke', requireRole('patient', 'caseworker', 'privacy_officer'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await loadSubject(client, req, req.params.subjectId, true);
    const result = await client.query("UPDATE clinical_consents SET status='revoked',revoked_by=$1,revoked_at=NOW() WHERE id=$2 AND subject_id=$3 AND tenant_id=$4 AND status='active' RETURNING id", [String(req.user.id), req.params.consentId, req.params.subjectId, req.user.tenantId]);
    if (!result.rows[0]) throw fail(409, 'active consent not found');
    await audit(client, req, { subjectId: req.params.subjectId, action: 'consent_revoked', fields: ['consents'], outcome: 'allowed', details: { consentId: req.params.consentId } });
    await client.query('COMMIT');
    res.json({ id: req.params.consentId, status: 'revoked' });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

async function ingestBundle(req, client, bundle, source) {
  const accessPurpose = purpose(req);
  const subject = await loadSubject(client, req, req.params.subjectId, true);
  const normalized = clinical.normalizeFhirBundle(bundle, source);
  const subjectKey = encryption(subject.encryption_key_version);
  const identity = clinical.decryptFields(subject.identity_encrypted, subjectKey.key, `tenant:${req.user.tenantId}:subject-identity:${subject.id}`);
  const match = clinical.matchIdentity(normalized.resources.find((resource) => resource.resourceType === 'Patient'), identity);
  if (!match.matched) throw fail(409, JSON.stringify(match));
  const consent = await activeConsent(client, req, subject.id, accessPurpose);
  const fields = clinical.resourceFields(normalized.resources);
  clinical.authorizeFields(req.user.role, fields, accessPurpose, consent, subjectOwnership(req, subject.id));
  const key = encryption();
  const id = crypto.randomUUID();
  const encrypted = clinical.encryptFields({ resources: normalized.resources }, key.key, key.version, `tenant:${req.user.tenantId}:clinical-record:${id}`);
  await client.query(
    'INSERT INTO clinical_records(id,tenant_id,subject_id,record_type,source_system,source_version,source_resource_id,source_retrieved_at,bundle_digest,encrypted_payload,encryption_key_version,retain_until) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
    [id, req.user.tenantId, subject.id, 'fhir_bundle', normalized.sourceSystem, normalized.fhirVersion, normalized.resources.find((resource) => resource.resourceType === 'Patient').id, normalized.retrievedAt, normalized.bundleDigest, JSON.stringify(encrypted), key.version, req.body.retainUntil],
  );
  await audit(client, req, { subjectId: subject.id, purpose: accessPurpose, action: 'fhir_ingested', fields, outcome: 'allowed', details: { recordId: id, bundleDigest: normalized.bundleDigest, matchedIdentifiers: match.matchedIdentifiers } });
  return { id, bundleDigest: normalized.bundleDigest, fields, keyVersion: key.version };
}

router.post('/subjects/:subjectId/fhir', requireRole('clinician'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await ingestBundle(req, client, req.body.bundle, req.body.source);
    await client.query('COMMIT');
    res.status(201).json(result);
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/subjects/:subjectId/fhir-sync', requireRole('clinician'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const subjectResult = await client.query('SELECT external_subject_ref FROM clinical_subjects WHERE id=$1 AND tenant_id=$2', [req.params.subjectId, req.user.tenantId]);
    if (!subjectResult.rows[0]) throw fail(404, 'clinical subject not found');
    const upstream = await fhirClient.fetchPatientEverything(subjectResult.rows[0].external_subject_ref);
    await client.query('BEGIN');
    const result = await ingestBundle(req, client, upstream.bundle, upstream.source);
    await client.query('COMMIT');
    res.status(201).json(result);
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.get('/subjects/:subjectId/records/:recordId', async (req, res, next) => {
  const client = await pool.connect();
  const requested = String(req.query.fields || '').split(',').filter(Boolean);
  let accessPurpose = 'privacy_operations';
  try {
    accessPurpose = purpose(req);
    await client.query('BEGIN');
    await loadSubject(client, req, req.params.subjectId);
    const result = await client.query('SELECT * FROM clinical_records WHERE id=$1 AND subject_id=$2 AND tenant_id=$3', [req.params.recordId, req.params.subjectId, req.user.tenantId]);
    const record = result.rows[0];
    if (!record) throw fail(404, 'clinical record not found');
    const consent = requested.some((field) => ['genomics', 'medications', 'labs', 'conditions'].includes(field)) ? await activeConsent(client, req, req.params.subjectId, accessPurpose) : null;
    const fields = clinical.authorizeFields(req.user.role, requested, accessPurpose, consent, subjectOwnership(req, req.params.subjectId));
    const key = encryption(record.encryption_key_version);
    const payload = clinical.decryptFields(record.encrypted_payload, key.key, `tenant:${req.user.tenantId}:clinical-record:${record.id}`);
    await audit(client, req, { subjectId: req.params.subjectId, purpose: accessPurpose, action: 'clinical_record_read', fields, outcome: 'allowed', details: { recordId: record.id } });
    await client.query('COMMIT');
    res.json({ id: record.id, sourceSystem: record.source_system, sourceVersion: record.source_version, retrievedAt: record.source_retrieved_at, resources: clinical.filterResources(payload.resources, fields) });
  } catch (error) {
    await client.query('ROLLBACK');
    try { await audit(client, req, { subjectId: req.params.subjectId, purpose: accessPurpose, action: 'clinical_record_read', fields: requested, outcome: 'denied', details: { reason: error.message.slice(0, 300) } }); } catch { /* retain primary error */ }
    if (/field denied|own subject/.test(error.message)) error.status = 403;
    next(error);
  } finally { client.release(); }
});

router.post('/subjects/:subjectId/recommendations', requireRole('clinician'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const accessPurpose = purpose(req);
    const id = crypto.randomUUID();
    await client.query('BEGIN');
    await loadSubject(client, req, req.params.subjectId, true);
    const consent = await activeConsent(client, req, req.params.subjectId, accessPurpose);
    clinical.authorizeFields(req.user.role, ['recommendations', 'medications', 'conditions', 'labs'], accessPurpose, consent, true);
    const latest = await client.query("SELECT * FROM clinical_records WHERE tenant_id=$1 AND subject_id=$2 AND record_type='fhir_bundle' ORDER BY created_at DESC LIMIT 1", [req.user.tenantId, req.params.subjectId]);
    if (!latest.rows[0]) throw fail(409, 'current FHIR safety record is required');
    const record = latest.rows[0];
    const recordKey = encryption(record.encryption_key_version);
    const resources = clinical.decryptFields(record.encrypted_payload, recordKey.key, `tenant:${req.user.tenantId}:clinical-record:${record.id}`).resources;
    const safety = clinical.extractSafetyContext(resources);
    const policyVersion = process.env.CLINICAL_POLICY_VERSION;
    if (!policyVersion) throw fail(503, 'clinical policy is not configured');
    const evaluated = clinical.evaluateRecommendation({
      subjectId: req.params.subjectId,
      authorId: String(req.user.id),
      proposal: req.body.proposal,
      provenance: { ...req.body.provenance, policyVersion },
      safety,
      confidence: req.body.confidence,
      minimumConfidence: Number(process.env.CLINICAL_MINIMUM_CONFIDENCE || '0.8'),
    });
    const key = encryption();
    const proposalEncrypted = clinical.encryptFields(evaluated.proposal, key.key, key.version, `tenant:${req.user.tenantId}:recommendation:${id}:proposal`);
    const safetyEncrypted = clinical.encryptFields({ recordId: record.id, ...safety }, key.key, key.version, `tenant:${req.user.tenantId}:recommendation:${id}:safety`);
    await client.query(
      'INSERT INTO clinical_recommendations(id,tenant_id,subject_id,status,author_id,proposal_encrypted,safety_snapshot_encrypted,encryption_key_version,provenance,contraindications,confidence,policy_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [id, req.user.tenantId, req.params.subjectId, evaluated.status, String(req.user.id), JSON.stringify(proposalEncrypted), JSON.stringify(safetyEncrypted), key.version, JSON.stringify(evaluated.provenance), JSON.stringify(evaluated.contraindications), req.body.confidence, policyVersion],
    );
    await audit(client, req, { subjectId: req.params.subjectId, purpose: accessPurpose, action: 'recommendation_created', fields: ['recommendations'], outcome: evaluated.status, details: { recommendationId: id, uncertain: evaluated.uncertain, contraindications: evaluated.contraindications, sourceRecordId: record.id } });
    await client.query('COMMIT');
    res.status(201).json({ id, status: evaluated.status, contraindications: evaluated.contraindications, uncertain: evaluated.uncertain, releaseable: false });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.get('/recommendations', async (req, res, next) => {
  try {
    const statuses = req.user.role === 'patient' ? ['approved', 'handed_off', 'acknowledged'] : ['clinician_review_required', 'safety_hold', 'approved', 'rejected', 'handed_off', 'acknowledged', 'withdrawn'];
    const params = [req.user.tenantId, statuses];
    let sql = 'SELECT id,subject_id,status,version,author_id,reviewer_id,contraindications,confidence,policy_version,created_at,reviewed_at FROM clinical_recommendations WHERE tenant_id=$1 AND status=ANY($2)';
    if (req.user.role === 'patient') { sql += ' AND subject_id=$3'; params.push(req.user.subjectId); }
    sql += ' ORDER BY created_at DESC LIMIT 200';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.get('/recommendations/:recommendationId', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const accessPurpose = purpose(req);
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM clinical_recommendations WHERE id=$1 AND tenant_id=$2', [req.params.recommendationId, req.user.tenantId]);
    const recommendation = result.rows[0];
    if (!recommendation) throw fail(404, 'recommendation not found');
    await loadSubject(client, req, recommendation.subject_id);
    if (req.user.role === 'patient' && !['approved', 'handed_off', 'acknowledged'].includes(recommendation.status)) throw fail(403, 'recommendation has not been clinically approved');
    const consent = await activeConsent(client, req, recommendation.subject_id, accessPurpose);
    clinical.authorizeFields(req.user.role, ['recommendations'], accessPurpose, consent, subjectOwnership(req, recommendation.subject_id));
    const key = encryption(recommendation.encryption_key_version);
    const proposal = clinical.decryptFields(recommendation.proposal_encrypted, key.key, `tenant:${req.user.tenantId}:recommendation:${recommendation.id}:proposal`);
    await audit(client, req, { subjectId: recommendation.subject_id, purpose: accessPurpose, action: 'recommendation_read', fields: ['recommendations'], outcome: 'allowed', details: { recommendationId: recommendation.id } });
    await client.query('COMMIT');
    res.json({ id: recommendation.id, subjectId: recommendation.subject_id, status: recommendation.status, proposal, provenance: recommendation.provenance, contraindications: recommendation.contraindications, reviewReason: recommendation.review_reason });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/recommendations/:recommendationId/review', requireRole('clinician'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM clinical_recommendations WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.recommendationId, req.user.tenantId]);
    const recommendation = result.rows[0];
    if (!recommendation) throw fail(404, 'recommendation not found');
    const review = clinical.reviewRecommendation(recommendation, req.user, req.body);
    await client.query('UPDATE clinical_recommendations SET status=$1,reviewer_id=$2,review_reason=$3,reviewed_at=$4,updated_at=NOW() WHERE id=$5', [review.status, review.reviewedBy, review.reviewReason, review.reviewedAt, recommendation.id]);
    await audit(client, req, { subjectId: recommendation.subject_id, purpose: 'care', action: 'recommendation_reviewed', fields: ['recommendations'], outcome: review.status, details: { recommendationId: recommendation.id, attestation: req.body.attestation === true } });
    await client.query('COMMIT');
    res.json({ id: recommendation.id, status: review.status, reviewedAt: review.reviewedAt });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/recommendations/:recommendationId/handoffs', requireRole('clinician'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const receiverId = String(req.body.receiverId || '');
    const note = String(req.body.note || '').trim();
    if (!receiverId || note.length < 8 || note.length > 2000) throw fail(400, 'receiver and handoff note are required');
    await client.query('BEGIN');
    const recommendationResult = await client.query("SELECT * FROM clinical_recommendations WHERE id=$1 AND tenant_id=$2 AND status='approved' FOR UPDATE", [req.params.recommendationId, req.user.tenantId]);
    const recommendation = recommendationResult.rows[0];
    if (!recommendation) throw fail(409, 'approved recommendation not found');
    const receiverResult = await client.query("SELECT id,role FROM clinical_identities WHERE id=$1 AND tenant_id=$2 AND disabled_at IS NULL AND role IN ('clinician','caseworker')", [receiverId, req.user.tenantId]);
    if (!receiverResult.rows[0]) throw fail(400, 'eligible receiving identity not found');
    const id = crypto.randomUUID();
    await client.query('INSERT INTO clinical_handoffs(id,tenant_id,recommendation_id,sender_id,receiver_id,receiver_role,status,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [id, req.user.tenantId, recommendation.id, String(req.user.id), receiverId, receiverResult.rows[0].role, 'pending', note]);
    await client.query("UPDATE clinical_recommendations SET status='handed_off',updated_at=NOW() WHERE id=$1", [recommendation.id]);
    await audit(client, req, { subjectId: recommendation.subject_id, purpose: 'care_coordination', action: 'handoff_sent', fields: ['recommendations', 'care_plan'], outcome: 'pending', details: { handoffId: id, receiverId } });
    await client.query('COMMIT');
    res.status(201).json({ id, status: 'pending' });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/handoffs/:handoffId/acknowledge', requireRole('clinician', 'caseworker'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query("UPDATE clinical_handoffs SET status='acknowledged',acknowledged_at=NOW() WHERE id=$1 AND tenant_id=$2 AND receiver_id=$3 AND status='pending' RETURNING recommendation_id", [req.params.handoffId, req.user.tenantId, String(req.user.id)]);
    if (!result.rows[0]) throw fail(409, 'pending handoff assigned to this identity not found');
    const recommendation = await client.query("UPDATE clinical_recommendations SET status='acknowledged',updated_at=NOW() WHERE id=$1 RETURNING subject_id", [result.rows[0].recommendation_id]);
    await audit(client, req, { subjectId: recommendation.rows[0].subject_id, purpose: 'care_coordination', action: 'handoff_acknowledged', fields: ['recommendations', 'care_plan'], outcome: 'acknowledged', details: { handoffId: req.params.handoffId } });
    await client.query('COMMIT');
    res.json({ id: req.params.handoffId, status: 'acknowledged' });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/records/:recordId/retention-review', requireRole('privacy_officer'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM clinical_records WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.recordId, req.user.tenantId]);
    const record = result.rows[0];
    if (!record) throw fail(404, 'clinical record not found');
    const decision = clinical.retentionDecision(record);
    if (decision.action !== 'eligible_for_controlled_deletion') throw fail(409, `record cannot be deleted: ${decision.reason}`);
    const id = crypto.randomUUID();
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 8) throw fail(400, 'retention decision rationale is required');
    await client.query('INSERT INTO clinical_deletion_queue(id,tenant_id,record_id,requested_by,status,decision_reason) VALUES($1,$2,$3,$4,$5,$6)', [id, req.user.tenantId, record.id, String(req.user.id), 'pending_second_approval', reason]);
    await audit(client, req, { subjectId: record.subject_id, action: 'controlled_deletion_requested', fields: ['record'], outcome: 'pending_second_approval', details: { queueId: id, recordId: record.id } });
    await client.query('COMMIT');
    res.status(201).json({ id, status: 'pending_second_approval' });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/retention/:queueId/approve', requireRole('privacy_officer'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const queueResult = await client.query("SELECT * FROM clinical_deletion_queue WHERE id=$1 AND tenant_id=$2 AND status='pending_second_approval' FOR UPDATE", [req.params.queueId, req.user.tenantId]);
    const item = queueResult.rows[0];
    if (!item) throw fail(409, 'pending retention decision not found');
    if (item.requested_by === String(req.user.id)) throw fail(403, 'independent second approver required');
    const recordResult = await client.query('SELECT * FROM clinical_records WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [item.record_id, req.user.tenantId]);
    const record = recordResult.rows[0];
    if (!record || clinical.retentionDecision(record).action !== 'eligible_for_controlled_deletion') throw fail(409, 'record is no longer eligible for deletion');
    await client.query('DELETE FROM clinical_records WHERE id=$1 AND tenant_id=$2', [record.id, req.user.tenantId]);
    await client.query("UPDATE clinical_deletion_queue SET status='completed',second_approver_id=$1,decided_at=NOW() WHERE id=$2", [String(req.user.id), item.id]);
    await audit(client, req, { subjectId: record.subject_id, action: 'controlled_deletion_completed', fields: ['record'], outcome: 'completed', details: { queueId: item.id, recordId: record.id } });
    await client.query('COMMIT');
    res.json({ id: item.id, status: 'completed' });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/incidents', requireRole('privacy_officer'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const priority = clinical.incidentPriority(req.body);
    const summary = String(req.body.summary || '').trim();
    if (summary.length < 12 || summary.length > 4000) throw fail(400, 'incident summary is required');
    const id = crypto.randomUUID();
    await client.query('BEGIN');
    if (req.body.subjectId) await loadSubject(client, req, req.body.subjectId);
    let accessRevoked = false;
    if (priority.revokeAccess && req.body.compromisedIdentityId) {
      const result = await client.query('UPDATE clinical_identities SET disabled_at=NOW() WHERE id=$1 AND tenant_id=$2 AND disabled_at IS NULL RETURNING id', [String(req.body.compromisedIdentityId), req.user.tenantId]);
      accessRevoked = Boolean(result.rows[0]);
    }
    await client.query('INSERT INTO clinical_incidents(id,tenant_id,subject_id,reporter_id,severity,status,summary,preserve_evidence,access_revoked) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, req.user.tenantId, req.body.subjectId || null, String(req.user.id), priority.severity, 'open', summary, priority.preserveEvidence, accessRevoked]);
    await audit(client, req, { subjectId: req.body.subjectId || null, action: 'regulated_data_incident_opened', fields: [], outcome: priority.severity, details: { incidentId: id, accessRevoked, preserveEvidence: true } });
    await client.query('COMMIT');
    res.status(201).json({ id, severity: priority.severity, status: 'open', accessRevoked, preserveEvidence: true });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.patch('/incidents/:incidentId', requireRole('privacy_officer'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    if (!['contained', 'investigating', 'notification_review', 'closed'].includes(req.body.status)) throw fail(400, 'valid incident status is required');
    await client.query('BEGIN');
    const result = await client.query('UPDATE clinical_incidents SET status=$1,updated_at=NOW() WHERE id=$2 AND tenant_id=$3 RETURNING subject_id', [req.body.status, req.params.incidentId, req.user.tenantId]);
    if (!result.rows[0]) throw fail(404, 'incident not found');
    await audit(client, req, { subjectId: result.rows[0].subject_id, action: 'regulated_data_incident_updated', outcome: req.body.status, details: { incidentId: req.params.incidentId } });
    await client.query('COMMIT');
    res.json({ id: req.params.incidentId, status: req.body.status });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.get('/audit', requireRole('privacy_officer', 'auditor'), async (req, res, next) => {
  try {
    const result = await pool.query('SELECT id,subject_id,actor_id,actor_role,purpose,action,fields,outcome,correlation_id,details,occurred_at FROM clinical_audit_events WHERE tenant_id=$1 ORDER BY occurred_at DESC LIMIT 500', [req.user.tenantId]);
    res.json(result.rows);
  } catch (error) { next(error); }
});

module.exports = router;
