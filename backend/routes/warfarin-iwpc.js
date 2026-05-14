// Warfarin IWPC Pharmacogenetic Dose Estimator
//
// Implements the validated IWPC 2009 pharmacogenetic algorithm:
//
//   sqrt(weekly_dose_mg) =
//     5.6044
//     - 0.2614 * age_decade
//     + 0.0087 * height_cm
//     + 0.0128 * weight_kg
//     - 0.8677 * VKORC1_AG
//     - 1.6974 * VKORC1_AA
//     - 0.4854 * VKORC1_unk
//     - 0.5211 * CYP2C9_12
//     - 0.9357 * CYP2C9_13
//     - 1.0616 * CYP2C9_22
//     - 1.9206 * CYP2C9_23
//     - 2.3312 * CYP2C9_33
//     - 0.2188 * CYP2C9_unk
//     - 0.1092 * Asian
//     - 0.2760 * Black/AfricanAmerican
//     - 0.1032 * MissingRace
//     + 1.1816 * EnzymeInducer
//     - 0.5503 * Amiodarone
//
// Square the result to obtain the predicted weekly dose in mg.
// Reference: IWPC (NEJM 2009;360:753–764).
//
// Endpoints:
//   POST  /api/warfarin-iwpc/predict             — compute dose for arbitrary input
//   POST  /api/warfarin-iwpc/predict/:patient_id — compute dose using stored PGx + vitals
//   GET   /api/warfarin-iwpc/history             — historical predictions
//   GET   /api/warfarin-iwpc/history/:patient_id — per-patient history

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

function cyp2c9Indicator(g) {
  // Returns flags {12,13,22,23,33,unk}
  const norm = String(g || '').replace(/\s/g, '').toUpperCase().replace(/CYP2C9/g, '');
  const flags = { 12:0, 13:0, 22:0, 23:0, 33:0, unk:0 };
  const map = {
    '*1/*1': null, '*1/*2': '12', '*1/*3': '13',
    '*2/*2': '22', '*2/*3': '23', '*3/*3': '33',
    '*2/*1': '12', '*3/*1': '13', '*3/*2': '23',
  };
  if (!norm) { flags.unk = 1; return flags; }
  if (map[norm] === null) return flags;
  if (map[norm]) { flags[map[norm]] = 1; return flags; }
  flags.unk = 1;
  return flags;
}

function vkorc1Indicator(g) {
  // rs9923231 G/G, A/G, A/A
  const norm = String(g || '').replace(/\s/g, '').toUpperCase();
  if (norm === 'G/G' || norm === 'GG') return { AG: 0, AA: 0, unk: 0 };
  if (norm === 'A/G' || norm === 'AG' || norm === 'G/A') return { AG: 1, AA: 0, unk: 0 };
  if (norm === 'A/A' || norm === 'AA') return { AG: 0, AA: 1, unk: 0 };
  return { AG: 0, AA: 0, unk: 1 };
}

function raceFlags(race) {
  const r = String(race || '').toLowerCase();
  return {
    asian: r.includes('asian') ? 1 : 0,
    black: (r.includes('black') || r.includes('african')) ? 1 : 0,
    missing: !r ? 1 : 0,
  };
}

function predictWeeklyDose({ age_years, height_cm, weight_kg, cyp2c9, vkorc1, race, amiodarone_use, enzyme_inducer_use }) {
  if (age_years == null || height_cm == null || weight_kg == null) {
    throw new Error('age_years, height_cm, weight_kg are required');
  }
  const decade = Math.floor(age_years / 10);
  const v = vkorc1Indicator(vkorc1);
  const c = cyp2c9Indicator(cyp2c9);
  const rf = raceFlags(race);

  const sqrtDose =
      5.6044
    - 0.2614 * decade
    + 0.0087 * Number(height_cm)
    + 0.0128 * Number(weight_kg)
    - 0.8677 * v.AG
    - 1.6974 * v.AA
    - 0.4854 * v.unk
    - 0.5211 * c[12]
    - 0.9357 * c[13]
    - 1.0616 * c[22]
    - 1.9206 * c[23]
    - 2.3312 * c[33]
    - 0.2188 * c.unk
    - 0.1092 * rf.asian
    - 0.2760 * rf.black
    - 0.1032 * rf.missing
    + 1.1816 * (enzyme_inducer_use ? 1 : 0)
    - 0.5503 * (amiodarone_use ? 1 : 0);

  const weekly = Math.max(0.5, Math.pow(sqrtDose, 2));
  const daily = weekly / 7;
  return {
    sqrt_dose_intermediate: +sqrtDose.toFixed(4),
    predicted_weekly_dose_mg: +weekly.toFixed(2),
    predicted_daily_dose_mg: +daily.toFixed(3),
    contributing_factors: {
      age_decade: decade,
      vkorc1: v,
      cyp2c9: c,
      race: rf,
      enzyme_inducer: !!enzyme_inducer_use,
      amiodarone: !!amiodarone_use,
    }
  };
}

router.post('/predict', async (req, res) => {
  try {
    const out = predictWeeklyDose(req.body || {});
    res.json({
      ...out,
      target_inr: '2.0–3.0',
      algorithm: 'IWPC-2009',
      reference: 'NEJM 2009;360:753–764 (Estimation of warfarin maintenance dose based on genotype)',
      disclaimer: 'Educational use only. Clinical dosing must integrate baseline INR, comorbidities, and concurrent meds.'
    });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/predict/:patient_id', async (req, res) => {
  try {
    const patient_id = parseInt(req.params.patient_id, 10);
    const pq = await pool.query(`SELECT * FROM patients WHERE id = $1`, [patient_id]);
    if (!pq.rows.length) return res.status(404).json({ error: 'Patient not found' });
    const p = pq.rows[0];
    const dob = p.date_of_birth ? new Date(p.date_of_birth) : null;
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

    // Pull most recent height/weight from health_records.
    const hr = await pool.query(`
      SELECT height_cm, weight_kg FROM health_records
      WHERE patient_id = $1 AND height_cm IS NOT NULL AND weight_kg IS NOT NULL
      ORDER BY record_date DESC NULLS LAST, created_at DESC LIMIT 1
    `, [patient_id]);
    const height_cm = req.body?.height_cm || hr.rows[0]?.height_cm || null;
    const weight_kg = req.body?.weight_kg || hr.rows[0]?.weight_kg || null;

    // Pull CYP2C9 + VKORC1 from pgx_diplotypes.
    const dipl = await pool.query(`SELECT gene, allele1, allele2 FROM pgx_diplotypes WHERE patient_id = $1 AND gene IN ('CYP2C9','VKORC1')`, [patient_id]);
    let cyp2c9 = req.body?.cyp2c9 || null;
    let vkorc1 = req.body?.vkorc1 || null;
    for (const row of dipl.rows) {
      if (row.gene === 'CYP2C9' && !cyp2c9) cyp2c9 = `${row.allele1}/${row.allele2}`;
      if (row.gene === 'VKORC1' && !vkorc1) {
        // Promoter -1639A/A -> A/A; otherwise G/G
        const a1 = String(row.allele1).includes('A') ? 'A' : 'G';
        const a2 = String(row.allele2).includes('A') ? 'A' : 'G';
        vkorc1 = `${a1}/${a2}`;
      }
    }

    const out = predictWeeklyDose({
      age_years: age, height_cm, weight_kg,
      cyp2c9, vkorc1,
      race: req.body?.race || null,
      amiodarone_use: req.body?.amiodarone_use || false,
      enzyme_inducer_use: req.body?.enzyme_inducer_use || false,
    });

    // Persist prediction.
    try {
      await pool.query(`
        INSERT INTO warfarin_doses
          (patient_id, cyp2c9_genotype, vkorc1_rs9923231, age_years, height_cm, weight_kg,
           amiodarone_use, enzyme_inducer_use, predicted_weekly_dose_mg, predicted_daily_dose_mg, algorithm_version, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'IWPC-2009',$11)
      `, [
        patient_id, cyp2c9 || null, vkorc1 || null, age, height_cm, weight_kg,
        !!req.body?.amiodarone_use, !!req.body?.enzyme_inducer_use,
        out.predicted_weekly_dose_mg, out.predicted_daily_dose_mg,
        req.body?.notes || null
      ]);
    } catch (e) { /* persistence optional */ }

    res.json({
      patient: { id: p.id, first_name: p.first_name, last_name: p.last_name, age },
      inputs: { height_cm, weight_kg, cyp2c9, vkorc1, amiodarone_use: !!req.body?.amiodarone_use, enzyme_inducer_use: !!req.body?.enzyme_inducer_use },
      ...out,
      target_inr: '2.0–3.0',
      algorithm: 'IWPC-2009',
      disclaimer: 'Educational use only. Verify with INR titration; consider drug-drug interactions.'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/history', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT w.*, p.first_name, p.last_name
      FROM warfarin_doses w
      LEFT JOIN patients p ON p.id = w.patient_id
      ORDER BY w.created_at DESC LIMIT 100
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/history/:patient_id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM warfarin_doses WHERE patient_id = $1 ORDER BY created_at DESC`, [req.params.patient_id]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
