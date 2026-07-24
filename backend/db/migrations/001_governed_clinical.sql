BEGIN;

CREATE TABLE IF NOT EXISTS clinical_identities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient','caseworker','clinician','privacy_officer','auditor')),
  subject_id UUID,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS clinical_subjects (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  external_subject_ref TEXT NOT NULL,
  identity_digest TEXT NOT NULL,
  identity_encrypted JSONB NOT NULL,
  encryption_key_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, external_subject_ref)
);
ALTER TABLE clinical_identities DROP CONSTRAINT IF EXISTS clinical_identities_subject_id_fkey;
ALTER TABLE clinical_identities ADD CONSTRAINT clinical_identities_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES clinical_subjects(id);

CREATE TABLE IF NOT EXISTS clinical_consents (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES clinical_subjects(id),
  status TEXT NOT NULL CHECK (status IN ('draft','active','revoked','expired')),
  purposes JSONB NOT NULL,
  scopes JSONB NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  source_uri TEXT NOT NULL,
  source_version TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  revoked_by TEXT,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (valid_until > valid_from)
);

CREATE TABLE IF NOT EXISTS clinical_records (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES clinical_subjects(id),
  record_type TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_version TEXT NOT NULL,
  source_resource_id TEXT NOT NULL,
  source_retrieved_at TIMESTAMPTZ NOT NULL,
  bundle_digest TEXT NOT NULL,
  encrypted_payload JSONB NOT NULL,
  encryption_key_version TEXT NOT NULL,
  retain_until TIMESTAMPTZ,
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, source_system, source_resource_id, bundle_digest)
);

CREATE TABLE IF NOT EXISTS clinical_recommendations (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES clinical_subjects(id),
  status TEXT NOT NULL CHECK (status IN ('clinician_review_required','safety_hold','approved','rejected','handed_off','acknowledged','withdrawn')),
  version INTEGER NOT NULL DEFAULT 1,
  author_id TEXT NOT NULL,
  reviewer_id TEXT,
  proposal_encrypted JSONB NOT NULL,
  safety_snapshot_encrypted JSONB NOT NULL,
  encryption_key_version TEXT NOT NULL,
  provenance JSONB NOT NULL,
  contraindications JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC,
  policy_version TEXT NOT NULL,
  review_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reviewer_id IS NULL OR reviewer_id <> author_id)
);

CREATE TABLE IF NOT EXISTS clinical_handoffs (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  recommendation_id UUID NOT NULL REFERENCES clinical_recommendations(id),
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  receiver_role TEXT NOT NULL CHECK (receiver_role IN ('clinician','caseworker')),
  status TEXT NOT NULL CHECK (status IN ('pending','acknowledged','declined')),
  note TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  UNIQUE (tenant_id, recommendation_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS clinical_deletion_queue (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  record_id UUID NOT NULL,
  requested_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_second_approval','approved','cancelled','completed')),
  decision_reason TEXT NOT NULL,
  second_approver_id TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  UNIQUE (tenant_id, record_id)
);

CREATE TABLE IF NOT EXISTS clinical_incidents (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_id UUID REFERENCES clinical_subjects(id),
  reporter_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('medium','high','critical')),
  status TEXT NOT NULL CHECK (status IN ('open','contained','investigating','notification_review','closed')),
  summary TEXT NOT NULL,
  preserve_evidence BOOLEAN NOT NULL DEFAULT TRUE,
  access_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_audit_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_id UUID,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  purpose TEXT NOT NULL,
  action TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  outcome TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION immutable_clinical_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'clinical audit is append-only'; END
$$;
DROP TRIGGER IF EXISTS clinical_audit_immutable ON clinical_audit_events;
CREATE TRIGGER clinical_audit_immutable BEFORE UPDATE OR DELETE ON clinical_audit_events FOR EACH ROW EXECUTE FUNCTION immutable_clinical_audit();

CREATE INDEX IF NOT EXISTS clinical_identities_login_idx ON clinical_identities (tenant_id, lower(email)) WHERE disabled_at IS NULL;
CREATE INDEX IF NOT EXISTS clinical_consents_active_idx ON clinical_consents (tenant_id, subject_id, status, valid_until);
CREATE INDEX IF NOT EXISTS clinical_records_subject_idx ON clinical_records (tenant_id, subject_id, record_type, created_at DESC);
CREATE INDEX IF NOT EXISTS clinical_recommendations_review_idx ON clinical_recommendations (tenant_id, status, created_at);
CREATE INDEX IF NOT EXISTS clinical_handoffs_receiver_idx ON clinical_handoffs (tenant_id, receiver_id, status);
CREATE INDEX IF NOT EXISTS clinical_incidents_status_idx ON clinical_incidents (tenant_id, status, severity);
CREATE INDEX IF NOT EXISTS clinical_audit_lookup_idx ON clinical_audit_events (tenant_id, subject_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS clinical_ai_results (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  identity_id TEXT NOT NULL REFERENCES clinical_identities(id) ON DELETE RESTRICT,
  prompt TEXT NOT NULL,
  model TEXT NOT NULL,
  provider_receipt JSONB NOT NULL,
  result TEXT NOT NULL,
  usage JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS clinical_ai_results_tenant_created_idx
  ON clinical_ai_results(tenant_id, created_at DESC);

COMMIT;
