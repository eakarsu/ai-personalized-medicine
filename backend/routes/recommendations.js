const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT rec.*, p.first_name || \' \' || p.last_name AS patient_name FROM treatment_recommendations rec LEFT JOIN patients p ON p.id = rec.patient_id ORDER BY rec.created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT rec.*, p.first_name || \' \' || p.last_name AS patient_name FROM treatment_recommendations rec LEFT JOIN patients p ON p.id = rec.patient_id WHERE rec.id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_id, recommendation_type, title, description, priority, evidence_level, status, rationale, contraindications, notes } = req.body;
    const r = await pool.query(
      'INSERT INTO treatment_recommendations (patient_id, recommendation_type, title, description, priority, evidence_level, status, rationale, contraindications, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [patient_id, recommendation_type, title, description, priority || 'medium', evidence_level, status || 'active', rationale, contraindications, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_id, recommendation_type, title, description, priority, evidence_level, status, rationale, contraindications, notes } = req.body;
    const r = await pool.query(
      'UPDATE treatment_recommendations SET patient_id=$1, recommendation_type=$2, title=$3, description=$4, priority=$5, evidence_level=$6, status=$7, rationale=$8, contraindications=$9, notes=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [patient_id, recommendation_type, title, description, priority, evidence_level, status, rationale, contraindications, notes, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM treatment_recommendations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
