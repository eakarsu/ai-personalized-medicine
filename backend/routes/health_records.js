const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT hr.*, p.first_name || \' \' || p.last_name AS patient_name FROM health_records hr LEFT JOIN patients p ON p.id = hr.patient_id ORDER BY hr.record_date DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT hr.*, p.first_name || \' \' || p.last_name AS patient_name FROM health_records hr LEFT JOIN patients p ON p.id = hr.patient_id WHERE hr.id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_id, record_type, title, description, record_date, doctor_name, facility, height_cm, weight_kg, blood_pressure, heart_rate, temperature } = req.body;
    const r = await pool.query(
      'INSERT INTO health_records (patient_id, record_type, title, description, record_date, doctor_name, facility, height_cm, weight_kg, blood_pressure, heart_rate, temperature) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [patient_id, record_type, title, description, record_date, doctor_name, facility, height_cm, weight_kg, blood_pressure, heart_rate, temperature]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_id, record_type, title, description, record_date, doctor_name, facility, height_cm, weight_kg, blood_pressure, heart_rate, temperature } = req.body;
    const r = await pool.query(
      'UPDATE health_records SET patient_id=$1, record_type=$2, title=$3, description=$4, record_date=$5, doctor_name=$6, facility=$7, height_cm=$8, weight_kg=$9, blood_pressure=$10, heart_rate=$11, temperature=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [patient_id, record_type, title, description, record_date, doctor_name, facility, height_cm, weight_kg, blood_pressure, heart_rate, temperature, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM health_records WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
