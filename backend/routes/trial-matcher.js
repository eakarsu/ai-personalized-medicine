// Genotype-aware Clinical Trial Matching
//
// Matches patients to clinical trials based on:
//   1. condition (substring match against patient.conditions)
//   2. age window (min_age / max_age)
//   3. sex restriction
//   4. required gene + variant (joined to variant_interpretations / genome_markers)
//   5. excluded conditions
//
// Endpoints:
//   GET   /api/trial-matcher/trials                          — full trial catalog
//   GET   /api/trial-matcher/trials/:nct_id                  — single trial
//   POST  /api/trial-matcher/trials                          — register a new trial
//   GET   /api/trial-matcher/match/:patient_id               — full eligibility report
//   POST  /api/trial-matcher/match-custom                    — match using arbitrary input
//   GET   /api/trial-matcher/stats                           — registry statistics

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

// Helper — turn a DOB into integer years on a reference date.
function ageInYears(dob, ref = new Date()) {
  if (!dob) return null;
  const d = new Date(dob);
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

router.get('/trials', async (req, res) => {
  try {
    const params = [];
    const where = [];
    if (req.query.condition) { params.push(`%${req.query.condition}%`); where.push(`condition ILIKE $${params.length}`); }
    if (req.query.gene)      { params.push(req.query.gene); where.push(`UPPER(required_gene) = UPPER($${params.length})`); }
    if (req.query.phase)     { params.push(req.query.phase); where.push(`phase = $${params.length}`); }
    if (req.query.status)    { params.push(req.query.status); where.push(`status = $${params.length}`); }
    const r = await pool.query(
      `SELECT * FROM clinical_trials ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY start_date DESC`,
      params
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/trials/:nct_id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM clinical_trials WHERE nct_id = $1`, [req.params.nct_id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/trials', async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(`
      INSERT INTO clinical_trials (nct_id, title, phase, status, condition, intervention, sponsor, required_gene, required_variant,
                                   min_age, max_age, sex, ecog_max, excluded_conditions, location, enrollment_target, primary_endpoint,
                                   start_date, completion_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *
    `, [
      b.nct_id, b.title, b.phase || null, b.status || 'Recruiting', b.condition || null, b.intervention || null,
      b.sponsor || null, b.required_gene || null, b.required_variant || null,
      b.min_age || null, b.max_age || null, b.sex || 'all', b.ecog_max || null,
      b.excluded_conditions || null, b.location || null, b.enrollment_target || null, b.primary_endpoint || null,
      b.start_date || null, b.completion_date || null,
    ]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Core eligibility evaluation. Each trial gets a deterministic score 0..100
// based on weighted criteria. Returns per-criterion breakdown so the UI can
// show *why* a match (mis)fired.
function evaluateTrial(trial, ctx) {
  const reasons = [];
  let score = 0;
  let max = 0;

  // 1. Condition (40 pts)
  max += 40;
  if (trial.condition && ctx.conditions) {
    const cond = trial.condition.toLowerCase();
    const lump = ctx.conditions.toLowerCase();
    const tokens = cond.split(/[\s,]+/).filter(t => t.length > 3);
    const hit = tokens.some(t => lump.includes(t));
    if (hit) { score += 40; reasons.push({ criterion: 'condition', pass: true, detail: `Patient conditions contain "${cond}"` }); }
    else { reasons.push({ criterion: 'condition', pass: false, detail: `No match for trial condition "${cond}"` }); }
  } else { reasons.push({ criterion: 'condition', pass: false, detail: 'No condition stored on trial or patient' }); }

  // 2. Age (15 pts)
  max += 15;
  if (ctx.age == null) { reasons.push({ criterion: 'age', pass: false, detail: 'Patient DOB missing' }); }
  else {
    const min = trial.min_age == null ? 0 : trial.min_age;
    const maxA = trial.max_age == null ? 120 : trial.max_age;
    if (ctx.age >= min && ctx.age <= maxA) {
      score += 15;
      reasons.push({ criterion: 'age', pass: true, detail: `Patient age ${ctx.age}y within [${min}, ${maxA}]` });
    } else {
      reasons.push({ criterion: 'age', pass: false, detail: `Patient age ${ctx.age}y outside [${min}, ${maxA}]` });
    }
  }

  // 3. Sex (5 pts)
  max += 5;
  if (!trial.sex || trial.sex === 'all') { score += 5; reasons.push({ criterion: 'sex', pass: true, detail: 'Trial open to all sexes' }); }
  else if (ctx.gender && trial.sex.toLowerCase() === ctx.gender.toLowerCase()) {
    score += 5; reasons.push({ criterion: 'sex', pass: true, detail: `Patient sex matches "${trial.sex}"` });
  } else { reasons.push({ criterion: 'sex', pass: false, detail: `Trial restricted to "${trial.sex}"` }); }

  // 4. Required gene + variant (35 pts)
  max += 35;
  if (!trial.required_gene) {
    score += 35; reasons.push({ criterion: 'genotype', pass: true, detail: 'No genotype requirement' });
  } else {
    const geneHit = ctx.genes.find(g => g.gene.toUpperCase() === trial.required_gene.toUpperCase());
    if (!geneHit) {
      reasons.push({ criterion: 'genotype', pass: false, detail: `Trial requires ${trial.required_gene} variant; not found on patient.` });
    } else if (!trial.required_variant) {
      score += 35;
      reasons.push({ criterion: 'genotype', pass: true, detail: `Patient has ${trial.required_gene} ${geneHit.variant || ''} variant` });
    } else {
      const wantVariant = trial.required_variant.toLowerCase();
      const haveVariant = (geneHit.variant || geneHit.hgvs_p || geneHit.hgvs_c || '').toLowerCase();
      if (haveVariant.includes(wantVariant) || wantVariant.includes(haveVariant)) {
        score += 35; reasons.push({ criterion: 'genotype', pass: true, detail: `Patient ${trial.required_gene} matches ${trial.required_variant}` });
      } else {
        score += 10; // partial credit — has gene but different variant
        reasons.push({ criterion: 'genotype', pass: false, detail: `Patient has ${trial.required_gene} but variant "${haveVariant}" does not match required "${wantVariant}"` });
      }
    }
  }

  // 5. Excluded conditions (5 pts)
  max += 5;
  if (trial.excluded_conditions && ctx.conditions) {
    const excl = trial.excluded_conditions.toLowerCase();
    const lump = ctx.conditions.toLowerCase();
    const tokens = excl.split(/[\s,;]+/).filter(t => t.length > 3);
    const violated = tokens.find(t => lump.includes(t));
    if (violated) { reasons.push({ criterion: 'exclusion', pass: false, detail: `Excluded due to "${violated}"` }); }
    else { score += 5; reasons.push({ criterion: 'exclusion', pass: true, detail: 'No excluded conditions met' }); }
  } else { score += 5; reasons.push({ criterion: 'exclusion', pass: true, detail: 'No exclusion criteria' }); }

  const pct = Math.round(100 * score / max);
  let verdict = 'no_match';
  if (pct >= 85) verdict = 'eligible';
  else if (pct >= 65) verdict = 'screen';
  else if (pct >= 40) verdict = 'consider';

  return { score: pct, verdict, reasons };
}

router.get('/match/:patient_id', async (req, res) => {
  try {
    const patient_id = parseInt(req.params.patient_id, 10);
    const pq = await pool.query(`SELECT id, first_name, last_name, date_of_birth, gender, conditions FROM patients WHERE id = $1`, [patient_id]);
    if (!pq.rows.length) return res.status(404).json({ error: 'Patient not found' });
    const patient = pq.rows[0];
    const ctx = {
      age: ageInYears(patient.date_of_birth),
      gender: patient.gender,
      conditions: patient.conditions,
      genes: [],
    };

    // Pull both variant_interpretations and genome_markers as gene context.
    const v = await pool.query(`
      SELECT gene, hgvs_p AS variant, hgvs_c FROM variant_interpretations WHERE patient_id = $1
      UNION ALL
      SELECT gene_name AS gene, variant, NULL AS hgvs_c FROM genome_markers WHERE patient_id = $1
    `, [patient_id]);
    ctx.genes = v.rows;

    const t = await pool.query(`SELECT * FROM clinical_trials WHERE status IN ('Recruiting', 'Active') ORDER BY start_date DESC`);
    const results = t.rows.map(trial => ({
      trial: {
        nct_id: trial.nct_id, title: trial.title, phase: trial.phase, status: trial.status,
        condition: trial.condition, intervention: trial.intervention, sponsor: trial.sponsor,
        required_gene: trial.required_gene, required_variant: trial.required_variant,
        location: trial.location, primary_endpoint: trial.primary_endpoint
      },
      ...evaluateTrial(trial, ctx),
    }));
    results.sort((a, b) => b.score - a.score);

    res.json({
      patient,
      patient_context: { age: ctx.age, gender: ctx.gender, gene_count: ctx.genes.length },
      matches: results,
      eligible_count: results.filter(r => r.verdict === 'eligible').length,
      screen_count: results.filter(r => r.verdict === 'screen').length,
      disclaimer: 'Match scores are heuristic; verify eligibility on clinicaltrials.gov before referral.'
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Match-custom: caller supplies free-form context.
router.post('/match-custom', async (req, res) => {
  try {
    const b = req.body || {};
    const ctx = {
      age: b.age || null,
      gender: b.gender || null,
      conditions: b.conditions || '',
      genes: b.genes || [],
    };
    const t = await pool.query(`SELECT * FROM clinical_trials WHERE status = 'Recruiting'`);
    const results = t.rows.map(trial => ({
      trial: { nct_id: trial.nct_id, title: trial.title, condition: trial.condition },
      ...evaluateTrial(trial, ctx),
    }));
    results.sort((a, b) => b.score - a.score);
    res.json({ context: ctx, matches: results.slice(0, 25) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (_req, res) => {
  try {
    const totals = await pool.query(`
      SELECT phase, status, COUNT(*) as n FROM clinical_trials GROUP BY phase, status ORDER BY phase, status
    `);
    const conds  = await pool.query(`SELECT condition, COUNT(*) as n FROM clinical_trials GROUP BY condition ORDER BY n DESC LIMIT 10`);
    const genes  = await pool.query(`SELECT required_gene, COUNT(*) as n FROM clinical_trials WHERE required_gene IS NOT NULL GROUP BY required_gene ORDER BY n DESC`);
    res.json({ totals: totals.rows, conditions: conds.rows, genes: genes.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
