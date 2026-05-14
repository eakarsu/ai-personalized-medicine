const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// MedInsight Sample Data — synthetic only, for demo use.
// All identifiers, names, contact details and clinical values are fabricated.
// Real-sounding drug names / biomarker names are used so the demo feels realistic,
// but the rows do not represent any actual person or patient record.

const ENTITIES = {
  patients: 'Patients',
  health_records: 'Health Records',
  genome_markers: 'Genome Markers',
  medications: 'Medications',
  lab_results: 'Lab Results',
  treatment_recommendations: 'Treatment Recommendations',
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = (lo, hi, decimals = 0) => {
  const v = Math.random() * (hi - lo) + lo;
  return decimals ? Number(v.toFixed(decimals)) : Math.floor(v);
};

async function getOrCreatePatientIds(client, n = 5) {
  const r = await client.query('SELECT id FROM patients ORDER BY id DESC LIMIT $1', [n]);
  if (r.rows.length >= 1) return r.rows.map((row) => row.id);
  // No patients yet — seed a few synthetic patients first so FKs resolve.
  const seeded = await samplePatients(client);
  return seeded.map((row) => row.id);
}

async function samplePatients(client) {
  // Synthetic patient profiles — fabricated names, fabricated emails on example.com.
  const profiles = [
    { first_name: 'Avery',  last_name: 'Sinclair',  gender: 'female', blood_type: 'O+',  conditions: 'Type 2 diabetes; hypertension', allergies: 'Penicillin' },
    { first_name: 'Jordan', last_name: 'Okafor',    gender: 'male',   blood_type: 'A+',  conditions: 'Hyperlipidemia',                  allergies: 'None known' },
    { first_name: 'Mira',   last_name: 'Lindgren',  gender: 'female', blood_type: 'B-',  conditions: 'Asthma; seasonal allergies',      allergies: 'Sulfa drugs' },
    { first_name: 'Theo',   last_name: 'Castellano',gender: 'male',   blood_type: 'AB+', conditions: 'Atrial fibrillation',             allergies: 'NSAIDs' },
    { first_name: 'Naomi',  last_name: 'Park',      gender: 'female', blood_type: 'O-',  conditions: 'Hypothyroidism',                  allergies: 'Latex' },
    { first_name: 'Rohan',  last_name: 'Devakumar', gender: 'male',   blood_type: 'A-',  conditions: 'Chronic kidney disease, stage 2', allergies: 'Iodinated contrast' },
    { first_name: 'Helena', last_name: 'Voss',      gender: 'female', blood_type: 'B+',  conditions: 'Migraine with aura',              allergies: 'None known' },
    { first_name: 'Marcus', last_name: 'Greenfield',gender: 'male',   blood_type: 'O+',  conditions: 'Coronary artery disease',         allergies: 'Statins (myalgia)' },
  ];
  const out = [];
  for (const p of profiles) {
    const yob = between(1948, 2002);
    const month = String(between(1, 12)).padStart(2, '0');
    const day = String(between(1, 28)).padStart(2, '0');
    const dob = `${yob}-${month}-${day}`;
    const synId = `SYN-${between(10000, 99999)}`;
    const email = `${p.first_name.toLowerCase()}.${p.last_name.toLowerCase()}+${synId}@example.com`;
    const phone = `+1-555-01${String(between(10, 99))}-${String(between(1000, 9999))}`;
    const r = await client.query(
      `INSERT INTO patients (first_name, last_name, date_of_birth, gender, email, phone, blood_type, allergies, conditions, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active') RETURNING id`,
      [p.first_name, p.last_name, dob, p.gender, email, phone, p.blood_type, p.allergies, p.conditions]
    );
    out.push(r.rows[0]);
  }
  return out;
}

async function sampleHealthRecords(client) {
  const patientIds = await getOrCreatePatientIds(client, 6);
  const presets = [
    { record_type: 'vitals',     title: 'Routine vitals check',          description: 'Blood pressure, heart rate and weight measured at clinic.', doctor_name: 'Dr. R. Hassan',     facility: 'Cedar Park Family Clinic' },
    { record_type: 'visit',      title: 'Annual wellness visit',         description: 'Comprehensive history and physical, no acute findings.',    doctor_name: 'Dr. L. Okonkwo',    facility: 'Northwood Medical Center' },
    { record_type: 'imaging',    title: 'Chest X-ray (PA/lateral)',      description: 'No acute cardiopulmonary findings.',                        doctor_name: 'Dr. S. Mehta',      facility: 'Riverside Imaging' },
    { record_type: 'procedure',  title: 'Echocardiogram',                description: 'EF 58%, mild mitral regurgitation, otherwise unremarkable.', doctor_name: 'Dr. P. Alvarez',    facility: 'Heart & Vascular Institute' },
    { record_type: 'follow_up',  title: 'Diabetes follow-up',            description: 'Reviewed home glucose log; adjusted lifestyle plan.',        doctor_name: 'Dr. K. Nakamura',   facility: 'Endocrine Associates' },
    { record_type: 'visit',      title: 'Telehealth check-in',           description: 'Virtual visit, medication tolerance reviewed.',              doctor_name: 'Dr. M. Patel',      facility: 'MedInsight Telehealth' },
    { record_type: 'vitals',     title: 'Pre-op vitals',                  description: 'Captured prior to outpatient procedure.',                   doctor_name: 'Dr. J. Friedmann',  facility: 'Northwood Surgical' },
  ];
  const out = [];
  for (const preset of presets) {
    const pid = pick(patientIds);
    const sysBP = between(108, 148);
    const diaBP = between(66, 92);
    const r = await client.query(
      `INSERT INTO health_records (patient_id, record_type, title, description, record_date, doctor_name, facility,
                                   height_cm, weight_kg, blood_pressure, heart_rate, temperature)
       VALUES ($1,$2,$3,$4, CURRENT_DATE - ($5 || ' days')::interval, $6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [pid, preset.record_type, preset.title, preset.description,
       String(between(1, 240)),
       preset.doctor_name, preset.facility,
       between(150, 192, 1), between(54, 102, 1),
       `${sysBP}/${diaBP}`, between(58, 96), between(36.4, 37.6, 1)]
    );
    out.push(r.rows[0]);
  }
  return out;
}

async function sampleGenomeMarkers(client) {
  const patientIds = await getOrCreatePatientIds(client, 6);
  // Real gene/variant names commonly cited in pharmacogenomics & oncology references.
  const presets = [
    { gene_name: 'CYP2C19', variant: '*2 / *2',     chromosome: '10', significance: 'pathogenic',    condition_association: 'Reduced clopidogrel activation; consider alternative antiplatelet.' },
    { gene_name: 'CYP2D6',  variant: '*4 / *4',     chromosome: '22', significance: 'pathogenic',    condition_association: 'Poor metabolizer; reduce codeine and tamoxifen efficacy.' },
    { gene_name: 'BRCA1',   variant: 'c.5266dupC',  chromosome: '17', significance: 'pathogenic',    condition_association: 'Hereditary breast and ovarian cancer risk.' },
    { gene_name: 'BRCA2',   variant: 'c.5946delT',  chromosome: '13', significance: 'pathogenic',    condition_association: 'Hereditary breast and ovarian cancer risk.' },
    { gene_name: 'TPMT',    variant: '*3A / *1',    chromosome: '6',  significance: 'likely_pathogenic', condition_association: 'Intermediate thiopurine metabolism; reduce azathioprine dose.' },
    { gene_name: 'HLA-B',   variant: '*57:01 positive', chromosome: '6',  significance: 'pathogenic', condition_association: 'High risk of abacavir hypersensitivity — avoid abacavir.' },
    { gene_name: 'VKORC1',  variant: '-1639G>A (AA)',   chromosome: '16', significance: 'likely_pathogenic', condition_association: 'Increased warfarin sensitivity; lower starting dose.' },
    { gene_name: 'APOE',    variant: 'e3/e4',       chromosome: '19', significance: 'risk_factor',   condition_association: 'Increased late-onset Alzheimer risk; lifestyle counseling.' },
  ];
  const out = [];
  for (const g of presets) {
    const pid = pick(patientIds);
    const r = await client.query(
      `INSERT INTO genome_markers (patient_id, gene_name, variant, chromosome, position, significance, condition_association, confidence_score, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [pid, g.gene_name, g.variant, g.chromosome, between(1_000_000, 250_000_000),
       g.significance, g.condition_association, between(82, 99, 2),
       'Synthetic demo data — not a real genotype.']
    );
    out.push(r.rows[0]);
  }
  return out;
}

async function sampleMedications(client) {
  const patientIds = await getOrCreatePatientIds(client, 6);
  // Real-sounding medications with realistic dosing and indications.
  const presets = [
    { name: 'Metformin 500mg',        generic_name: 'metformin',             dosage: '500 mg',  frequency: 'twice daily',  route: 'oral', indication: 'Type 2 diabetes',          side_effects: 'GI upset' },
    { name: 'Lisinopril 10mg',        generic_name: 'lisinopril',            dosage: '10 mg',   frequency: 'once daily',   route: 'oral', indication: 'Hypertension',             side_effects: 'Dry cough' },
    { name: 'Atorvastatin 20mg',      generic_name: 'atorvastatin',          dosage: '20 mg',   frequency: 'once at bedtime', route: 'oral', indication: 'Hyperlipidemia',         side_effects: 'Myalgia (rare)' },
    { name: 'Levothyroxine 75mcg',    generic_name: 'levothyroxine',         dosage: '75 mcg',  frequency: 'once daily',   route: 'oral', indication: 'Hypothyroidism',           side_effects: 'Palpitations if over-dosed' },
    { name: 'Apixaban 5mg',           generic_name: 'apixaban',              dosage: '5 mg',    frequency: 'twice daily',  route: 'oral', indication: 'Atrial fibrillation — stroke prevention', side_effects: 'Bleeding risk' },
    { name: 'Albuterol HFA 90mcg',    generic_name: 'albuterol',             dosage: '90 mcg/actuation', frequency: 'as needed',  route: 'inhaled', indication: 'Asthma — rescue',  side_effects: 'Tremor, tachycardia' },
    { name: 'Sumatriptan 50mg',       generic_name: 'sumatriptan',           dosage: '50 mg',   frequency: 'as needed',    route: 'oral', indication: 'Migraine — abortive',      side_effects: 'Chest tightness' },
    { name: 'Omeprazole 20mg',        generic_name: 'omeprazole',            dosage: '20 mg',   frequency: 'once daily',   route: 'oral', indication: 'GERD',                     side_effects: 'Headache' },
  ];
  const out = [];
  for (const m of presets) {
    const pid = pick(patientIds);
    const startDays = between(30, 720);
    const r = await client.query(
      `INSERT INTO medications (patient_id, name, generic_name, dosage, frequency, route, indication, prescriber,
                                start_date, end_date, status, side_effects, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
               CURRENT_DATE - ($9 || ' days')::interval, NULL, 'active', $10, $11) RETURNING id`,
      [pid, m.name, m.generic_name, m.dosage, m.frequency, m.route, m.indication,
       pick(['Dr. R. Hassan', 'Dr. L. Okonkwo', 'Dr. S. Mehta', 'Dr. K. Nakamura', 'Dr. M. Patel']),
       String(startDays), m.side_effects, 'Synthetic demo data.']
    );
    out.push(r.rows[0]);
  }
  return out;
}

async function sampleLabResults(client) {
  const patientIds = await getOrCreatePatientIds(client, 6);
  // Real-sounding biomarker panel entries with realistic units and ranges.
  const presets = [
    { test_name: 'HbA1c',                    category: 'diabetes',  value: between(5.4, 9.2, 1),  unit: '%',     reference_range: '4.0–5.6',     status: 'high',    lab_name: 'Quest Synthetic Lab' },
    { test_name: 'Fasting glucose',          category: 'diabetes',  value: between(78, 168, 0),   unit: 'mg/dL', reference_range: '70–99',       status: 'high',    lab_name: 'Quest Synthetic Lab' },
    { test_name: 'LDL cholesterol',          category: 'lipids',    value: between(60, 195, 0),   unit: 'mg/dL', reference_range: '<100',        status: 'high',    lab_name: 'LabCorp Synthetic' },
    { test_name: 'HDL cholesterol',          category: 'lipids',    value: between(28, 78, 0),    unit: 'mg/dL', reference_range: '>40',         status: 'normal',  lab_name: 'LabCorp Synthetic' },
    { test_name: 'TSH',                      category: 'endocrine', value: between(0.3, 8.4, 2),  unit: 'mIU/L', reference_range: '0.4–4.0',     status: 'normal',  lab_name: 'Northwood Reference Lab' },
    { test_name: 'Creatinine',               category: 'renal',     value: between(0.6, 1.8, 2),  unit: 'mg/dL', reference_range: '0.6–1.3',     status: 'normal',  lab_name: 'Northwood Reference Lab' },
    { test_name: 'eGFR',                     category: 'renal',     value: between(38, 102, 0),   unit: 'mL/min/1.73m^2', reference_range: '>60', status: 'low',    lab_name: 'Northwood Reference Lab' },
    { test_name: 'INR',                      category: 'coagulation', value: between(0.9, 3.6, 2),unit: 'ratio', reference_range: '2.0–3.0 (on warfarin)', status: 'normal', lab_name: 'Heart & Vascular Lab' },
    { test_name: 'Vitamin D, 25-hydroxy',    category: 'nutrition', value: between(12, 62, 0),    unit: 'ng/mL', reference_range: '30–80',       status: 'low',     lab_name: 'Quest Synthetic Lab' },
  ];
  const out = [];
  for (const l of presets) {
    const pid = pick(patientIds);
    const r = await client.query(
      `INSERT INTO lab_results (patient_id, test_name, category, value, unit, reference_range, status, test_date, lab_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_DATE - ($8 || ' days')::interval, $9, $10) RETURNING id`,
      [pid, l.test_name, l.category, l.value, l.unit, l.reference_range, l.status,
       String(between(1, 365)), l.lab_name, 'Synthetic demo data — not a real result.']
    );
    out.push(r.rows[0]);
  }
  return out;
}

async function sampleTreatmentRecommendations(client) {
  const patientIds = await getOrCreatePatientIds(client, 6);
  const presets = [
    { recommendation_type: 'lifestyle',        title: 'Mediterranean diet + 150 min/week aerobic activity', description: 'For LDL > 130 mg/dL; reassess lipid panel in 12 weeks.', priority: 'medium', evidence_level: 'A', rationale: 'AHA/ACC 2018 guideline support.', contraindications: 'None significant.' },
    { recommendation_type: 'pharmacological',  title: 'Initiate metformin 500mg PO BID',                    description: 'For new T2DM with HbA1c 7.2%; titrate to 1000mg BID over 4 weeks.', priority: 'high',   evidence_level: 'A', rationale: 'ADA 2024 first-line therapy.',  contraindications: 'eGFR < 30 mL/min/1.73m².' },
    { recommendation_type: 'monitoring',       title: 'Repeat HbA1c in 3 months',                            description: 'Track glycemic response after therapy initiation.',                priority: 'medium', evidence_level: 'B', rationale: 'Standard diabetes care interval.',                  contraindications: 'None.' },
    { recommendation_type: 'screening',        title: 'Annual diabetic retinopathy exam',                    description: 'Refer to ophthalmology; fundoscopic screening.',                  priority: 'medium', evidence_level: 'A', rationale: 'ADA recommended annual screening for T2DM.',         contraindications: 'None.' },
    { recommendation_type: 'pharmacological',  title: 'Reduce warfarin starting dose to 2.5mg daily',        description: 'Per VKORC1 -1639 AA genotype; recheck INR in 3 days.',            priority: 'high',   evidence_level: 'B', rationale: 'CPIC pharmacogenomic guideline.',                    contraindications: 'Active bleeding.' },
    { recommendation_type: 'pharmacological',  title: 'Avoid abacavir — substitute alternative NRTI',        description: 'HLA-B*57:01 positive; high hypersensitivity risk.',               priority: 'high',   evidence_level: 'A', rationale: 'CPIC HLA-B*57:01 guideline.',                        contraindications: 'N/A — drug avoidance.' },
    { recommendation_type: 'referral',         title: 'Cardiology consult for atrial fibrillation',           description: 'Discuss rhythm vs rate control and anticoagulation strategy.',    priority: 'high',   evidence_level: 'A', rationale: 'New AFib diagnosis; CHA2DS2-VASc ≥ 2.',              contraindications: 'None.' },
    { recommendation_type: 'lifestyle',        title: 'Smoking cessation counseling + nicotine replacement',  description: 'Refer to behavioral program; offer NRT patch 21mg/24h.',          priority: 'high',   evidence_level: 'A', rationale: 'USPSTF Grade A recommendation.',                     contraindications: 'NRT cautious in recent MI.' },
  ];
  const out = [];
  for (const r0 of presets) {
    const pid = pick(patientIds);
    const r = await client.query(
      `INSERT INTO treatment_recommendations (patient_id, recommendation_type, title, description, priority, evidence_level, status, rationale, contraindications, notes)
       VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,$9) RETURNING id`,
      [pid, r0.recommendation_type, r0.title, r0.description, r0.priority, r0.evidence_level,
       r0.rationale, r0.contraindications, 'Synthetic demo data — not clinical advice.']
    );
    out.push(r.rows[0]);
  }
  return out;
}

const HANDLERS = {
  patients: samplePatients,
  health_records: sampleHealthRecords,
  genome_markers: sampleGenomeMarkers,
  medications: sampleMedications,
  lab_results: sampleLabResults,
  treatment_recommendations: sampleTreatmentRecommendations,
};

router.get('/sample-data/entities', auth, (_req, res) => {
  res.json({ entities: Object.keys(ENTITIES).map((k) => ({ key: k, label: ENTITIES[k] })) });
});

router.post('/sample-data/:entity', auth, async (req, res) => {
  const entity = req.params.entity;
  const handler = HANDLERS[entity];
  if (!handler) {
    return res.status(400).json({ error: `Unknown entity '${entity}'. Allowed: ${Object.keys(HANDLERS).join(', ')}` });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rows = await handler(client);
    await client.query('COMMIT');
    res.json({ inserted: rows.length, entity });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
    res.status(500).json({ error: e.message, entity });
  } finally {
    client.release();
  }
});

module.exports = router;
