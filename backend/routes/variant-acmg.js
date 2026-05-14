// ACMG/AMP Variant Interpretation
//
// Real implementation of the 2015 Richards et al. ACMG/AMP variant
// classification framework (PVS1, PS1–4, PM1–6, PP1–5, BS1–4, BP1–7) with
// point-based combiner per Tavtigian 2018 (Bayesian re-derivation).
//
// Endpoints:
//   GET    /api/variant-acmg                          — list patient interpretations (filterable)
//   GET    /api/variant-acmg/:id                      — single interpretation
//   POST   /api/variant-acmg                          — store new interpretation
//   POST   /api/variant-acmg/classify                 — run criteria -> classification
//   GET    /api/variant-acmg/criteria/glossary        — criteria glossary
//   GET    /api/variant-acmg/stats                    — global classification stats

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Tavtigian 2018 point system used widely in commercial variant classifiers.
// Points: PVS=8, PS=4, PM=2, PP=1, BS=-4, BP=-1.
const POINT_VALUE = {
  PVS1:  8,
  PS1:   4, PS2: 4, PS3: 4, PS4: 4,
  PM1:   2, PM2: 2, PM3: 2, PM4: 2, PM5: 2, PM6: 2,
  PP1:   1, PP2: 1, PP3: 1, PP4: 1, PP5: 1,
  BS1:  -4, BS2:-4, BS3:-4, BS4:-4,
  BP1:  -1, BP2:-1, BP3:-1, BP4:-1, BP5:-1, BP6:-1, BP7:-1,
};

const GLOSSARY = {
  PVS1: 'Null variant (nonsense, frameshift, canonical ±1/2 splice, initiation codon, deletion of single/multi exon) in a gene where LoF is a known disease mechanism.',
  PS1:  'Same amino-acid change as a previously established pathogenic variant regardless of nucleotide change.',
  PS2:  'De novo (paternity and maternity confirmed) in a patient with no family history.',
  PS3:  'Well-established in vitro or in vivo functional studies supportive of damaging effect on the gene or gene product.',
  PS4:  'Prevalence of the variant in affected individuals significantly increased vs controls (OR>5).',
  PM1:  'Located in a mutational hot spot and/or critical functional domain without benign variation.',
  PM2:  'Absent (or extremely low frequency) in population databases (gnomAD AF < 0.0001).',
  PM3:  'For recessive disorders, detected in trans with a pathogenic variant.',
  PM4:  'Protein length changes due to in-frame indels in a non-repeat region or stop-loss variants.',
  PM5:  'Novel missense at an amino-acid residue where a different pathogenic missense has been seen.',
  PM6:  'Assumed de novo without confirmation of paternity and maternity.',
  PP1:  'Co-segregation with disease in multiple affected family members.',
  PP2:  'Missense variant in a gene with low rate of benign missense variation and missense is a common mechanism of disease.',
  PP3:  'Multiple in silico predictors support a deleterious effect (REVEL>0.7, CADD>20).',
  PP4:  'Patient phenotype/family history highly specific for the disease.',
  PP5:  'Reputable source recently reports variant as pathogenic (ClinVar, OMIM).',
  BS1:  'Allele frequency greater than expected for disorder (gnomAD AF > 0.05 typical).',
  BS2:  'Observed in a healthy adult for a fully penetrant recessive (homozygous) or dominant disorder.',
  BS3:  'Well-established functional studies show no damaging effect.',
  BS4:  'Lack of segregation in affected family members.',
  BP1:  'Missense variant in a gene where only LoF causes disease.',
  BP2:  'Observed in trans with a dominant variant, or in cis with a pathogenic variant in any inheritance pattern.',
  BP3:  'In-frame indels in a repetitive region without known function.',
  BP4:  'Multiple in silico predictors suggest no impact.',
  BP5:  'Variant found in a case with an alternative molecular basis for disease.',
  BP6:  'Reputable source recently reports variant as benign.',
  BP7:  'Synonymous variant with no predicted splice impact and not highly conserved.',
};

// Tavtigian 2018 score thresholds (Bayesian re-derivation of ACMG).
function classifyByScore(score) {
  if (score >= 10) return 'Pathogenic';
  if (score >= 6)  return 'Likely pathogenic';
  if (score >= 0 && score <= 5) return 'Uncertain significance';
  if (score >= -6 && score < 0) return 'Likely benign';
  return 'Benign';
}

router.get('/', async (req, res) => {
  try {
    const params = [];
    const where = [];
    if (req.query.patient_id)    { params.push(req.query.patient_id);    where.push(`v.patient_id = $${params.length}`); }
    if (req.query.gene)          { params.push(req.query.gene);          where.push(`LOWER(v.gene) = LOWER($${params.length})`); }
    if (req.query.classification){ params.push(req.query.classification);where.push(`v.acmg_classification = $${params.length}`); }
    const r = await pool.query(`
      SELECT v.*, p.first_name, p.last_name
      FROM variant_interpretations v
      LEFT JOIN patients p ON p.id = v.patient_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY v.created_at DESC
      LIMIT 200
    `, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/criteria/glossary', (_req, res) => {
  res.json({
    point_values: POINT_VALUE,
    criteria: GLOSSARY,
    thresholds: {
      Pathogenic: '>=10',
      'Likely pathogenic': '6 to 9',
      'Uncertain significance': '0 to 5',
      'Likely benign': '-6 to -1',
      Benign: '<= -7'
    },
    source: 'ACMG/AMP 2015 (Richards et al.); point-based combiner per Tavtigian 2018.'
  });
});

router.get('/stats', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT acmg_classification, COUNT(*) AS n
      FROM variant_interpretations
      GROUP BY acmg_classification
      ORDER BY n DESC
    `);
    const geneRows = await pool.query(`
      SELECT gene, COUNT(*) AS n,
             SUM(CASE WHEN acmg_classification IN ('Pathogenic','Likely pathogenic') THEN 1 ELSE 0 END) AS path_n
      FROM variant_interpretations
      GROUP BY gene
      ORDER BY n DESC
      LIMIT 20
    `);
    res.json({ by_classification: r.rows, by_gene: geneRows.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM variant_interpretations WHERE id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(`
      INSERT INTO variant_interpretations
        (patient_id, gene, hgvs_c, hgvs_p, rsid, chromosome, position, ref_allele, alt_allele, zygosity, clinvar_id, gnomad_af, acmg_criteria, acmg_classification, acmg_score, condition, reviewed_by, reviewed_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *
    `, [
      b.patient_id, b.gene, b.hgvs_c || null, b.hgvs_p || null, b.rsid || null,
      b.chromosome || null, b.position || null, b.ref_allele || null, b.alt_allele || null,
      b.zygosity || null, b.clinvar_id || null, b.gnomad_af || null,
      b.acmg_criteria ? JSON.stringify(b.acmg_criteria) : null,
      b.acmg_classification || null, b.acmg_score || null,
      b.condition || null, b.reviewed_by || null, b.reviewed_at || null,
    ]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Live classifier — takes a criteria map, returns score + classification + breakdown.
router.post('/classify', (req, res) => {
  const criteria = req.body?.criteria || {};
  let score = 0;
  const applied = [];
  const ignored = [];
  for (const [code, on] of Object.entries(criteria)) {
    if (!on) continue;
    if (POINT_VALUE[code] === undefined) { ignored.push(code); continue; }
    score += POINT_VALUE[code];
    applied.push({ code, points: POINT_VALUE[code], definition: GLOSSARY[code] });
  }
  // Sort by abs(points) desc for human readability.
  applied.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  const classification = classifyByScore(score);
  res.json({
    score,
    classification,
    applied,
    ignored,
    bayesian_pp_proxy: classification === 'Pathogenic' ? '>0.99' :
                       classification === 'Likely pathogenic' ? '0.90–0.99' :
                       classification === 'Uncertain significance' ? '0.10–0.90' :
                       classification === 'Likely benign' ? '0.001–0.10' : '<0.001',
    framework: 'ACMG/AMP 2015 + Tavtigian 2018 point combiner',
    disclaimer: 'Demonstration classifier — not validated for clinical reporting.'
  });
});

module.exports = router;
