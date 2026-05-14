const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const DISCLAIMER = 'Not medical advice — consult a clinician.';

// Whitelist of exportable / searchable resources to avoid SQL injection
const RESOURCES = {
  patients: {
    table: 'patients',
    columns: ['id','first_name','last_name','date_of_birth','gender','email','phone','blood_type','allergies','conditions','status','created_at'],
    searchable: ['first_name','last_name','email','phone','blood_type','conditions','allergies','status'],
    filterable: ['gender','blood_type','status']
  },
  health_records: {
    table: 'health_records',
    columns: ['id','patient_id','record_type','title','description','record_date','doctor_name','facility','height_cm','weight_kg','blood_pressure','heart_rate','temperature','created_at'],
    searchable: ['record_type','title','description','doctor_name','facility'],
    filterable: ['record_type','patient_id']
  },
  genome_markers: {
    table: 'genome_markers',
    columns: ['id','patient_id','gene_name','variant','chromosome','position','significance','condition_association','confidence_score','notes','created_at'],
    searchable: ['gene_name','variant','chromosome','significance','condition_association','notes'],
    filterable: ['significance','patient_id']
  },
  medications: {
    table: 'medications',
    columns: ['id','patient_id','name','generic_name','dosage','frequency','route','indication','prescriber','start_date','end_date','status','side_effects','notes','created_at'],
    searchable: ['name','generic_name','dosage','indication','prescriber','side_effects'],
    filterable: ['status','route','patient_id']
  },
  lab_results: {
    table: 'lab_results',
    columns: ['id','patient_id','test_name','category','value','unit','reference_range','status','test_date','lab_name','notes','created_at'],
    searchable: ['test_name','category','unit','reference_range','lab_name','notes'],
    filterable: ['status','category','patient_id']
  },
  recommendations: {
    table: 'treatment_recommendations',
    columns: ['id','patient_id','recommendation_type','title','description','priority','evidence_level','status','rationale','contraindications','notes','created_at'],
    searchable: ['title','description','rationale','contraindications','notes'],
    filterable: ['priority','status','recommendation_type','patient_id']
  }
};

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

async function audit(req, action, target, meta) {
  try {
    await pool.query(
      'INSERT INTO audit_log (user_id, user_email, action, target, meta) VALUES ($1,$2,$3,$4,$5)',
      [req.user?.id || null, req.user?.email || null, action, target || null, meta ? JSON.stringify(meta) : null]
    );
  } catch (_) { /* non-fatal */ }
}

// ===== CSV Export =====
// GET /api/utility/export/:resource.csv
router.get('/export/:resource.csv', auth, async (req, res) => {
  try {
    const meta = RESOURCES[req.params.resource];
    if (!meta) return res.status(400).json({ error: 'Unknown resource' });
    const r = await pool.query(`SELECT ${meta.columns.join(',')} FROM ${meta.table} ORDER BY id`);
    const header = meta.columns.join(',');
    const lines = r.rows.map(row => meta.columns.map(c => csvEscape(row[c])).join(','));
    const csv = [header, ...lines].join('\n');
    await audit(req, 'utility.export_csv', req.params.resource, { rows: r.rows.length });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.resource}.csv"`);
    res.send(csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// List resources available for export / search (used by frontend)
router.get('/resources', auth, (_req, res) => {
  res.json(Object.fromEntries(Object.entries(RESOURCES).map(([k, v]) => [k, { searchable: v.searchable, filterable: v.filterable, columns: v.columns }])));
});

// ===== Search + Filter =====
// GET /api/utility/search/:resource?q=...&filter[col]=val&limit=&offset=
router.get('/search/:resource', auth, async (req, res) => {
  try {
    const meta = RESOURCES[req.params.resource];
    if (!meta) return res.status(400).json({ error: 'Unknown resource' });
    const q = (req.query.q || '').toString().trim();
    const filterParam = req.query.filter;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const where = [];
    const params = [];

    if (q && meta.searchable.length) {
      const pieces = meta.searchable.map(col => {
        params.push(`%${q.toLowerCase()}%`);
        return `LOWER(COALESCE(${col}::text,'')) LIKE $${params.length}`;
      });
      where.push('(' + pieces.join(' OR ') + ')');
    }

    if (filterParam && typeof filterParam === 'object') {
      for (const [k, v] of Object.entries(filterParam)) {
        if (!meta.filterable.includes(k) || v === '' || v === undefined || v === null) continue;
        params.push(v);
        where.push(`${k} = $${params.length}`);
      }
    }

    const sql = `SELECT ${meta.columns.join(',')} FROM ${meta.table} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    const r = await pool.query(sql, params);
    await audit(req, 'utility.search', req.params.resource, { q, count: r.rowCount });
    res.json({ resource: req.params.resource, count: r.rowCount, rows: r.rows, disclaimer: DISCLAIMER });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Audit Log =====
// GET /api/utility/audit-log?limit=&offset=&action=
router.get('/audit-log', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const where = [];
    const params = [];
    if (req.query.action) { params.push(req.query.action); where.push(`action = $${params.length}`); }
    if (req.query.user_email) { params.push(req.query.user_email); where.push(`user_email = $${params.length}`); }
    const sql = `SELECT id, user_id, user_email, action, target, meta, created_at FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    const r = await pool.query(sql, params);
    res.json({ count: r.rowCount, rows: r.rows });
  } catch (e) {
    // If table missing, return empty list rather than 500
    if (/relation .* does not exist/i.test(e.message)) {
      return res.json({ count: 0, rows: [], note: 'audit_log table not yet created — re-run schema.sql' });
    }
    res.status(500).json({ error: e.message });
  }
});

// POST /api/utility/audit-log — manual entry (e.g. from frontend client-side events)
router.post('/audit-log', auth, async (req, res) => {
  try {
    const { action, target, meta } = req.body;
    if (!action) return res.status(400).json({ error: 'action required' });
    const r = await pool.query(
      'INSERT INTO audit_log (user_id, user_email, action, target, meta) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user?.id || null, req.user?.email || null, action, target || null, meta ? JSON.stringify(meta) : null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
