const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT lr.*, p.first_name || \' \' || p.last_name AS patient_name FROM lab_results lr LEFT JOIN patients p ON p.id = lr.patient_id ORDER BY lr.test_date DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT lr.*, p.first_name || \' \' || p.last_name AS patient_name FROM lab_results lr LEFT JOIN patients p ON p.id = lr.patient_id WHERE lr.id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_id, test_name, category, value, unit, reference_range, status, test_date, lab_name, notes } = req.body;
    const r = await pool.query(
      'INSERT INTO lab_results (patient_id, test_name, category, value, unit, reference_range, status, test_date, lab_name, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [patient_id, test_name, category, value, unit, reference_range, status || 'normal', test_date, lab_name, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_id, test_name, category, value, unit, reference_range, status, test_date, lab_name, notes } = req.body;
    const r = await pool.query(
      'UPDATE lab_results SET patient_id=$1, test_name=$2, category=$3, value=$4, unit=$5, reference_range=$6, status=$7, test_date=$8, lab_name=$9, notes=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [patient_id, test_name, category, value, unit, reference_range, status, test_date, lab_name, notes, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM lab_results WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
