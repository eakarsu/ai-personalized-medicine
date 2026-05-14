const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT gm.*, p.first_name || \' \' || p.last_name AS patient_name FROM genome_markers gm LEFT JOIN patients p ON p.id = gm.patient_id ORDER BY gm.created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT gm.*, p.first_name || \' \' || p.last_name AS patient_name FROM genome_markers gm LEFT JOIN patients p ON p.id = gm.patient_id WHERE gm.id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { patient_id, gene_name, variant, chromosome, position, significance, condition_association, confidence_score, notes } = req.body;
    const r = await pool.query(
      'INSERT INTO genome_markers (patient_id, gene_name, variant, chromosome, position, significance, condition_association, confidence_score, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [patient_id, gene_name, variant, chromosome, position, significance, condition_association, confidence_score, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { patient_id, gene_name, variant, chromosome, position, significance, condition_association, confidence_score, notes } = req.body;
    const r = await pool.query(
      'UPDATE genome_markers SET patient_id=$1, gene_name=$2, variant=$3, chromosome=$4, position=$5, significance=$6, condition_association=$7, confidence_score=$8, notes=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [patient_id, gene_name, variant, chromosome, position, significance, condition_association, confidence_score, notes, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM genome_markers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
