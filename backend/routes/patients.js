const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, email, phone, blood_type, allergies, conditions, status } = req.body;
    const r = await pool.query(
      'INSERT INTO patients (first_name, last_name, date_of_birth, gender, email, phone, blood_type, allergies, conditions, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [first_name, last_name, date_of_birth, gender, email, phone, blood_type, allergies, conditions, status || 'active']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, email, phone, blood_type, allergies, conditions, status } = req.body;
    const r = await pool.query(
      'UPDATE patients SET first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, email=$5, phone=$6, blood_type=$7, allergies=$8, conditions=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [first_name, last_name, date_of_birth, gender, email, phone, blood_type, allergies, conditions, status, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
