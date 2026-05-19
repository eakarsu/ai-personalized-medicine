// Custom Views for Personalized / Precision Medicine
//
// Four endpoints exposed for the "Patient Views" page:
//   GET    /api/custom-views/biomarker-heatmap          (VIZ)
//   GET    /api/custom-views/dose-response              (VIZ)
//   GET    /api/custom-views/genomic-report             (NON-VIZ, printable PDF/HTML)
//   GET    /api/custom-views/protocols                  (NON-VIZ, CRUD)
//   POST   /api/custom-views/protocols                  (NON-VIZ, CRUD)
//   PUT    /api/custom-views/protocols/:id              (NON-VIZ, CRUD)
//   DELETE /api/custom-views/protocols/:id              (NON-VIZ, CRUD)
//
// All endpoints synthesise data so the route works without underlying tables
// being populated. The protocols store is in-process so CRUD round-trips work
// for demo purposes.

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

// ---------- helpers ----------
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ---------- 1. Biomarker Heatmap (VIZ) ----------
// Returns a patient x biomarker matrix of effect/expression scores
// suitable for rendering as a heatmap (CPIC-actionable loci by default).
router.get('/biomarker-heatmap', (_req, res) => {
  const patients = [
    'P-1042 Alvarez', 'P-1088 Becker', 'P-1153 Chen', 'P-1207 Dubois',
    'P-1281 Engel',   'P-1336 Fadel',  'P-1402 Goh',   'P-1476 Haq',
  ];
  const biomarkers = [
    'BRCA1', 'BRCA2', 'CYP2D6', 'CYP2C19', 'TPMT', 'DPYD',
    'UGT1A1', 'SLCO1B1', 'VKORC1', 'HLA-B*57:01', 'EGFR', 'KRAS',
  ];
  const rand = rng(20260518);
  const cells = [];
  for (let p = 0; p < patients.length; p++) {
    for (let g = 0; g < biomarkers.length; g++) {
      const base = ((p + g) % 5) / 4;
      const noise = rand() * 0.55;
      const score = Math.min(1, Math.max(0, base * 0.6 + noise));
      cells.push({ patient: patients[p], biomarker: biomarkers[g], score: +score.toFixed(3) });
    }
  }
  const max = Math.max(...cells.map(c => c.score));
  const min = Math.min(...cells.map(c => c.score));
  res.json({
    title: 'Patient x Biomarker Effect Heatmap',
    subtitle: 'Synthetic effect scores across CPIC-actionable loci',
    patients,
    biomarkers,
    // keep `genes` alias so older clients keep working
    genes: biomarkers,
    cells,
    stats: { min: +min.toFixed(3), max: +max.toFixed(3), patient_count: patients.length, biomarker_count: biomarkers.length },
    disclaimer: 'Synthetic data — for visualization demo only. Not medical advice.',
  });
});

// ---------- 2. Dose-Response Curve (VIZ) ----------
// Returns a longitudinal dose-response curve for several drugs across
// genotype-stratified groups (PK/PD personalised by genomics).
router.get('/dose-response', (req, res) => {
  const drug = String(req.query.drug || 'clopidogrel').toLowerCase();
  const catalog = {
    clopidogrel: { metric: 'Platelet inhibition (%)',  groups: ['CYP2C19 *1/*1', 'CYP2C19 *1/*2', 'CYP2C19 *2/*2'], baselines: [62, 41, 22] },
    warfarin:    { metric: 'INR',                      groups: ['VKORC1 GG',    'VKORC1 GA',    'VKORC1 AA'],    baselines: [1.1, 1.4, 1.9] },
    codeine:     { metric: 'Morphine plasma (ng/mL)',  groups: ['CYP2D6 PM',    'CYP2D6 NM',    'CYP2D6 UM'],    baselines: [3,   16,  42] },
    tamoxifen:   { metric: 'Endoxifen (ng/mL)',        groups: ['CYP2D6 PM',    'CYP2D6 IM',    'CYP2D6 NM'],    baselines: [3,   8,   16] },
  };
  const cfg = catalog[drug] || catalog.clopidogrel;
  const doses = [0, 1, 3, 7, 14, 21, 28];
  const rand = rng(drug.length * 7919 + 13);

  const series = cfg.groups.map((g, gi) => ({
    group: g,
    points: doses.map((d) => {
      const ramp = Math.log10(d + 1) / Math.log10(doses[doses.length - 1] + 1);
      const drift = (rand() - 0.5) * cfg.baselines[gi] * 0.12;
      const value = cfg.baselines[gi] * (0.4 + 0.7 * ramp) + drift;
      return { day: d, value: +value.toFixed(2) };
    }),
  }));

  res.json({
    drug,
    metric: cfg.metric,
    doses,
    // keep `days` alias for older clients
    days: doses,
    series,
    title: `${drug.charAt(0).toUpperCase() + drug.slice(1)} dose-response by genotype`,
    available_drugs: Object.keys(catalog),
    disclaimer: 'Synthetic pharmacokinetic curves. Not medical advice.',
  });
});

// ---------- 3. Patient Genomic Report (NON-VIZ, printable HTML/PDF) ----------
// Returns a printable, comprehensive genomic report for a single patient.
router.get('/genomic-report', (req, res) => {
  const patient = String(req.query.patient || 'P-1042 Alvarez');
  const condition = String(req.query.condition || 'Stage II ER+ Breast Cancer');
  const rand = rng(patient.length * 31 + condition.length);
  const generatedAt = new Date().toISOString();

  const variants = [
    { gene: 'BRCA1',   variant: 'c.5266dupC (p.Q1756Pfs)', zygosity: 'Heterozygous', classification: 'Pathogenic',         significance: 'Hereditary breast/ovarian cancer risk' },
    { gene: 'CYP2D6',  variant: '*1/*1',                   zygosity: 'Diplotype',     classification: 'Normal metabolizer', significance: 'Standard dosing for CYP2D6 substrates'   },
    { gene: 'CYP2C19', variant: '*1/*2',                   zygosity: 'Diplotype',     classification: 'Intermediate',       significance: 'Reduced clopidogrel activation'           },
    { gene: 'HLA-B',   variant: '*57:01 negative',         zygosity: '-',             classification: 'Negative',           significance: 'Abacavir hypersensitivity risk: low'      },
    { gene: 'TPMT',    variant: '*1/*1',                   zygosity: 'Diplotype',     classification: 'Normal metabolizer', significance: 'Standard thiopurine dosing appropriate'   },
  ];
  const pgxGuidance = [
    { drug: 'Clopidogrel', recommendation: 'Avoid; consider prasugrel or ticagrelor (CYP2C19 IM).' },
    { drug: 'Tamoxifen',   recommendation: 'Standard 20 mg/day; CYP2D6 NM phenotype.' },
    { drug: 'Codeine',     recommendation: 'Standard dose acceptable; CYP2D6 NM.' },
    { drug: 'Warfarin',    recommendation: 'Use IWPC algorithm with VKORC1/CYP2C9 data when available.' },
  ];
  const riskScores = [
    { trait: 'Breast cancer (BRCA1 carrier)', percentile: 99, lifetime_risk_pct: 72, action: 'Enhanced screening; surgical consult.' },
    { trait: 'Cardiovascular disease',        percentile: 38, lifetime_risk_pct: 11, action: 'Standard prevention.' },
    { trait: 'Type 2 Diabetes',               percentile: 24, lifetime_risk_pct: 8,  action: 'Standard lifestyle counselling.' },
  ];

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Genomic Report — ${patient}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; max-width: 820px; margin: 32px auto; padding: 24px; }
  h1 { color: #0d9488; margin-bottom: 4px; }
  h2 { color: #0f766e; border-bottom: 1px solid #ccfbf1; padding-bottom: 6px; margin-top: 28px; }
  .meta { color: #475569; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { background: #f1f5f9; color: #0f172a; }
  .pill { display: inline-block; background: #ccfbf1; color: #0f766e; border-radius: 999px; padding: 2px 10px; font-size: 12px; margin-right: 4px; }
  .disclaimer { margin-top: 32px; padding: 12px; background: #fef3c7; color: #78350f; border-radius: 8px; font-size: 13px; }
  @media print { body { margin: 0; } }
</style></head>
<body>
  <h1>Personalized Genomic Report</h1>
  <div class="meta">Patient: <b>${patient}</b> &middot; Indication: <b>${condition}</b> &middot; Generated: ${generatedAt}</div>
  <div style="margin-top:8px;">
    <span class="pill">Germline WGS</span>
    <span class="pill">PGx CPIC Level A</span>
    <span class="pill">Confidence ${(0.78 + rand() * 0.18).toFixed(2)}</span>
  </div>

  <h2>Variant Findings</h2>
  <table><thead><tr><th>Gene</th><th>Variant</th><th>Zygosity</th><th>Classification</th><th>Significance</th></tr></thead><tbody>
    ${variants.map(v => `<tr><td>${v.gene}</td><td>${v.variant}</td><td>${v.zygosity}</td><td>${v.classification}</td><td>${v.significance}</td></tr>`).join('')}
  </tbody></table>

  <h2>Pharmacogenomic Guidance</h2>
  <table><thead><tr><th>Drug</th><th>Recommendation</th></tr></thead><tbody>
    ${pgxGuidance.map(g => `<tr><td>${g.drug}</td><td>${g.recommendation}</td></tr>`).join('')}
  </tbody></table>

  <h2>Polygenic Risk Scores</h2>
  <table><thead><tr><th>Trait</th><th>Percentile</th><th>Lifetime risk</th><th>Action</th></tr></thead><tbody>
    ${riskScores.map(r => `<tr><td>${r.trait}</td><td>${r.percentile}%</td><td>${r.lifetime_risk_pct}%</td><td>${r.action}</td></tr>`).join('')}
  </tbody></table>

  <div class="disclaimer">Synthetic data for demonstration only. This report is not medical advice and must be reviewed by a licensed clinician before any clinical use.</div>
</body></html>`;

  res.json({
    patient,
    condition,
    generated_at: generatedAt,
    format: 'html',
    download_filename: `genomic-report-${patient.replace(/\s+/g, '_')}.html`,
    html,
    summary: {
      variants: variants.length,
      pgx_recommendations: pgxGuidance.length,
      risk_scores: riskScores.length,
    },
    disclaimer: 'Synthetic genomic report. Not medical advice.',
  });
});

// ---------- 4. Treatment Protocols (NON-VIZ, CRUD) ----------
// In-process store of treatment protocols a clinician can edit. CRUD is
// scoped to this process; restarting the backend resets the list to seed.

let nextProtocolId = 1;
const protocols = [];

function seedProtocols() {
  protocols.length = 0;
  nextProtocolId = 1;
  const seed = [
    {
      name: 'BRCA1 carrier — enhanced surveillance',
      condition: 'Hereditary breast cancer',
      genomic_criteria: 'BRCA1 pathogenic variant',
      drug: 'Tamoxifen 20 mg PO daily (post-DX)',
      dose_mg: 20,
      frequency: 'daily',
      monitoring: 'Annual MRI + mammogram; CA-125; DEXA Q24mo',
      status: 'active',
    },
    {
      name: 'CYP2C19 IM — antiplatelet alternative',
      condition: 'Post-PCI antiplatelet therapy',
      genomic_criteria: 'CYP2C19 *1/*2 or *2/*2',
      drug: 'Prasugrel 10 mg PO daily',
      dose_mg: 10,
      frequency: 'daily',
      monitoring: 'Bleeding assessment Q3mo; CBC at 1 and 6 months',
      status: 'active',
    },
    {
      name: 'Warfarin IWPC personalised dosing',
      condition: 'Atrial fibrillation, anticoagulation',
      genomic_criteria: 'VKORC1 + CYP2C9 diplotype',
      drug: 'Warfarin per IWPC algorithm',
      dose_mg: 5,
      frequency: 'daily',
      monitoring: 'INR weekly until stable, then monthly',
      status: 'draft',
    },
  ];
  for (const s of seed) {
    protocols.push({
      id: nextProtocolId++,
      ...s,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}
seedProtocols();

function validateProtocol(body) {
  const errors = [];
  if (!body || typeof body !== 'object') { errors.push('body required'); return errors; }
  if (!body.name || typeof body.name !== 'string') errors.push('name required (string)');
  if (!body.drug || typeof body.drug !== 'string') errors.push('drug required (string)');
  if (body.dose_mg !== undefined && typeof body.dose_mg !== 'number') errors.push('dose_mg must be a number');
  return errors;
}

router.get('/protocols', (_req, res) => {
  res.json({
    title: 'Treatment Protocols',
    total: protocols.length,
    items: protocols,
    disclaimer: 'Synthetic protocols. Not medical advice — review with a licensed clinician.',
  });
});

router.post('/protocols', (req, res) => {
  const errors = validateProtocol(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'validation failed', details: errors });
  const now = new Date().toISOString();
  const p = {
    id: nextProtocolId++,
    name: req.body.name,
    condition: req.body.condition || '',
    genomic_criteria: req.body.genomic_criteria || '',
    drug: req.body.drug,
    dose_mg: typeof req.body.dose_mg === 'number' ? req.body.dose_mg : null,
    frequency: req.body.frequency || 'daily',
    monitoring: req.body.monitoring || '',
    status: req.body.status || 'draft',
    created_at: now,
    updated_at: now,
  };
  protocols.push(p);
  res.status(201).json({ ok: true, protocol: p, disclaimer: 'Synthetic protocol stored in-memory.' });
});

router.put('/protocols/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = protocols.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'protocol not found' });
  const errors = validateProtocol({ ...protocols[idx], ...req.body });
  if (errors.length) return res.status(400).json({ error: 'validation failed', details: errors });
  protocols[idx] = {
    ...protocols[idx],
    ...req.body,
    id,
    updated_at: new Date().toISOString(),
  };
  res.json({ ok: true, protocol: protocols[idx] });
});

router.delete('/protocols/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = protocols.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'protocol not found' });
  const [removed] = protocols.splice(idx, 1);
  res.json({ ok: true, deleted: removed });
});

module.exports = router;
