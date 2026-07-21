# Completeness Review: ai-personalized-medicine

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 120 project files (104 source files), 3 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished healthcare/care operations application, not just an empty scaffold. Inspection found 104 source files across `frontend/`, `backend/` using Next.js, React, Express; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Integrate standards-based clinical/care data (for example FHIR where applicable) with identity matching and consent.
2. Add clinician/caseworker review boundaries, provenance, contraindication/safety checks, and escalation for uncertain output.
3. Implement field-level access control, audit history, retention, encryption, and regulated-data incident procedures.
4. Validate the intended workflow with representative users and test high-risk, missing-data, and handoff scenarios.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.
- Regression risk is high because no recognizable project-owned automated tests cover the main path.

## Evidence inspected

- `frontend/src/App.tsx:22`
- `backend/routes/sample_data.js:6`
- `backend/server.js`
- `backend/middleware/auth.js`
- `requirements.txt`
- `start.sh`

## Recommended next action

Choose one real healthcare/care operations journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

Implemented the bounded governed care journey end to end. The production surface now supports tenant-scoped clinical identities; encrypted authoritative subject identity; purpose/scope consent and revocation; bounded FHIR R4 Bundle intake and server-side Patient `$everything` synchronization; exact identifier plus demographic conflict matching; encrypted records; field- and role-level access; append-only allowed/denied audit history; and a production UI for subject, consent, FHIR intake, recommendation, and review operations. The legacy CRUD, sample, generic-AI, gap, and generated clinical routes and navigation are quarantined behind an explicit development-only flag.

Recommendation safety data is derived from the latest encrypted clinical record rather than supplied by the client. Typed medication proposals require versioned provenance, use a versioned deterministic policy for allergy, interaction, renal-function, and pregnancy checks, always require clinician review, and place contraindications on a non-overridable safety hold. Approval requires a different clinician, rationale, and safety attestation. Approved recommendations support named clinician/caseworker handoff and explicit recipient acknowledgement. Added two-person controlled retention deletion with legal-hold enforcement, regulated-data incident records with containment/evidence controls, strict tenant JWT issuer/audience/algorithm validation, fail-closed database/key/policy configuration, bounded JSON/CORS/security headers, readiness checks, and an operational runbook covering key rotation, monitoring, retention, incidents, restore exercises, and external launch gates.

Added additive PostgreSQL governance schema and indexes, unit tests, FHIR adapter contract/failure tests, and a full HTTP/PostgreSQL journey covering role denial, consent, safety hold, independent review, tenant isolation, handoff, immutable audit, and revocation. CI installs from lockfiles, applies the migration twice, runs backend tests and the production TypeScript/Vite build, and fails on production dependency vulnerabilities. Verification completed with the migration applied twice to a disposable PostgreSQL 16 database, all 15 tests passing (including integration), a successful production frontend build, `git diff --check`, and zero backend/frontend dependency audit findings; the disposable database was removed. Local `.env` files are ignored and no `.env` path appears in Git history; any credential ever used outside local development still requires external rotation. Representative-user validation, real-system FHIR conformance, clinical policy curation, regulatory/safety review, production key management, penetration testing, and organizational retention/incident approval remain explicit deployment gates rather than source-code gaps.

## Runtime verification (2026-07-20)

`start.sh start` was verified with disposable PostgreSQL on `127.0.0.1:55624`, API on `127.0.0.1:6062`, and reserved UI port `6063`. The only attempt, at `2026-07-20T20:13:24Z`, recorded `API_VERIFIED/startup_login_session_api`. An acknowledgment-gated command persisted the runtime clinical identity with an externally supplied password; login returned the signed 30-minute token and authenticated `GET /api/auth/me` reloaded the active tenant identity from `clinical_identities`. Test-only issuer/audience/policy labels and the clinical encryption key are derived from externally supplied runtime material; no password or encryption credential is embedded.

The maintained suite passed 15/15 with the complete consent/safety/handoff/revocation PostgreSQL integration enabled on port 55624 and its test HTTP server pinned to port 6062. The Vite production build passed (1,519 modules). Shell/JavaScript syntax, `git diff --check`, and listener-release checks passed.
