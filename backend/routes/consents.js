const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');

// Pass 7: Structured consent management — fulfills audit gap "No consents table".
// Synthetic-data only. All clinical decisions remain clinician-reviewed.

const DISCLAIMER = 'Not medical advice — consult a clinician.';

const ALLOWED_SCOPES = [
  'genomic-sharing', 'research-participation', 'mrna-therapy',
  'wearable-data', 'clinical-trial-match', 'ehr-share', 'pgx-prescribing'
];
const ALLOWED_STATUSES = ['granted', 'revoked', 'pending', 'expired'];

async function ensureTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS consents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    scope VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP,
    granted_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_consents_patient ON consents(patient_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_consents_scope ON consents(scope)');
}

router.use(auth);

router.get('/scopes', (req, res) => {
  res.json({ scopes: ALLOWED_SCOPES, statuses: ALLOWED_STATUSES, disclaimer: DISCLAIMER, synthetic_data_only: true });
});

router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const { patient_id, scope, status } = req.query;
    const parts = [];
    const args = [];
    if (patient_id) { args.push(patient_id); parts.push(`patient_id=$${args.length}`); }
    if (scope) { args.push(scope); parts.push(`scope=$${args.length}`); }
    if (status) { args.push(status); parts.push(`status=$${args.length}`); }
    const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
    const r = await pool.query(`SELECT * FROM consents ${where} ORDER BY updated_at DESC LIMIT 200`, args);
    res.json({ consents: r.rows, disclaimer: DISCLAIMER, synthetic_data_only: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureTable();
    const { patient_id, scope, status, granted_by, notes, expires_at } = req.body || {};
    if (!patient_id || !scope) return res.status(400).json({ error: 'patient_id and scope are required' });
    if (!ALLOWED_SCOPES.includes(scope)) return res.status(400).json({ error: `scope must be one of: ${ALLOWED_SCOPES.join(', ')}` });
    const useStatus = ALLOWED_STATUSES.includes(status) ? status : 'pending';
    const granted_at = useStatus === 'granted' ? new Date() : null;
    const revoked_at = useStatus === 'revoked' ? new Date() : null;
    const r = await pool.query(
      `INSERT INTO consents (patient_id, scope, status, granted_at, revoked_at, expires_at, granted_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patient_id, scope, useStatus, granted_at, revoked_at, expires_at || null, granted_by || req.user?.email || null, notes || null]
    );
    res.status(201).json({ consent: r.rows[0], disclaimer: DISCLAIMER, synthetic_data_only: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    await ensureTable();
    const { status, notes } = req.body || {};
    if (!ALLOWED_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    const granted_at = status === 'granted' ? new Date() : null;
    const revoked_at = status === 'revoked' ? new Date() : null;
    const r = await pool.query(
      `UPDATE consents SET status=$1, granted_at=COALESCE($2, granted_at), revoked_at=COALESCE($3, revoked_at), notes=COALESCE($4, notes), updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [status, granted_at, revoked_at, notes || null, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'consent not found' });
    res.json({ consent: r.rows[0], disclaimer: DISCLAIMER, synthetic_data_only: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/patient/:id/active', async (req, res) => {
  try {
    await ensureTable();
    const r = await pool.query(
      `SELECT scope FROM consents WHERE patient_id=$1 AND status='granted'
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [req.params.id]
    );
    res.json({ patient_id: Number(req.params.id), active_scopes: r.rows.map(x => x.scope), disclaimer: DISCLAIMER, synthetic_data_only: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
