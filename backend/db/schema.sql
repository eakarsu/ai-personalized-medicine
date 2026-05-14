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
