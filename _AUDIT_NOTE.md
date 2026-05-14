# MedInsight — Audit Note

## dashboard — Dashboard page (2026-05-07)

Added a domain-appropriate **Dashboard** page as the first sidebar item and post-login landing route.

### Backend
- New `backend/routes/dashboard.js` — `GET /api/dashboard/stats` (JWT-protected). Returns KPIs (`patients`, `active_medications`, `lab_results_this_week`, `pending_recommendations`, `genome_markers`), 10 most-recent `audit_log` rows, plus `synthetic_notice` and `disclaimer`. Read-only; resilient to missing tables.
- Mounted in `server.js`: `app.use('/api/dashboard', require('./routes/dashboard'));`.

### Frontend
- New `frontend/src/components/Dashboard.tsx` — 5 KPI cards, recent-activity feed from `audit_log`, quick-actions grid (AI Center, Patients, Recommendations, Sample Data), prominent amber banner **"Synthetic data only — for demo use. Not medical advice — consult a clinician."**
- `Layout.tsx` — `LayoutDashboard` icon; "Dashboard" inserted as **first** nav item.
- `App.tsx` — `/dashboard` route added; `/` now redirects to `/dashboard` (was `/patients`).
- `api.ts` — `dashboardStats()` client added.

### Constraints honored
- No `npm install`. Existing AI/utility/sample-data routes, components, and schema untouched. Medical disclaimers preserved (server response + UI banner). `node -c` clean; `tsc --noEmit` introduces no new errors (only pre-existing missing-deps).

### Smoke test (port 3004, `admin@demo.com / demo123`)
- Login → 200 + JWT.
- `GET /api/dashboard/stats` with bearer → **200**, KPIs `{patients:15, active_medications:15, lab_results_this_week:0, pending_recommendations:15, genome_markers:15}`.
- Without token → **401**.
- Cleanup: backend stopped, port 3004 free, tmp files removed.

Detailed log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/dashboard_ai-personalized-medicine.md`.

---

## samples — AI page sample-prefill buttons (2026-05-07)

Added 3 sample-prefill buttons to the central AI feature page so demo users can populate the form with one click. **Synthetic data only — no real PII.**

### Where
- `frontend/src/components/AICenter.tsx` — single AI feature page powering all 9 `/api/ai/*` endpoints (form has patient/marker selects + free-text "Proposed Treatment" and "Recent Symptoms" inputs). Samples added once here (shared abstraction).
- Detail components (`PatientDetail`, `MedicationDetail`, `GenomeMarkerDetail`, `RecommendationDetail`) call AI endpoints but bind to existing entity rows with **no free-form input** — no samples applicable.

### Samples (real drug/biomarker/PGx names, fabricated values)
- **T2DM + CYP2C19 \*2/\*2** — Metformin 500mg BID; HbA1c 7.8%, LDL 142 mg/dL, eGFR 58.
- **AFib + VKORC1/CYP2C9** — Apixaban 5mg BID; INR 1.1, eGFR 62, BNP 180 pg/mL.
- **HLA-B\*57:01 abacavir** — avoid abacavir; CD4 412, ALT 28.

UI: small "Synthetic data only — no real PII" subtitle next to the buttons. Existing medical disclaimer banner and AI-response `disclaimer` rendering are untouched.

### Constraints honored
- No npm install. No working code beyond additive sample buttons modified. New imports reuse icons already imported in the file.
- `tsc --noEmit`: no new errors (only the pre-existing TS2307 module-resolution errors documented earlier).
- `transpileModule(AICenter.tsx)`: OK.
- `vite build`: fails only on pre-existing missing `react-router-dom` dep in App.tsx (unrelated). Our file transforms cleanly.

### Smoke test
- Backend port 3004, login `admin@demo.com / demo123`: not started in this session (no DB instance available). Bundle would compile in a normal installed environment per syntax-check pipeline.
- No DB writes; no cleanup needed.

Detailed log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/samples_ai-personalized-medicine.md`.

---

## sample-data — demo seed page (2026-05-07)

Added a Sample Data demo page with one button per main entity that calls a JWT-protected admin endpoint inserting 5–10 domain-realistic synthetic rows.

### New backend
- `POST /api/admin/sample-data/:entity` (JWT, transactional) — entities: `patients`, `health_records`, `genome_markers`, `medications`, `lab_results`, `treatment_recommendations`. Returns `{ inserted, entity }`. 400 on unknown entity.
- `GET  /api/admin/sample-data/entities` (JWT) — entity catalog for the UI.
- Mounted at `/api/admin` in `server.js`.
- File: `backend/routes/sample_data.js`. **Synthetic only** — fabricated names, `example.com` emails, `+1-555-01XX` phones; real-sounding drug names (Metformin 500mg, Apixaban 5mg, Albuterol HFA), biomarkers (HbA1c, LDL, eGFR, INR, TSH), pharmacogenomics alleles (CYP2C19 *2/*2, HLA-B*57:01, VKORC1 -1639G>A) with CPIC-style guidance. No real patient PII.

### New frontend
- `frontend/src/components/SampleData/SampleDataPage.tsx` — one button per entity, JWT bearer, spinner, per-entity inserted counter, toast on success/error, prominent banner "Synthetic data only — for demo use."
- `frontend/src/api.ts` — added `sampleDataEntities()` and `insertSampleData(entity)`.
- Wired into `App.tsx` (`/sample-data` route) and sidebar `Layout.tsx` (Database icon).

### Constraints honored
- 5 AI endpoints with medical disclaimers untouched.
- No `npm install` ran.
- `node -c` clean for new + edited backend files. No new TS errors introduced (only the pre-existing missing-`lucide-react`/`react-router-dom` errors that affect every component in this workspace).

### Smoke test (port 3004, `admin@demo.com / demo123`)
- Login -> 200 + JWT.
- `GET /api/admin/sample-data/entities` -> 200, 6 entities.
- `POST /api/admin/sample-data/lab_results` -> 200, `{"inserted":9,"entity":"lab_results"}`.
- `POST /api/admin/sample-data/medications` -> 200, `{"inserted":8,"entity":"medications"}`.
- Negative: unknown entity -> 400; missing token -> 401.
- Cleanup: rows tagged in `notes` deleted; backend stopped.

Detailed log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/sample_data_ai-personalized-medicine.md`.

---

## apply3 — feature additions (2026-05-07)

Added 5 new AI features and 3 new utility features. Existing endpoints, components, and DB tables were not modified beyond adding the standard `disclaimer` field to AI responses and a new `audit_log` table.

### New backend AI endpoints (POST, JWT, JSON `{ result, disclaimer }`)
All AI endpoints now include `disclaimer: "Not medical advice — consult a clinician."` and return 503 when `OPENROUTER_API_KEY` is missing or upstream fails.

- `POST /api/ai/drug-interaction` — pairwise drug-interaction risk scorer.
- `POST /api/ai/treatment-response` — treatment-response predictor for a patient profile + proposed therapy.
- `POST /api/ai/biomarker-pattern` — biomarker-pattern detector across recent labs.
- `POST /api/ai/clinical-trial-match` — clinical-trial category matcher (illustrative; verify on ClinicalTrials.gov).
- `POST /api/ai/adverse-event-warning` — adverse-event early-warning assessment.

Existing AI endpoints (`/patient-risk`, `/genomic-insights`, `/medication-analysis`, `/treatment-plan`) retained behavior; their responses now also include the `disclaimer` field and 503 on AI service unavailability.

### New backend utility endpoints — `/api/utility/*` (JWT)
- `GET /api/utility/resources` — list of exportable/searchable resources with column metadata.
- `GET /api/utility/export/:resource.csv` — CSV export (whitelisted resources: patients, health_records, genome_markers, medications, lab_results, recommendations).
- `GET /api/utility/search/:resource?q=&filter[col]=&limit=&offset=` — search + filter with parameterized SQL (whitelisted columns).
- `GET /api/utility/audit-log?action=&user_email=&limit=&offset=` — list audit entries (returns empty list with note if `audit_log` table not yet migrated).
- `POST /api/utility/audit-log` — create manual audit entry (also written automatically by AI + utility actions).

### Schema
- New table `audit_log (id, user_id, user_email, action, target, meta JSONB, created_at)` added with `CREATE TABLE IF NOT EXISTS` so re-running `schema.sql` is safe.

### Frontend
- `frontend/src/api.ts` — added clients for the 5 AI features and 3 utility features.
- `frontend/src/components/AICenter.tsx` — added 5 new tool cards, hooked up patient/medication/lab data, surfaced disclaimer banner, inputs for "proposed treatment" and "recent symptoms".
- `frontend/src/components/Tools/ToolsPage.tsx` — new page with three tabs: CSV Export, Search & Filter, Audit Log.
- `frontend/src/App.tsx` + `Layout.tsx` — added `/tools` route and sidebar entry.

### Smoke test
- Port: 3004 (backend), 5173 (frontend).
- DB: `medicine_db`.
- Login: `admin@demo.com` / `demo123`.
- After `start.sh`, run `psql $DATABASE_URL -f backend/db/schema.sql` once if `audit_log` table is missing — schema.sql is idempotent for that table.

### Implementation notes
- Followed existing route style (Express router, `auth` middleware, parameterized queries, try/catch -> 500).
- AI calls validate `OPENROUTER_API_KEY` and return 503 with disclaimer rather than 500.
- All clinical AI JSON responses include `disclaimer`.
- CSV export and search use a whitelist map to avoid SQL injection.
- No `npm install` run; no existing working code modified beyond additive changes.
- `node -c` passed for `routes/ai.js`, `routes/utility.js`, `server.js`. Frontend `tsc --noEmit` produces only pre-existing module-resolution errors (deps not yet installed in the workspace); no new errors introduced.
