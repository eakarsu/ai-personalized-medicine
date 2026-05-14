// CPIC-style Pharmacogenomics Decision Support
//
// Implements gene/drug rule lookup against patient diplotypes for the
// 24 CPIC Level A pairs seeded in pgx_drug_rules.
//
// Endpoints:
//   GET  /api/pgx-cpic/diplotypes                      — full diplotype roster (joined with patient)
//   GET  /api/pgx-cpic/diplotypes/:patient_id          — diplotypes for one patient
//   GET  /api/pgx-cpic/rules                           — full CPIC rule table
//   GET  /api/pgx-cpic/rules/:gene                     — rules for a given gene
//   GET  /api/pgx-cpic/check?patient_id=&drug=         — patient-specific prescribing check
//   GET  /api/pgx-cpic/coverage/:patient_id            — full CPIC coverage report for a patient
//   POST /api/pgx-cpic/diplotypes                      — record a new diplotype call

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Phenotype -> "alert level" mapping shared by the UI badges.
function alertLevel(classification) {
  switch ((classification || '').toLowerCase()) {
    case 'avoid':         return 'critical';
    case 'alternative':   return 'critical';
    case 'reduce dose':   return 'warning';
    case 'increase dose': return 'warning';
    case 'standard':      return 'ok';
    default:              return 'info';
  }
}

router.get('/diplotypes', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT d.id, d.patient_id, p.first_name, p.last_name,
             d.gene, d.allele1, d.allele2, d.phenotype, d.activity_score,
             d.source, d.reported_at, d.notes
      FROM pgx_diplotypes d
      LEFT JOIN patients p ON p.id = d.patient_id
      ORDER BY d.patient_id, d.gene
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/diplotypes/:patient_id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM pgx_diplotypes WHERE patient_id = $1 ORDER BY gene`,
      [req.params.patient_id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/diplotypes', async (req, res) => {
  try {
    const { patient_id, gene, allele1, allele2, phenotype, activity_score, source, reported_at, notes } = req.body || {};
    if (!patient_id || !gene || !allele1 || !allele2) {
      return res.status(400).json({ error: 'patient_id, gene, allele1, allele2 required' });
    }
    const r = await pool.query(
      `INSERT INTO pgx_diplotypes (patient_id, gene, allele1, allele2, phenotype, activity_score, source, reported_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_id, gene, allele1, allele2, phenotype || null, activity_score || null, source || 'sequencing', reported_at || null, notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/rules', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM pgx_drug_rules ORDER BY gene, drug, phenotype`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/rules/:gene', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM pgx_drug_rules WHERE LOWER(gene) = LOWER($1) ORDER BY drug, phenotype`,
      [req.params.gene]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Patient-specific prescribing check — main clinical workflow.
router.get('/check', async (req, res) => {
  try {
    const patient_id = parseInt(req.query.patient_id, 10);
    const drug = String(req.query.drug || '').trim();
    if (!patient_id || !drug) return res.status(400).json({ error: 'patient_id & drug required' });

    const diplotypeRows = await pool.query(
      `SELECT gene, allele1, allele2, phenotype, activity_score
         FROM pgx_diplotypes WHERE patient_id = $1`,
      [patient_id]
    );
    const ruleRows = await pool.query(
      `SELECT gene, phenotype, recommendation, classification, evidence_level, cpic_guideline
         FROM pgx_drug_rules WHERE LOWER(drug) = LOWER($1)`,
      [drug]
    );

    const matches = [];
    const missingGenes = new Set();
    for (const rule of ruleRows.rows) {
      const dipl = diplotypeRows.rows.find(d => d.gene.toLowerCase() === rule.gene.toLowerCase());
      if (!dipl) { missingGenes.add(rule.gene); continue; }
      if ((dipl.phenotype || '').toLowerCase() === (rule.phenotype || '').toLowerCase()) {
        matches.push({
          gene: rule.gene,
          allele1: dipl.allele1,
          allele2: dipl.allele2,
          phenotype: dipl.phenotype,
          activity_score: dipl.activity_score,
          classification: rule.classification,
          alert: alertLevel(rule.classification),
          recommendation: rule.recommendation,
          evidence_level: rule.evidence_level,
          cpic_guideline: rule.cpic_guideline,
        });
      }
    }

    // Overall verdict: worst alert wins.
    const order = { ok: 0, info: 1, warning: 2, critical: 3 };
    const verdict = matches.reduce((acc, m) => order[m.alert] > order[acc] ? m.alert : acc, 'ok');
    const verdictText = {
      ok: 'No PGx contraindications. Use label-recommended dose.',
      info: 'No CPIC actionable variant on file for this drug.',
      warning: 'Dose adjustment recommended based on patient genotype.',
      critical: 'Genotype contraindicates this drug. Use alternative.',
    }[verdict];

    res.json({
      patient_id, drug,
      verdict, verdict_text: verdictText,
      matches,
      missing_genes: Array.from(missingGenes),
      diplotype_count: diplotypeRows.rows.length,
      rule_count: ruleRows.rows.length,
      disclaimer: 'CPIC guidance is informational. Final prescribing decisions require clinician judgement.'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Coverage report — every drug rule that fires against this patient's diplotypes.
router.get('/coverage/:patient_id', async (req, res) => {
  try {
    const patient_id = parseInt(req.params.patient_id, 10);
    if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

    const r = await pool.query(`
      SELECT d.gene, d.allele1, d.allele2, d.phenotype, d.activity_score,
             r.drug, r.classification, r.recommendation, r.evidence_level, r.cpic_guideline
      FROM pgx_diplotypes d
      JOIN pgx_drug_rules r
        ON LOWER(r.gene) = LOWER(d.gene)
       AND LOWER(r.phenotype) = LOWER(d.phenotype)
      WHERE d.patient_id = $1
      ORDER BY r.classification, d.gene, r.drug
    `, [patient_id]);

    const grouped = {};
    for (const row of r.rows) {
      const k = `${row.gene} (${row.phenotype})`;
      if (!grouped[k]) grouped[k] = { gene: row.gene, allele1: row.allele1, allele2: row.allele2, phenotype: row.phenotype, drugs: [] };
      grouped[k].drugs.push({
        drug: row.drug,
        classification: row.classification,
        alert: alertLevel(row.classification),
        recommendation: row.recommendation,
        evidence_level: row.evidence_level,
        cpic_guideline: row.cpic_guideline,
      });
    }

    const summary = {
      total_actionable: r.rows.length,
      critical: r.rows.filter(x => ['Avoid','Alternative'].includes(x.classification)).length,
      warning:  r.rows.filter(x => ['Reduce dose','Increase dose'].includes(x.classification)).length,
    };

    res.json({
      patient_id,
      summary,
      groups: Object.values(grouped),
      disclaimer: 'Coverage report is informational; consult a board-certified clinician before prescribing.'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
