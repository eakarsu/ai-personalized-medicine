-- MedInsight Seed Data

-- Admin user (password: demo123)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Dr. Sarah Chen', 'physician')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, role = EXCLUDED.role;

-- Patients
INSERT INTO patients (first_name, last_name, date_of_birth, gender, email, phone, blood_type, allergies, conditions, status) VALUES
('James', 'Wilson', '1965-03-15', 'male', 'james.wilson@email.com', '555-0101', 'A+', 'Penicillin', 'Type 2 Diabetes, Hypertension', 'active'),
('Maria', 'Garcia', '1978-07-22', 'female', 'maria.garcia@email.com', '555-0102', 'O-', 'Sulfa drugs', 'Asthma, Hypothyroidism', 'active'),
('Robert', 'Johnson', '1952-11-08', 'male', 'robert.j@email.com', '555-0103', 'B+', 'None', 'Coronary Artery Disease, Atrial Fibrillation', 'active'),
('Linda', 'Martinez', '1988-04-30', 'female', 'linda.m@email.com', '555-0104', 'AB+', 'Aspirin, Ibuprofen', 'Rheumatoid Arthritis', 'active'),
('David', 'Lee', '1970-09-12', 'male', 'david.lee@email.com', '555-0105', 'O+', 'Latex', 'Chronic Kidney Disease Stage 3', 'active'),
('Patricia', 'Brown', '1983-01-25', 'female', 'patricia.b@email.com', '555-0106', 'A-', 'Codeine', 'Bipolar Disorder, Hypothyroidism', 'active'),
('Michael', 'Davis', '1945-06-18', 'male', 'michael.d@email.com', '555-0107', 'B-', 'None', 'COPD, Type 2 Diabetes, CHF', 'active'),
('Susan', 'Taylor', '1995-12-03', 'female', 'susan.t@email.com', '555-0108', 'A+', 'Amoxicillin', 'Lupus (SLE)', 'active'),
('Thomas', 'Anderson', '1960-08-14', 'male', 'thomas.a@email.com', '555-0109', 'O+', 'None', 'Parkinson''s Disease, Osteoporosis', 'active'),
('Karen', 'White', '1972-02-28', 'female', 'karen.w@email.com', '555-0110', 'AB-', 'NSAIDs', 'Crohn''s Disease', 'active'),
('Christopher', 'Harris', '1987-05-11', 'male', 'chris.h@email.com', '555-0111', 'A+', 'None', 'ADHD, Anxiety Disorder', 'active'),
('Barbara', 'Clark', '1958-10-20', 'female', 'barbara.c@email.com', '555-0112', 'O-', 'Tetracycline', 'Osteoarthritis, Hypertension, Diabetes', 'active'),
('Daniel', 'Lewis', '1999-03-07', 'male', 'daniel.l@email.com', '555-0113', 'B+', 'None', 'Type 1 Diabetes', 'active'),
('Nancy', 'Robinson', '1964-07-16', 'female', 'nancy.r@email.com', '555-0114', 'A-', 'Morphine', 'Multiple Sclerosis', 'active'),
('Paul', 'Walker', '1980-11-29', 'male', 'paul.w@email.com', '555-0115', 'O+', 'Contrast dye', 'Epilepsy, Migraine', 'inactive');

-- Health Records
INSERT INTO health_records (patient_id, record_type, title, description, record_date, doctor_name, facility, height_cm, weight_kg, blood_pressure, heart_rate, temperature) VALUES
(1, 'physical', 'Annual Physical Examination', 'Routine annual exam. BP slightly elevated, HbA1c at 7.2%', '2025-01-15', 'Dr. Sarah Chen', 'City Medical Center', 175.5, 89.0, '138/88', 78, 36.8),
(1, 'follow-up', 'Diabetes Management Follow-up', 'HbA1c improved to 6.9%. Medication adjustment discussed.', '2025-03-20', 'Dr. Sarah Chen', 'City Medical Center', 175.5, 87.5, '132/84', 76, 36.7),
(2, 'physical', 'Annual Physical', 'Asthma well controlled. Thyroid levels stable on current dose.', '2025-02-10', 'Dr. Michael Torres', 'Community Health Clinic', 162.0, 65.0, '118/74', 72, 36.6),
(3, 'cardiology', 'Cardiology Consultation', 'Ejection fraction 45%. New AFib episode. Anticoagulation reviewed.', '2025-01-28', 'Dr. Jennifer Park', 'Heart Institute', 178.0, 95.0, '145/92', 88, 36.9),
(4, 'rheumatology', 'Rheumatology Follow-up', 'Joint inflammation scores improved on biologic therapy. DAS28 = 3.2', '2025-02-18', 'Dr. Amy Liu', 'Rheumatology Associates', 168.0, 72.0, '122/78', 74, 37.1),
(5, 'nephrology', 'Nephrology Check', 'eGFR stable at 48. Proteinuria reduced. Continue current management.', '2025-03-05', 'Dr. Kevin Shah', 'Kidney Care Specialists', 172.0, 78.0, '128/82', 70, 36.8),
(6, 'psychiatry', 'Psychiatric Review', 'Mood stable on current regimen. No manic episodes in 6 months.', '2025-01-22', 'Dr. Rachel Green', 'Mental Health Center', 165.0, 68.0, '116/72', 68, 36.7),
(7, 'pulmonology', 'Pulmonology Visit', 'FEV1/FVC ratio 0.65. Oxygen saturation 94% at rest. Adjust bronchodilator.', '2025-02-28', 'Dr. Thomas Reid', 'Pulmonary Institute', 170.0, 92.0, '142/90', 84, 36.9),
(8, 'rheumatology', 'Lupus Management', 'SLEDAI score 4. Hydroxychloroquine continued. Renal function stable.', '2025-03-12', 'Dr. Amy Liu', 'Rheumatology Associates', 160.0, 58.0, '120/76', 76, 37.2),
(9, 'neurology', 'Parkinson''s Review', 'Motor symptoms mild. Levodopa dose adjusted. Falls risk assessment done.', '2025-01-30', 'Dr. Nina Patel', 'Neurology Center', 176.0, 80.0, '126/80', 68, 36.8),
(10, 'gastroenterology', 'GI Colonoscopy', 'No active disease. Remission maintained. Continue azathioprine.', '2025-02-14', 'Dr. Carlos Mendez', 'Digestive Health Center', 163.0, 61.0, '114/70', 66, 36.6),
(11, 'psychiatry', 'ADHD Management', 'Attention scores improved. Sleep hygiene counseled. Dose stable.', '2025-03-01', 'Dr. Rachel Green', 'Mental Health Center', 181.0, 83.0, '124/80', 72, 36.7),
(12, 'physical', 'Comprehensive Geriatric Assessment', 'Functional status maintained. Fall prevention program started.', '2025-01-10', 'Dr. Sarah Chen', 'City Medical Center', 158.0, 75.0, '148/94', 80, 36.9),
(13, 'endocrinology', 'Diabetes Endocrinology Visit', 'Time in range 68%. Pump settings adjusted. HbA1c 7.4%.', '2025-03-25', 'Dr. Laura Kim', 'Endocrine Specialists', 179.0, 76.0, '118/72', 74, 36.8),
(14, 'neurology', 'MS Follow-up', 'No new lesions on MRI. Fatigue score improved. Continue natalizumab.', '2025-02-22', 'Dr. Nina Patel', 'Neurology Center', 166.0, 63.0, '112/68', 64, 36.6);

-- Genome Markers
INSERT INTO genome_markers (patient_id, gene_name, variant, chromosome, position, significance, condition_association, confidence_score, notes) VALUES
(1, 'TCF7L2', 'rs7903146 T/T', '10', 114758349, 'pathogenic', 'Type 2 Diabetes risk 2x', 94.5, 'High risk variant for diabetes progression'),
(1, 'ACE', 'rs4646994 D/D', '17', 61565685, 'likely pathogenic', 'Hypertension, Cardiovascular risk', 87.0, 'Associated with higher ACE activity'),
(2, 'ADRB2', 'rs1042713 A/A', '5', 148206440, 'pathogenic', 'Asthma severity, Beta-agonist response reduced', 91.2, 'Poor response to short-acting beta agonists'),
(3, 'KCNQ1', 'rs2237895 C/C', '11', 2787801, 'pathogenic', 'Atrial Fibrillation susceptibility', 89.0, 'Increased risk of atrial flutter'),
(4, 'HLA-DRB1', 'HLA-DRB1*04:01', '6', 32589641, 'pathogenic', 'Rheumatoid Arthritis severity', 95.0, 'Shared epitope hypothesis positive'),
(5, 'APOL1', 'G1/G2 variant', '22', 36661906, 'pathogenic', 'CKD progression, FSGS risk', 92.5, 'High risk genotype for kidney disease'),
(6, 'SLC6A4', 'S/S genotype', '17', 28521441, 'likely pathogenic', 'Bipolar Disorder, Antidepressant response', 83.0, 'Short allele associated with mood disorders'),
(7, 'SERPINA1', 'PiZZ genotype', '14', 94843866, 'pathogenic', 'Alpha-1 Antitrypsin Deficiency, severe COPD', 99.0, 'Carrier confirmed by protein assay'),
(8, 'IRF5', 'rs2004640 T/T', '7', 128578301, 'likely pathogenic', 'Systemic Lupus Erythematosus', 88.5, 'Type I interferon pathway activation'),
(9, 'LRRK2', 'G2019S mutation', '12', 40734202, 'pathogenic', 'Parkinson''s Disease', 97.0, 'Autosomal dominant mutation, kinase hyperactivation'),
(10, 'NOD2', 'R702W variant', '16', 50745926, 'pathogenic', 'Crohn''s Disease susceptibility', 90.0, 'Impaired bacterial recognition'),
(11, 'DRD4', '7-repeat allele', '11', 636693, 'likely pathogenic', 'ADHD, Novelty seeking behavior', 79.5, 'Associated with reduced dopamine receptor activity'),
(12, 'GDF5', 'rs143384 A/A', '20', 35433520, 'pathogenic', 'Osteoarthritis risk increased', 86.0, 'Reduced joint space maintenance'),
(13, 'INS', 'VNTR class I', '11', 2138370, 'pathogenic', 'Type 1 Diabetes susceptibility', 93.5, 'Lower insulin gene expression in thymus'),
(14, 'HLA-DRB1', 'HLA-DRB1*15:01', '6', 32589641, 'pathogenic', 'Multiple Sclerosis risk 3x', 96.0, 'Strongest genetic risk factor for MS');

-- Medications
INSERT INTO medications (patient_id, name, generic_name, dosage, frequency, route, indication, prescriber, start_date, status) VALUES
(1, 'Metformin', 'Metformin HCl', '1000mg', 'Twice daily', 'oral', 'Type 2 Diabetes', 'Dr. Sarah Chen', '2019-06-01', 'active'),
(1, 'Lisinopril', 'Lisinopril', '10mg', 'Once daily', 'oral', 'Hypertension', 'Dr. Sarah Chen', '2020-01-15', 'active'),
(2, 'Levothyroxine', 'Levothyroxine sodium', '75mcg', 'Once daily morning', 'oral', 'Hypothyroidism', 'Dr. Michael Torres', '2018-03-10', 'active'),
(2, 'Fluticasone/Salmeterol', 'Fluticasone/Salmeterol', '250/50mcg', 'Twice daily', 'inhaled', 'Asthma control', 'Dr. Michael Torres', '2018-03-10', 'active'),
(3, 'Warfarin', 'Warfarin sodium', '5mg', 'Once daily', 'oral', 'Atrial Fibrillation anticoagulation', 'Dr. Jennifer Park', '2021-09-01', 'active'),
(3, 'Metoprolol', 'Metoprolol succinate', '50mg', 'Once daily', 'oral', 'Coronary Artery Disease, Heart rate control', 'Dr. Jennifer Park', '2021-09-01', 'active'),
(4, 'Adalimumab', 'Adalimumab', '40mg', 'Every 2 weeks', 'subcutaneous', 'Rheumatoid Arthritis', 'Dr. Amy Liu', '2022-05-15', 'active'),
(4, 'Methotrexate', 'Methotrexate', '15mg', 'Once weekly', 'oral', 'Rheumatoid Arthritis', 'Dr. Amy Liu', '2022-05-15', 'active'),
(5, 'Lisinopril', 'Lisinopril', '20mg', 'Once daily', 'oral', 'CKD, Proteinuria reduction', 'Dr. Kevin Shah', '2020-11-20', 'active'),
(6, 'Lithium carbonate', 'Lithium carbonate', '300mg', 'Three times daily', 'oral', 'Bipolar Disorder maintenance', 'Dr. Rachel Green', '2016-08-01', 'active'),
(7, 'Tiotropium', 'Tiotropium bromide', '18mcg', 'Once daily', 'inhaled', 'COPD maintenance', 'Dr. Thomas Reid', '2017-04-10', 'active'),
(8, 'Hydroxychloroquine', 'Hydroxychloroquine sulfate', '400mg', 'Once daily', 'oral', 'Systemic Lupus Erythematosus', 'Dr. Amy Liu', '2021-03-20', 'active'),
(9, 'Carbidopa/Levodopa', 'Carbidopa/Levodopa', '25/100mg', 'Three times daily', 'oral', 'Parkinson''s Disease', 'Dr. Nina Patel', '2020-07-15', 'active'),
(10, 'Azathioprine', 'Azathioprine', '100mg', 'Once daily', 'oral', 'Crohn''s Disease remission maintenance', 'Dr. Carlos Mendez', '2023-01-10', 'active'),
(13, 'Insulin Lispro', 'Insulin lispro', '0.1 u/kg', 'With meals', 'insulin pump', 'Type 1 Diabetes', 'Dr. Laura Kim', '2018-09-01', 'active');

-- Lab Results
INSERT INTO lab_results (patient_id, test_name, category, value, unit, reference_range, status, test_date, lab_name) VALUES
(1, 'HbA1c', 'metabolic', 6.9, '%', '4.0-5.7', 'abnormal', '2025-03-20', 'LabCorp'),
(1, 'Fasting Glucose', 'metabolic', 142, 'mg/dL', '70-99', 'high', '2025-03-20', 'LabCorp'),
(1, 'eGFR', 'renal', 72, 'mL/min/1.73m2', '>60', 'normal', '2025-03-20', 'LabCorp'),
(2, 'TSH', 'thyroid', 2.4, 'mIU/L', '0.4-4.0', 'normal', '2025-02-10', 'Quest Diagnostics'),
(2, 'Free T4', 'thyroid', 1.2, 'ng/dL', '0.8-1.8', 'normal', '2025-02-10', 'Quest Diagnostics'),
(3, 'INR', 'coagulation', 2.3, 'ratio', '2.0-3.0', 'normal', '2025-01-28', 'City Hospital Lab'),
(3, 'BNP', 'cardiac', 380, 'pg/mL', '<100', 'high', '2025-01-28', 'City Hospital Lab'),
(4, 'CRP', 'inflammation', 4.2, 'mg/L', '<3.0', 'abnormal', '2025-02-18', 'LabCorp'),
(4, 'ESR', 'inflammation', 38, 'mm/hr', '<20', 'high', '2025-02-18', 'LabCorp'),
(5, 'Creatinine', 'renal', 1.8, 'mg/dL', '0.7-1.2', 'high', '2025-03-05', 'NephroLab'),
(5, 'eGFR', 'renal', 48, 'mL/min/1.73m2', '>60', 'low', '2025-03-05', 'NephroLab'),
(7, 'FEV1', 'pulmonary', 1.8, 'L', '3.0-4.5', 'low', '2025-02-28', 'Pulmonary Lab'),
(8, 'ANA', 'autoimmune', 1, 'titer 1:160', 'negative', 'abnormal', '2025-03-12', 'Immunology Lab'),
(13, 'HbA1c', 'metabolic', 7.4, '%', '4.0-5.7', 'abnormal', '2025-03-25', 'Endocrine Lab'),
(14, 'VEP', 'neurological', 1, 'delayed', 'normal', 'abnormal', '2025-02-22', 'Neuro Lab');

-- Treatment Recommendations
INSERT INTO treatment_recommendations (patient_id, recommendation_type, title, description, priority, evidence_level, status) VALUES
(1, 'medication', 'Initiate GLP-1 Receptor Agonist', 'Consider adding semaglutide given TCF7L2 variant and poor glycemic control. Strong evidence for CV benefit.', 'high', 'A', 'active'),
(1, 'lifestyle', 'Structured Diabetes Exercise Program', 'Mediterranean diet and 150 min/week aerobic exercise proven to reduce HbA1c by 0.6-0.8%', 'high', 'A', 'active'),
(2, 'monitoring', 'Annual Pulmonary Function Test', 'ADRB2 variant indicates reduced beta-agonist response. Annual spirometry recommended.', 'medium', 'B', 'active'),
(3, 'medication', 'Switch to DOAC from Warfarin', 'Apixaban preferred over warfarin for AFib given narrow therapeutic window issues. Genomic CYP2C9 testing advised.', 'high', 'A', 'active'),
(4, 'monitoring', 'Cardiovascular Risk Screening', 'HLA-DRB1*04:01 carriers have elevated CV risk. Annual lipid panel and echo recommended.', 'high', 'B', 'active'),
(5, 'medication', 'Add SGLT2 Inhibitor for Renoprotection', 'Empagliflozin has strong evidence for CKD progression delay. Consider given eGFR 48.', 'high', 'A', 'active'),
(6, 'monitoring', 'Lithium Level Monitoring', 'SLC6A4 S/S genotype increases sensitivity to lithium. Monthly levels until stable.', 'high', 'B', 'active'),
(7, 'referral', 'Alpha-1 Antitrypsin Augmentation Therapy', 'PiZZ genotype confirmed. IV AAT augmentation therapy evaluation recommended.', 'critical', 'A', 'active'),
(8, 'monitoring', 'Renal Biopsy Consideration', 'IRF5 variant increases lupus nephritis risk. Persistent proteinuria warrants evaluation.', 'high', 'B', 'active'),
(9, 'medication', 'LRRK2 Inhibitor Clinical Trial', 'LRRK2 G2019S mutation carrier. Eligible for investigational LRRK2 kinase inhibitor trial.', 'medium', 'B', 'active'),
(10, 'medication', 'Vedolizumab for Refractory Disease', 'NOD2 variants associated with reduced TNF inhibitor response. Gut-selective biologic may be superior.', 'high', 'A', 'active'),
(11, 'medication', 'Stimulant Medication Optimization', 'DRD4 7-repeat allele associated with reduced stimulant response. Non-stimulant alternatives or higher doses may be needed.', 'medium', 'B', 'active'),
(13, 'technology', 'Closed-Loop Insulin Delivery System', 'Hybrid closed-loop pump shown to improve time-in-range by 11%. Consider upgrade from current open-loop system.', 'high', 'A', 'active'),
(14, 'medication', 'Natalizumab Continuation', 'HLA-DRB1*15:01 associated with more active MS. High-efficacy therapy continuation recommended.', 'high', 'A', 'active'),
(2, 'vaccination', 'Annual Influenza + Pneumococcal Vaccination', 'Asthma patients with ADRB2 variant have higher infection risk. Ensure up-to-date vaccinations.', 'medium', 'A', 'active');
