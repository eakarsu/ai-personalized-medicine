const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT m.*, p.first_name || \' \' || p.last_name AS patient_name FROM medications m LEFT JOIN patients p ON p.id = m.patient_id ORDER BY m.created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT m.*, p.first_name || \' \' || p.last_name AS patient_name FROM medications m LEFT JOIN patients p ON p.id = m.patient_id WHERE m.id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_id, name, generic_name, dosage, frequency, route, indication, prescriber, start_date, end_date, status, side_effects, notes } = req.body;
    const r = await pool.query(
      'INSERT INTO medications (patient_id, name, generic_name, dosage, frequency, route, indication, prescriber, start_date, end_date, status, side_effects, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [patient_id, name, generic_name, dosage, frequency, route, indication, prescriber, start_date, end_date, status || 'active', side_effects, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_id, name, generic_name, dosage, frequency, route, indication, prescriber, start_date, end_date, status, side_effects, notes } = req.body;
    const r = await pool.query(
      'UPDATE medications SET patient_id=$1, name=$2, generic_name=$3, dosage=$4, frequency=$5, route=$6, indication=$7, prescriber=$8, start_date=$9, end_date=$10, status=$11, side_effects=$12, notes=$13, updated_at=NOW() WHERE id=$14 RETURNING *',
      [patient_id, name, generic_name, dosage, frequency, route, indication, prescriber, start_date, end_date, status, side_effects, notes, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM medications WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
