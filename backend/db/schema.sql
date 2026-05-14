-- MedInsight Schema
DROP TABLE IF EXISTS treatment_recommendations CASCADE;
DROP TABLE IF EXISTS lab_results CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS genome_markers CASCADE;
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'physician',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  blood_type VARCHAR(10),
  allergies TEXT,
  conditions TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE health_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  record_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  record_date DATE,
  doctor_name VARCHAR(100),
  facility VARCHAR(150),
  height_cm DECIMAL(5,1),
  weight_kg DECIMAL(5,1),
  blood_pressure VARCHAR(20),
  heart_rate INTEGER,
  temperature DECIMAL(4,1),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE genome_markers (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  gene_name VARCHAR(100) NOT NULL,
  variant VARCHAR(100),
  chromosome VARCHAR(10),
  position BIGINT,
  significance VARCHAR(50),
  condition_association TEXT,
  confidence_score DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE medications (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  generic_name VARCHAR(150),
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  route VARCHAR(50),
  indication TEXT,
  prescriber VARCHAR(100),
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  side_effects TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab_results (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  test_name VARCHAR(150) NOT NULL,
  category VARCHAR(100),
  value DECIMAL(12,4),
  unit VARCHAR(50),
  reference_range VARCHAR(100),
  status VARCHAR(20) DEFAULT 'normal',
  test_date DATE,
  lab_name VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  target VARCHAR(255),
  meta JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE treatment_recommendations (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  evidence_level VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  rationale TEXT,
  contraindications TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================================================
-- Audit feature tables (2026-05-14)
-- Pharmacogenomics, ACMG variant interpretation, PRS, trials, warfarin dosing.
-- All `CREATE TABLE IF NOT EXISTS` so they layer cleanly onto existing schemas.
-- ==========================================================================

-- Patient diplotypes parsed from CYP/HLA/SLCO/VKORC1 etc.
CREATE TABLE IF NOT EXISTS pgx_diplotypes (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  gene VARCHAR(50) NOT NULL,           -- e.g. CYP2C19, CYP2D6, VKORC1, HLA-B
  allele1 VARCHAR(50) NOT NULL,        -- e.g. *1, *2, *17, c.1639G>A, *57:01
  allele2 VARCHAR(50) NOT NULL,
  phenotype VARCHAR(100),              -- poor / intermediate / normal / rapid / ultrarapid metabolizer
  activity_score DECIMAL(4,2),         -- CPIC activity-score where applicable
  source VARCHAR(50) DEFAULT 'sequencing',
  reported_at DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pgx_diplotypes_patient ON pgx_diplotypes(patient_id);
CREATE INDEX IF NOT EXISTS idx_pgx_diplotypes_gene ON pgx_diplotypes(gene);

-- CPIC-style gene-drug rules. Phenotype + drug -> recommendation.
CREATE TABLE IF NOT EXISTS pgx_drug_rules (
  id SERIAL PRIMARY KEY,
  gene VARCHAR(50) NOT NULL,
  drug VARCHAR(100) NOT NULL,
  phenotype VARCHAR(100) NOT NULL,
  recommendation TEXT NOT NULL,
  classification VARCHAR(50),           -- "Avoid", "Reduce dose", "Standard", "Increase dose", "Alternative"
  evidence_level VARCHAR(10),           -- CPIC level: A, B, C, D
  cpic_guideline VARCHAR(255),
  source VARCHAR(50) DEFAULT 'CPIC',
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pgx_rules_gene_drug ON pgx_drug_rules(gene, drug);

-- ACMG/AMP variant interpretation records
CREATE TABLE IF NOT EXISTS variant_interpretations (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  gene VARCHAR(50) NOT NULL,
  hgvs_c VARCHAR(255),                 -- e.g. c.5266dupC
  hgvs_p VARCHAR(255),                 -- e.g. p.Gln1756ProfsTer74
  rsid VARCHAR(50),                    -- e.g. rs80357906
  chromosome VARCHAR(10),
  position BIGINT,
  ref_allele VARCHAR(20),
  alt_allele VARCHAR(20),
  zygosity VARCHAR(30),                -- heterozygous / homozygous / hemizygous
  clinvar_id VARCHAR(50),
  gnomad_af DECIMAL(10,8),             -- gnomAD allele frequency
  acmg_criteria JSONB,                 -- {"PVS1": true, "PM2": true, ...}
  acmg_classification VARCHAR(50),     -- Pathogenic / Likely pathogenic / VUS / Likely benign / Benign
  acmg_score INTEGER,                  -- numeric points for tiebreaking
  condition VARCHAR(255),
  reviewed_by VARCHAR(100),
  reviewed_at DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_var_interp_patient ON variant_interpretations(patient_id);
CREATE INDEX IF NOT EXISTS idx_var_interp_gene ON variant_interpretations(gene);

-- Polygenic risk score profile per patient per trait
CREATE TABLE IF NOT EXISTS prs_scores (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  trait VARCHAR(150) NOT NULL,         -- Coronary Artery Disease, T2D, Breast Cancer, AFib...
  pgs_catalog_id VARCHAR(50),          -- e.g. PGS000018
  raw_score DECIMAL(10,4),             -- raw weighted sum of risk alleles
  z_score DECIMAL(6,3),                -- standardized vs reference population
  percentile DECIMAL(5,2),             -- 0..100
  ancestry VARCHAR(50),                -- EUR / EAS / AFR / SAS / AMR
  variant_count INTEGER,               -- # SNPs contributing to score
  risk_category VARCHAR(50),           -- Low / Average / High / Very High
  hazard_ratio DECIMAL(5,2),           -- top-decile vs median HR
  reference_population VARCHAR(100),
  computed_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prs_patient ON prs_scores(patient_id);

-- Clinical trial registry rows (synthetic, ClinicalTrials.gov-like)
CREATE TABLE IF NOT EXISTS clinical_trials (
  id SERIAL PRIMARY KEY,
  nct_id VARCHAR(20) UNIQUE,
  title VARCHAR(500) NOT NULL,
  phase VARCHAR(20),                   -- Phase 1 / 2 / 3 / 4
  status VARCHAR(50),                  -- Recruiting / Active / Completed
  condition VARCHAR(255),
  intervention VARCHAR(255),
  sponsor VARCHAR(255),
  required_gene VARCHAR(50),           -- gene that must be mutated (e.g. EGFR)
  required_variant VARCHAR(100),       -- specific variant (e.g. L858R, T790M)
  min_age INTEGER,
  max_age INTEGER,
  sex VARCHAR(20),                     -- all / male / female
  ecog_max INTEGER,                    -- ECOG performance status ceiling
  excluded_conditions TEXT,
  location VARCHAR(255),
  enrollment_target INTEGER,
  primary_endpoint TEXT,
  start_date DATE,
  completion_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Warfarin dose log (IWPC pharmacogenetic algorithm output)
CREATE TABLE IF NOT EXISTS warfarin_doses (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  cyp2c9_genotype VARCHAR(20),         -- *1/*1, *1/*2, *2/*3 etc
  vkorc1_rs9923231 VARCHAR(5),         -- G/G, A/G, A/A
  age_years INTEGER,
  height_cm DECIMAL(5,1),
  weight_kg DECIMAL(5,1),
  amiodarone_use BOOLEAN DEFAULT FALSE,
  enzyme_inducer_use BOOLEAN DEFAULT FALSE,
  predicted_weekly_dose_mg DECIMAL(6,2),
  predicted_daily_dose_mg DECIMAL(6,2),
  predicted_inr DECIMAL(4,2),
  actual_inr DECIMAL(4,2),
  actual_weekly_dose_mg DECIMAL(6,2),
  algorithm_version VARCHAR(50) DEFAULT 'IWPC-2009',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_warfarin_patient ON warfarin_doses(patient_id);

-- Drug-drug interaction reference table (DDI)
CREATE TABLE IF NOT EXISTS drug_interactions (
  id SERIAL PRIMARY KEY,
  drug_a VARCHAR(150) NOT NULL,
  drug_b VARCHAR(150) NOT NULL,
  severity VARCHAR(20),                -- contraindicated / major / moderate / minor
  mechanism TEXT,
  clinical_effect TEXT,
  management TEXT,
  evidence VARCHAR(20),                -- excellent / good / fair / poor
  source VARCHAR(50) DEFAULT 'DrugBank/Micromedex',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ddi_drugs ON drug_interactions(drug_a, drug_b);

