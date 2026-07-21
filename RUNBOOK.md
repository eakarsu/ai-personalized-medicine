# Governed clinical workflow runbook

This service implements one bounded care journey: a provisioned tenant identity creates a clinical subject, records purpose-bound consent, imports or synchronizes a FHIR R4 Patient `$everything` Bundle, creates a medication recommendation against server-derived safety data, obtains independent clinician review, and hands an approved recommendation to a named clinician or caseworker. Recommendations never auto-release. A contraindication creates a safety hold that cannot be overridden; the author must submit a new version after the underlying issue is resolved.

## Deployment

Install locked dependencies in a controlled build step and run `./start.sh check`. Set `DATABASE_URL`, a 32+ character `JWT_SECRET`, explicit `JWT_ISSUER` and `JWT_AUDIENCE`, `CLINICAL_POLICY_VERSION`, `CLINICAL_MINIMUM_CONFIDENCE`, `CORS_ORIGIN`, and a versioned 32-byte hex data key in `CLINICAL_DATA_KEYS_JSON`. Secrets must come from the deployment secret manager, never environment files in source control. Configure `FHIR_BASE_URL` (HTTPS in production) and a short-lived `FHIR_ACCESS_TOKEN` for server-side synchronization.

Back up PostgreSQL, obtain migration approval, and run `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate` twice in pre-production to prove idempotency. `./start.sh start` only starts the service: it never installs, seeds, migrates, creates a database, or kills a process. Readiness verifies the governed migration. Keep `ENABLE_GENERATED_FEATURES` unset in production; legacy generated, generic-AI, sample, and clinical-calculator routes are development-only.

## Access and data controls

Authentication is tenant-explicit and tokens are pinned to HS256, issuer, audience, expiry, and JWT ID. Provision identities out of band with least-privilege roles. Patient identities must be linked to their single `subject_id`. Clinical subject identity, FHIR payloads, recommendation proposals, and safety snapshots use AES-256-GCM with tenant/record-specific authenticated context. Audit events are append-only. Database backups, replicas, logs, and transport encryption remain infrastructure responsibilities.

For key rotation, introduce a new active key version, run a reviewed re-encryption job, verify every envelope and audit totals, then retain the previous key until rollback and backup retention windows expire. Never remove a key while records still reference its version. Do not log access tokens, FHIR Bundles, identities, proposals, or decrypted fields.

## Clinical and interoperability operations

Only supported FHIR R4 resource types are accepted, with one Patient, authoritative identifier match, birth-date and family-name agreement, bounded Bundle size, provenance, and active purpose/scope consent. Safety data is derived from the latest encrypted Bundle, not supplied by the requesting client. The repository’s deterministic policy is deliberately small; medication terminology, allergy crosswalks, interaction evidence, renal thresholds, pregnancy rules, policy versioning, and clinical acceptance must be curated and approved before real-world use.

Monitor FHIR latency, status codes, authentication expiry, media type, payload limits, match conflicts, consent failures, safety holds, review age, handoff acknowledgement age, denied field access, and audit write failures. Stop intake if identity matching, consent lookup, encryption, audit persistence, or policy configuration is unavailable.

## Retention and incident response

Legal holds always block deletion. Expired records require one privacy officer to request controlled deletion and a different privacy officer to approve it; the transaction preserves an append-only audit event. Validate the organization’s statutory retention schedule before enabling this path.

For suspected regulated-data exposure: open an incident immediately, preserve audit/database/provider evidence, contain ongoing identity access, rotate affected credentials and keys, determine tenants/subjects/fields/time window, involve privacy/security/legal leadership, assess notification obligations and deadlines, and document containment through closure. Do not erase evidence or use the retention path during an active investigation. Exercise restore, incident, consent-revocation, FHIR outage, wrong-patient, missing-data, safety-hold, independent-review, and unacknowledged-handoff scenarios at least quarterly.

## Launch gates

Interoperability testing with each real care system, patient-matching validation, consent/legal interpretation, representative clinician/caseworker/patient usability studies, high-risk medication validation, clinical safety and medical-device/regulatory review, penetration testing, production key management, backup/restore proof, retention approval, and breach-response approval remain external launch gates. This software is not medical advice and the automated tests do not establish clinical safety or efficacy.
