export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  blood_type?: string;
  allergies?: string;
  conditions?: string;
  status: string;
  created_at: string;
}

export interface HealthRecord {
  id: number;
  patient_id: number;
  patient_name?: string;
  record_type: string;
  title: string;
  description?: string;
  record_date?: string;
  doctor_name?: string;
  facility?: string;
  height_cm?: number;
  weight_kg?: number;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  created_at: string;
}

export interface GenomeMarker {
  id: number;
  patient_id: number;
  patient_name?: string;
  gene_name: string;
  variant?: string;
  chromosome?: string;
  position?: number;
  significance?: string;
  condition_association?: string;
  confidence_score?: number;
  notes?: string;
  created_at: string;
}

export interface Medication {
  id: number;
  patient_id: number;
  patient_name?: string;
  name: string;
  generic_name?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  indication?: string;
  prescriber?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  side_effects?: string;
  notes?: string;
  created_at: string;
}

export interface LabResult {
  id: number;
  patient_id: number;
  patient_name?: string;
  test_name: string;
  category?: string;
  value?: number;
  unit?: string;
  reference_range?: string;
  status: string;
  test_date?: string;
  lab_name?: string;
  notes?: string;
  created_at: string;
}

export interface Recommendation {
  id: number;
  patient_id: number;
  patient_name?: string;
  recommendation_type?: string;
  title: string;
  description?: string;
  priority: string;
  evidence_level?: string;
  status: string;
  rationale?: string;
  contraindications?: string;
  notes?: string;
  created_at: string;
}
