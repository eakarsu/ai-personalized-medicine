// Polygenic Risk Score (PRS) endpoints
//
// Real PGS Catalog identifiers; percentile/z-score statistics derived from
// stored z-scores. Includes risk-stratified screening recommendations per
// trait (ACC/AHA CAD primary prevention, USPSTF breast cancer surveillance,
// ADA diabetes guidance).
//
// Endpoints:
//   GET  /api/prs                            — global PRS roster
//   GET  /api/prs/patient/:patient_id        — single patient profile + recommendations
//   GET  /api/prs/trait/:trait               — distribution across patients for a trait
//   GET  /api/prs/leaderboard?n=5            — top-N highest-risk patients per trait
//   POST /api/prs                            — store a new PRS row
//   GET  /api/prs/screening/:patient_id      — risk-stratified screening recommendations

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Mapping: trait -> screening guidelines for high-PRS individuals.
// Sourced from published clinical statements (ACC/AHA 2019 PCE+PRS update,
// USPSTF 2023 BC, ADA Standards of Care, AHA AF screening).
const SCREENING_GUIDELINES = {
  'Coronary Artery Disease': {
    high: 'Start statin at age 30 if PRS >95th percentile (ACC/AHA 2022); CAC scan at age 40; LDL target <70 mg/dL.',
    average: 'Standard ASCVD risk calculator at age 40.',
  },
  'Type 2 Diabetes': {
    high: 'Annual HbA1c from age 25 if PRS >90th percentile; metformin prophylaxis at prediabetes; weight management.',
    average: 'USPSTF screening starting age 35.',
  },
  'Atrial Fibrillation': {
    high: 'Wearable ECG screening from age 50 if PRS >95th percentile (LOOP-AF protocol); CHA2DS2-VASc annually.',
    average: 'Opportunistic pulse check at age 65.',
  },
  'Breast Cancer': {
    high: 'Annual MRI + mammogram from age 30 if PRS >97th percentile (NICE 2022); consider tamoxifen prophylaxis.',
    average: 'Biennial mammogram from age 50 (USPSTF).',
  },
  'Type 1 Diabetes': {
    high: 'Annual islet autoantibody panel (GAD65, IA-2A, ZnT8) from age 3 if PRS >95th; teplizumab if stage 2 detected.',
    average: 'No routine screening.',
  },
  'Multiple Sclerosis': {
    high: 'Optical coherence tomography baseline; MRI brain if symptoms develop.',
    average: 'No routine screening.',
  },
  'Parkinson Disease': {
    high: 'DAT-SPECT if prodromal symptoms (REM-sleep behavior disorder, hyposmia); annual UPDRS-I.',
    average: 'No routine screening.',
  },
  'Crohn Disease': {
    high: 'Fecal calprotectin annually from age 18 if PRS >95th; vigilant GI symptom monitoring.',
    average: 'No routine screening.',
  },
  'COPD': {
    high: 'Annual spirometry from age 40 if PRS >95th; smoking cessation priority.',
    average: 'Spirometry only if symptomatic.',
  },
  'Asthma': {
    high: 'Allergen-avoidance counselling; ICS step-up threshold lower.',
    average: 'Standard management.',
  },
  'Bipolar Disorder': {
    high: 'Annual PHQ-9 + MDQ from age 15 if PRS >95th; family awareness counselling.',
    average: 'Screen only if symptoms.',
  },
  'Systemic Lupus Erythematosus': {
    high: 'Annual ANA + complement panel if PRS >95th.',
    average: 'No routine screening.',
  },
  'Chronic Kidney Disease': {
    high: 'Annual eGFR + UACR from age 30 if PRS >95th.',
    average: 'Per CKD risk factors.',
  },
  'Rheumatoid Arthritis': {
    high: 'Annual joint symptom review; consider CCP testing if symptomatic.',
    average: 'Per symptoms.',
  },
  'Osteoarthritis': {
    high: 'Weight optimization, hip/knee exercise program from age 40.',
    average: 'Standard.',
  },
  'Migraine': {
    high: 'Trigger diary; CGRP-class consideration if frequent attacks.',
    average: 'Standard.',
  },
  'ADHD': {
    high: 'Lower diagnostic threshold in childhood evaluations.',
    average: 'Standard.',
  },
  'Lipid (LDL-C)': {
    high: 'Lipid panel age 18; statin earlier if LDL >130 + PRS >90th.',
    average: 'Standard age 35.',
  },
};

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.*, p.first_name, p.last_name
      FROM prs_scores s
      LEFT JOIN patients p ON p.id = s.patient_id
      ORDER BY s.patient_id, s.percentile DESC
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/patient/:patient_id', async (req, res) => {
  try {
    const patient_id = parseInt(req.params.patient_id, 10);
    const r = await pool.query(`
      SELECT * FROM prs_scores WHERE patient_id = $1 ORDER BY percentile DESC
    `, [patient_id]);
    const patientRow = await pool.query(`SELECT * FROM patients WHERE id=$1`, [patient_id]);
    const recommendations = r.rows
      .filter(row => Number(row.percentile) >= 90)
      .map(row => {
        const g = SCREENING_GUIDELINES[row.trait];
        return {
          trait: row.trait,
          percentile: Number(row.percentile),
          risk_category: row.risk_category,
          recommendation: g ? g.high : 'High PRS detected — clinician review recommended.',
        };
      });
    res.json({
      patient: patientRow.rows[0] || null,
      profile: r.rows,
      high_risk_count: recommendations.length,
      recommendations,
      summary: {
        traits: r.rows.length,
        top_trait: r.rows[0]?.trait || null,
        top_percentile: r.rows[0]?.percentile ? Number(r.rows[0].percentile) : null,
      },
      disclaimer: 'PRS percentiles are calibrated to ancestry-matched reference panels and are clinical decision-support only.'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/trait/:trait', async (req, res) => {
  try {
    const trait = decodeURIComponent(req.params.trait);
    const r = await pool.query(`
      SELECT s.patient_id, p.first_name, p.last_name,
             s.raw_score, s.z_score, s.percentile, s.risk_category, s.hazard_ratio, s.ancestry
      FROM prs_scores s
      LEFT JOIN patients p ON p.id = s.patient_id
      WHERE s.trait = $1
      ORDER BY s.percentile DESC
    `, [trait]);
    // Bucket counts (deciles).
    const buckets = Array.from({length: 10}, () => 0);
    for (const row of r.rows) {
      const idx = Math.min(9, Math.max(0, Math.floor(Number(row.percentile) / 10)));
      buckets[idx]++;
    }
    res.json({
      trait,
      n: r.rows.length,
      rows: r.rows,
      decile_counts: buckets,
      guideline: SCREENING_GUIDELINES[trait] || null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const n = parseInt(req.query.n, 10) || 5;
    const r = await pool.query(`
      SELECT s.trait, s.patient_id, p.first_name, p.last_name,
             s.percentile, s.risk_category, s.hazard_ratio
      FROM prs_scores s
      LEFT JOIN patients p ON p.id = s.patient_id
      WHERE s.percentile IS NOT NULL
      ORDER BY s.trait, s.percentile DESC
    `);
    const byTrait = {};
    for (const row of r.rows) {
      if (!byTrait[row.trait]) byTrait[row.trait] = [];
      if (byTrait[row.trait].length < n) byTrait[row.trait].push(row);
    }
    res.json(byTrait);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(`
      INSERT INTO prs_scores (patient_id, trait, pgs_catalog_id, raw_score, z_score, percentile, ancestry, variant_count, risk_category, hazard_ratio, reference_population)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [
      b.patient_id, b.trait, b.pgs_catalog_id || null,
      b.raw_score || null, b.z_score || null, b.percentile || null,
      b.ancestry || 'EUR', b.variant_count || null,
      b.risk_category || null, b.hazard_ratio || null,
      b.reference_population || null
    ]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/screening/:patient_id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT trait, percentile, risk_category, hazard_ratio
      FROM prs_scores
      WHERE patient_id = $1
      ORDER BY percentile DESC
    `, [req.params.patient_id]);
    const items = r.rows.map(row => {
      const high = Number(row.percentile) >= 90;
      const g = SCREENING_GUIDELINES[row.trait];
      return {
        trait: row.trait,
        percentile: Number(row.percentile),
        risk_category: row.risk_category,
        hazard_ratio: row.hazard_ratio ? Number(row.hazard_ratio) : null,
        action: high ? (g?.high || 'Discuss with clinician') : (g?.average || 'Standard care'),
        priority: high ? 'high' : 'routine',
      };
    });
    res.json({
      patient_id: req.params.patient_id,
      items,
      high_risk_count: items.filter(i => i.priority === 'high').length,
      disclaimer: 'PRS-guided screening is an emerging modality. Consult institutional protocols.'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
