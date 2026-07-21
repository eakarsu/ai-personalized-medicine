'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const databaseUrl = process.env.TEST_DATABASE_URL;
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
process.env.JWT_SECRET ||= 'integration-only-secret-that-is-at-least-32-characters';
process.env.JWT_ISSUER ||= 'medinsight-test';
process.env.JWT_AUDIENCE ||= 'medinsight-test-client';
process.env.CLINICAL_ACTIVE_KEY_VERSION ||= 'v1';
process.env.CLINICAL_DATA_KEYS_JSON ||= JSON.stringify({ v1: '11'.repeat(32) });
process.env.CLINICAL_POLICY_VERSION ||= 'test-policy-1';
process.env.CLINICAL_MINIMUM_CONFIDENCE ||= '0.8';
process.env.NODE_ENV = 'test';

test('governed clinical journey enforces consent, safety review, handoff, tenancy, audit, and revocation', { skip: !databaseUrl }, async (t) => {
  const bcrypt = require('bcrypt');
  const pool = require('../db');
  const { createApp } = require('../server');
  await pool.query('TRUNCATE clinical_handoffs,clinical_recommendations,clinical_deletion_queue,clinical_records,clinical_consents,clinical_incidents,clinical_audit_events,clinical_identities,clinical_subjects RESTART IDENTITY CASCADE');
  const passwordHash = await bcrypt.hash('correct horse battery staple', 4);
  const identities = [
    ['author', 'author@example.test', 'clinician'],
    ['reviewer', 'reviewer@example.test', 'clinician'],
    ['caseworker', 'caseworker@example.test', 'caseworker'],
    ['privacy', 'privacy@example.test', 'privacy_officer'],
  ];
  for (const [id, email, role] of identities) await pool.query('INSERT INTO clinical_identities(id,tenant_id,email,password_hash,role) VALUES($1,$2,$3,$4,$5)', [id, 'tenant-a', email, passwordHash, role]);
  await pool.query('INSERT INTO clinical_identities(id,tenant_id,email,password_hash,role) VALUES($1,$2,$3,$4,$5)', ['other', 'tenant-b', 'other@example.test', passwordHash, 'clinician']);

  const server = createApp().listen(Number(process.env.TEST_API_PORT || 0), '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); await pool.end(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, { token, method = 'GET', body } = {}) => {
    const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const json = await response.json();
    return { status: response.status, body: json };
  };
  const login = async (email, tenantId = 'tenant-a') => {
    const result = await request('/api/auth/login', { method: 'POST', body: { tenantId, email, password: 'correct horse battery staple' } });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return result.body.token;
  };
  const author = await login('author@example.test');
  const reviewer = await login('reviewer@example.test');
  const caseworker = await login('caseworker@example.test');
  const otherTenant = await login('other@example.test', 'tenant-b');

  const created = await request('/api/governed-clinical/subjects', { token: author, method: 'POST', body: { externalSubjectRef: 'p1', identity: { identifiers: [{ system: 'urn:mrn', value: '123' }], birthDate: '1990-01-01', family: 'Smith' } } });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const subjectId = created.body.id;

  const consent = await request(`/api/governed-clinical/subjects/${subjectId}/consents`, { token: caseworker, method: 'POST', body: { purpose: 'care_coordination', purposes: ['care', 'care_coordination'], scopes: ['sensitive_clinical', 'care_plan'], validFrom: '2026-01-01T00:00:00Z', validUntil: '2027-01-01T00:00:00Z', sourceUri: 'https://consent.example/forms/1', sourceVersion: '1' } });
  assert.equal(consent.status, 201, JSON.stringify(consent.body));

  const fhir = await request(`/api/governed-clinical/subjects/${subjectId}/fhir`, { token: author, method: 'POST', body: {
    purpose: 'care',
    retainUntil: '2027-07-01T00:00:00Z',
    source: { system: 'https://fhir.example/R4/', version: 'R4', retrievedAt: '2026-07-18T00:00:00Z' },
    bundle: { resourceType: 'Bundle', type: 'collection', entry: [
      { resource: { resourceType: 'Patient', id: 'p1', identifier: [{ system: 'urn:mrn', value: '123' }], birthDate: '1990-01-01', name: [{ family: 'Smith' }] } },
      { resource: { resourceType: 'AllergyIntolerance', id: 'a1', code: { coding: [{ code: 'penicillin' }] } } },
      { resource: { resourceType: 'Observation', id: 'o1', code: { coding: [{ code: 'egfr' }] }, valueQuantity: { value: 80, unit: 'mL/min' } } },
    ] },
  } });
  assert.equal(fhir.status, 201, JSON.stringify(fhir.body));

  const deniedRead = await request(`/api/governed-clinical/subjects/${subjectId}/records/${fhir.body.id}?fields=labs&purpose=care`, { token: caseworker });
  assert.equal(deniedRead.status, 403);
  const allowedRead = await request(`/api/governed-clinical/subjects/${subjectId}/records/${fhir.body.id}?fields=labs&purpose=care`, { token: reviewer });
  assert.equal(allowedRead.status, 200, JSON.stringify(allowedRead.body));
  assert.equal(allowedRead.body.resources[0].resourceType, 'Observation');

  const provenance = { modelVersion: 'rules-engine-3', sources: [{ uri: 'https://guideline.example/1', version: '1', retrievedAt: '2026-07-01T00:00:00Z' }] };
  const medication = (code) => ({ type: 'medication', medications: [{ code, display: code, dose: 250, unit: 'mg', route: 'oral' }], rationale: 'Culture-directed treatment with reviewed dose.' });
  const held = await request(`/api/governed-clinical/subjects/${subjectId}/recommendations`, { token: author, method: 'POST', body: { purpose: 'care', proposal: medication('penicillin'), provenance, confidence: 0.95 } });
  assert.equal(held.status, 201, JSON.stringify(held.body));
  assert.equal(held.body.status, 'safety_hold');
  const heldApproval = await request(`/api/governed-clinical/recommendations/${held.body.id}/review`, { token: reviewer, method: 'POST', body: { decision: 'approve', reason: 'Reviewed all clinical safety evidence.', attestation: true } });
  assert.equal(heldApproval.status, 400);

  const proposed = await request(`/api/governed-clinical/subjects/${subjectId}/recommendations`, { token: author, method: 'POST', body: { purpose: 'care', proposal: medication('amoxicillin'), provenance, confidence: 0.95 } });
  assert.equal(proposed.body.status, 'clinician_review_required', JSON.stringify(proposed.body));
  const selfReview = await request(`/api/governed-clinical/recommendations/${proposed.body.id}/review`, { token: author, method: 'POST', body: { decision: 'approve', reason: 'Reviewed all clinical safety evidence.', attestation: true } });
  assert.equal(selfReview.status, 400);
  const approved = await request(`/api/governed-clinical/recommendations/${proposed.body.id}/review`, { token: reviewer, method: 'POST', body: { decision: 'approve', reason: 'Reviewed all clinical safety evidence.', attestation: true } });
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  assert.equal(approved.body.status, 'approved');

  const handoff = await request(`/api/governed-clinical/recommendations/${proposed.body.id}/handoffs`, { token: reviewer, method: 'POST', body: { receiverId: 'caseworker', note: 'Coordinate follow-up and confirm patient contact.' } });
  assert.equal(handoff.status, 201, JSON.stringify(handoff.body));
  const acknowledged = await request(`/api/governed-clinical/handoffs/${handoff.body.id}/acknowledge`, { token: caseworker, method: 'POST', body: {} });
  assert.equal(acknowledged.body.status, 'acknowledged', JSON.stringify(acknowledged.body));

  const isolated = await request('/api/governed-clinical/recommendations', { token: otherTenant });
  assert.deepEqual(isolated.body, []);
  await assert.rejects(pool.query("UPDATE clinical_audit_events SET outcome='tampered' WHERE tenant_id='tenant-a'"), /append-only/);

  const revoked = await request(`/api/governed-clinical/subjects/${subjectId}/consents/${consent.body.id}/revoke`, { token: caseworker, method: 'POST', body: {} });
  assert.equal(revoked.body.status, 'revoked');
  const afterRevocation = await request(`/api/governed-clinical/subjects/${subjectId}/recommendations`, { token: author, method: 'POST', body: { purpose: 'care', proposal: medication('amoxicillin'), provenance, confidence: 0.95 } });
  assert.equal(afterRevocation.status, 400);
  const deniedAudit = await pool.query("SELECT outcome FROM clinical_audit_events WHERE tenant_id='tenant-a' AND action='clinical_record_read' AND outcome='denied'");
  assert.equal(deniedAudit.rowCount, 1);
});
