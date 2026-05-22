const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');

// Pass 7: HIPAA-grade field-level access tracking — fulfills audit gap
// "No HIPAA-grade audit (audit_log present but no field-level access tracking)".
// Synthetic-data only. Not medical advice — all clinical interpretation is clinician-reviewed.

const DISCLAIMER = 'Not medical advice — consult a clinician.';

async function ensureTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS field_access_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_email VARCHAR(255),
    patient_id INTEGER,
    resource VARCHAR(64) NOT NULL,
    field VARCHAR(128) NOT NULL,
    action VARCHAR(32) NOT NULL,
    reason TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_fa_patient ON field_access_log(patient_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_fa_field ON field_access_log(resource, field)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_fa_user ON field_access_log(user_id)');
}

router.use(auth);

router.post('/', async (req, res) => {
  try {
    await ensureTable();
    const { patient_id, resource, field, action, reason } = req.body || {};
    if (!resource || !field || !action) return res.status(400).json({ error: 'resource, field, and action are required' });
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().slice(0, 64);
    const r = await pool.query(
      `INSERT INTO field_access_log (user_id, user_email, patient_id, resource, field, action, reason, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user?.id || null, req.user?.email || null, patient_id || null, resource, field, action, reason || null, ip]
    );
    res.status(201).json({ entry: r.rows[0], disclaimer: DISCLAIMER, synthetic_data_only: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const { patient_id, resource, field, action, user_email, limit } = req.query;
    const parts = [];
    const args = [];
    if (patient_id) { args.push(patient_id); parts.push(`patient_id=$${args.length}`); }
    if (resource) { args.push(resource); parts.push(`resource=$${args.length}`); }
    if (field) { args.push(field); parts.push(`field=$${args.length}`); }
    if (action) { args.push(action); parts.push(`action=$${args.length}`); }
    if (user_email) { args.push(user_email); parts.push(`user_email=$${args.length}`); }
    const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit, 10) || 100, 500);
    const r = await pool.query(`SELECT * FROM field_access_log ${where} ORDER BY created_at DESC LIMIT ${lim}`, args);
    res.json({ entries: r.rows, disclaimer: DISCLAIMER, synthetic_data_only: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/summary/:patient_id', async (req, res) => {
  try {
    await ensureTable();
    const r = await pool.query(
      `SELECT resource, field, action, COUNT(*)::int AS access_count, MAX(created_at) AS last_access
         FROM field_access_log WHERE patient_id=$1
         GROUP BY resource, field, action ORDER BY access_count DESC`,
      [req.params.patient_id]
    );
    res.json({ patient_id: Number(req.params.patient_id), summary: r.rows, disclaimer: DISCLAIMER, synthetic_data_only: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
