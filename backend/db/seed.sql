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

-- ==========================================================================
-- Audit feature seed data (2026-05-14)
-- ==========================================================================

-- PGx diplotypes — real CPIC star-allele nomenclature.
INSERT INTO pgx_diplotypes (patient_id, gene, allele1, allele2, phenotype, activity_score, source, reported_at, notes) VALUES
(1,  'CYP2C19', '*2',    '*2',    'Poor Metabolizer',          0.0, 'sequencing', '2024-08-12', 'rs4244285 G>A homozygous; loss-of-function for clopidogrel activation.'),
(1,  'CYP2D6',  '*1',    '*4',    'Intermediate Metabolizer',  1.0, 'sequencing', '2024-08-12', 'rs3892097 splice defect on *4 allele.'),
(2,  'CYP2C19', '*1',    '*17',   'Rapid Metabolizer',         1.5, 'sequencing', '2024-06-01', 'rs12248560 -806C>T, increased CYP2C19 expression.'),
(2,  'CYP2D6',  '*1',    '*1',    'Normal Metabolizer',        2.0, 'sequencing', '2024-06-01', 'Wild-type diplotype.'),
(3,  'CYP2C9',  '*1',    '*2',    'Intermediate Metabolizer',  1.5, 'sequencing', '2024-09-10', 'rs1799853 Arg144Cys; warfarin sensitivity.'),
(3,  'VKORC1',  '-1639A','-1639A','Low-Dose Sensitive',         NULL,'sequencing', '2024-09-10', 'rs9923231 promoter SNP A/A; reduced VKORC1 expression -> low warfarin dose.'),
(4,  'TPMT',    '*1',    '*3A',   'Intermediate Metabolizer',  1.0, 'sequencing', '2024-07-22', 'rs1800460+rs1142345; reduce thiopurine dose 30-70%.'),
(4,  'HLA-DRB1','*04:01','*04:04','RA Shared Epitope',          NULL,'HLA typing', '2024-07-22', 'Shared epitope hypothesis; predicts erosive RA.'),
(5,  'SLCO1B1', '*1',    '*5',    'Decreased Function',        NULL,'sequencing', '2024-10-01', 'rs4149056 c.521T>C; simvastatin myopathy risk.'),
(6,  'CYP2D6',  '*1xN',  '*1',    'Ultrarapid Metabolizer',    3.0, 'sequencing', '2024-05-15', 'CYP2D6 duplication; codeine -> morphine toxicity risk.'),
(7,  'CYP3A5',  '*3',    '*3',    'Poor Expresser',            0.0, 'sequencing', '2024-04-20', 'rs776746 intron3 G>A; reduce tacrolimus dose 60%.'),
(8,  'HLA-B',   '*57:01','*15:01','HLA-B*57:01 Positive',       NULL,'HLA typing', '2024-11-02', 'Contraindicates abacavir; severe hypersensitivity risk.'),
(8,  'HLA-B',   '*15:02','*46:01','HLA-B*15:02 Positive',       NULL,'HLA typing', '2024-11-02', 'Contraindicates carbamazepine; SJS/TEN risk.'),
(9,  'CYP2D6',  '*4',    '*4',    'Poor Metabolizer',           0.0,'sequencing', '2024-03-30', 'No CYP2D6 activity; tamoxifen and codeine ineffective.'),
(10, 'DPYD',    '*1',    '*2A',   'Intermediate Metabolizer',  1.0, 'sequencing', '2024-12-10', 'rs3918290 IVS14+1G>A; reduce 5-FU/capecitabine dose 50%.'),
(11, 'CYP2C19', '*17',   '*17',   'Ultrarapid Metabolizer',    2.0, 'sequencing', '2024-09-18', 'Ultrarapid; clopidogrel super-responder, escitalopram subtherapeutic.'),
(12, 'NUDT15',  '*1',    '*3',    'Intermediate Metabolizer',  1.0, 'sequencing', '2024-08-05', 'rs116855232 C>T; thiopurine myelosuppression risk.'),
(13, 'IFNL3',   'rs12979860', 'CC', 'Favorable Response',       NULL,'sequencing', '2024-02-14', 'IL28B CC genotype; favorable interferon response.'),
(14, 'G6PD',    'A-',    'B',     'G6PD Deficient (heterozygous female)', NULL,'sequencing', '2024-06-25', 'A- variant; avoid oxidative stress drugs (primaquine, dapsone, rasburicase).'),
(15, 'CYP2B6',  '*6',    '*6',    'Poor Metabolizer',          0.0, 'sequencing', '2024-10-20', 'rs3745274 G>T homozygous; efavirenz CNS toxicity, methadone accumulation.');

-- PGx drug rules — CPIC Level A drug-gene pairs.
INSERT INTO pgx_drug_rules (gene, drug, phenotype, recommendation, classification, evidence_level, cpic_guideline) VALUES
('CYP2C19', 'clopidogrel',   'Poor Metabolizer',          'Avoid clopidogrel. Use prasugrel or ticagrelor at standard label dose.', 'Avoid',          'A', 'CPIC 2022 — Clopidogrel and CYP2C19'),
('CYP2C19', 'clopidogrel',   'Intermediate Metabolizer',  'Consider prasugrel or ticagrelor; if clopidogrel used, monitor closely for ACS recurrence.', 'Alternative', 'A', 'CPIC 2022 — Clopidogrel and CYP2C19'),
('CYP2C19', 'clopidogrel',   'Normal Metabolizer',        'Use clopidogrel at standard label dose (75 mg/day).', 'Standard',  'A', 'CPIC 2022'),
('CYP2C19', 'clopidogrel',   'Rapid Metabolizer',         'Use clopidogrel at standard label dose.', 'Standard',  'A', 'CPIC 2022'),
('CYP2C19', 'clopidogrel',   'Ultrarapid Metabolizer',    'Use clopidogrel at standard label dose; enhanced platelet inhibition expected.', 'Standard', 'A', 'CPIC 2022'),
('CYP2C19', 'escitalopram',  'Poor Metabolizer',          'Reduce starting dose by 50%; consider non-CYP2C19 SSRI (sertraline, paroxetine).', 'Reduce dose', 'A', 'CPIC 2023 — SSRIs'),
('CYP2C19', 'escitalopram',  'Ultrarapid Metabolizer',    'Consider non-CYP2C19 SSRI; expected subtherapeutic exposure.', 'Alternative', 'A', 'CPIC 2023'),
('CYP2D6',  'codeine',       'Poor Metabolizer',          'Avoid codeine; lack of analgesic effect. Use non-tramadol opioid.', 'Avoid',          'A', 'CPIC 2021 — Codeine and CYP2D6'),
('CYP2D6',  'codeine',       'Ultrarapid Metabolizer',    'Avoid codeine; risk of life-threatening morphine toxicity.', 'Avoid',          'A', 'CPIC 2021'),
('CYP2D6',  'codeine',       'Normal Metabolizer',        'Use label-recommended dose.', 'Standard', 'A', 'CPIC 2021'),
('CYP2D6',  'tamoxifen',     'Poor Metabolizer',          'Use aromatase inhibitor (anastrozole/letrozole) if postmenopausal; tamoxifen requires 4-OH conversion.', 'Alternative', 'A', 'CPIC 2018 — Tamoxifen and CYP2D6'),
('CYP2C9',  'warfarin',      'Intermediate Metabolizer',  'Use IWPC pharmacogenetic algorithm; expect 30-50% lower maintenance dose.', 'Reduce dose', 'A', 'CPIC 2017 — Warfarin'),
('VKORC1',  'warfarin',      'Low-Dose Sensitive',        'Use IWPC algorithm; -1639AA reduces dose ~30% vs GG.', 'Reduce dose', 'A', 'CPIC 2017'),
('TPMT',    'azathioprine',  'Intermediate Metabolizer',  'Reduce starting dose by 30-50%; monitor CBC every 2 weeks for 1 month.', 'Reduce dose', 'A', 'CPIC 2018 — TPMT/NUDT15 and thiopurines'),
('TPMT',    'azathioprine',  'Poor Metabolizer',          'Use alternative non-thiopurine immunosuppressant; risk of fatal myelosuppression.', 'Avoid', 'A', 'CPIC 2018'),
('SLCO1B1', 'simvastatin',   'Decreased Function',        'Limit simvastatin to 20 mg/day or use rosuvastatin/pravastatin to reduce myopathy risk.', 'Alternative', 'A', 'CPIC 2022 — SLCO1B1 and statins'),
('CYP3A5',  'tacrolimus',    'Poor Expresser',            'Standard label starting dose; CYP3A5*3/*3 patients require lower doses to achieve target trough.', 'Standard', 'A', 'CPIC 2015 — Tacrolimus'),
('HLA-B',   'abacavir',      'HLA-B*57:01 Positive',      'Avoid abacavir; nearly 100% PPV for severe hypersensitivity. Use alternative NRTI.', 'Avoid', 'A', 'CPIC 2014 — Abacavir and HLA-B*57:01'),
('HLA-B',   'carbamazepine', 'HLA-B*15:02 Positive',      'Avoid carbamazepine; high risk of SJS/TEN. Use valproate or levetiracetam.', 'Avoid', 'A', 'CPIC 2017 — Carbamazepine and HLA-B*15:02'),
('DPYD',    'fluorouracil',  'Intermediate Metabolizer',  'Reduce starting dose by 50%; titrate based on toxicity and pharmacokinetics.', 'Reduce dose', 'A', 'CPIC 2017 — DPYD and fluoropyrimidines'),
('NUDT15',  'azathioprine',  'Intermediate Metabolizer',  'Reduce starting dose by 30-80% in adults; lower dose in pediatric patients.', 'Reduce dose', 'A', 'CPIC 2018'),
('G6PD',    'rasburicase',   'G6PD Deficient (heterozygous female)', 'Rasburicase contraindicated; acute hemolytic anemia risk.', 'Avoid', 'A', 'CPIC 2014 — Rasburicase and G6PD'),
('IFNL3',   'pegIFN',        'Favorable Response',        'rs12979860 CC genotype predicts ~80% SVR with PEG-IFN/RBV in HCV genotype 1.', 'Standard', 'A', 'CPIC 2014 — IFNL3'),
('CYP2B6',  'efavirenz',     'Poor Metabolizer',          'Consider efavirenz 400 mg/day or alternative ARV; CNS toxicity risk at standard 600 mg.', 'Reduce dose', 'A', 'CPIC 2019 — Efavirenz and CYP2B6');

-- ACMG variant interpretations — real ClinVar variants, real ACMG criteria.
INSERT INTO variant_interpretations (patient_id, gene, hgvs_c, hgvs_p, rsid, chromosome, position, ref_allele, alt_allele, zygosity, clinvar_id, gnomad_af, acmg_criteria, acmg_classification, acmg_score, condition, reviewed_by, reviewed_at) VALUES
(1,  'BRCA1',  'c.5266dupC',         'p.Gln1756ProfsTer74',     'rs80357906',  '17', 43057062, 'C',  'CC',  'heterozygous', '17661',   0.00000400, '{"PVS1":true,"PM2":true,"PP5":true}'::jsonb,                  'Pathogenic',         10, 'Hereditary Breast and Ovarian Cancer', 'Dr. Sarah Chen',   '2025-02-10'),
(2,  'BRCA2',  'c.5946delT',         'p.Ser1982ArgfsTer22',     'rs80359550',  '13', 32340301, 'CT', 'C',   'heterozygous', '38119',   0.00000200, '{"PVS1":true,"PM2":true,"PP5":true}'::jsonb,                  'Pathogenic',         10, 'Hereditary Breast and Ovarian Cancer', 'Dr. Sarah Chen',   '2025-01-22'),
(3,  'EGFR',   'c.2573T>G',          'p.Leu858Arg',             'rs121434568', '7',  55259515, 'T',  'G',   'heterozygous', '16609',   0.00000100, '{"PS1":true,"PS3":true,"PM1":true,"PM5":true,"PP3":true}'::jsonb, 'Pathogenic',         10, 'NSCLC — TKI-sensitive', 'Dr. Sarah Chen', '2025-03-01'),
(3,  'EGFR',   'c.2369C>T',          'p.Thr790Met',             'rs121434569', '7',  55249071, 'C',  'T',   'heterozygous', '16610',   0.00000500, '{"PS1":true,"PS3":true,"PM1":true,"PP3":true}'::jsonb,        'Pathogenic',         9,  'NSCLC — TKI resistance', 'Dr. Sarah Chen', '2025-03-01'),
(4,  'TP53',   'c.733G>A',           'p.Gly245Ser',             'rs28934575',  '17', 7674220,  'C',  'T',   'heterozygous', '12347',   0.00000300, '{"PS1":true,"PM1":true,"PM2":true,"PP3":true,"PP5":true}'::jsonb, 'Pathogenic',         9,  'Li-Fraumeni Syndrome', 'Dr. Sarah Chen', '2025-02-18'),
(5,  'CFTR',   'c.1521_1523delCTT',  'p.Phe508del',             'rs113993960', '7',  117559590,'CTT','C',   'homozygous',   '7105',    0.00750000, '{"PS3":true,"PM4":true,"PP5":true}'::jsonb,                   'Pathogenic',         8,  'Cystic Fibrosis', 'Dr. Kevin Shah', '2025-03-05'),
(6,  'MTHFR',  'c.665C>T',           'p.Ala222Val',             'rs1801133',   '1',  11796321, 'C',  'T',   'heterozygous', '3520',    0.30000000, '{"BS1":true,"BS2":true}'::jsonb,                              'Benign',             -2, 'Common variant', 'Dr. Rachel Green', '2025-01-22'),
(7,  'SERPINA1','c.1096G>A',         'p.Glu366Lys',             'rs28929474',  '14', 94378610, 'G',  'A',   'homozygous',   '17968',   0.01700000, '{"PS3":true,"PM3":true,"PP3":true}'::jsonb,                   'Pathogenic',         7,  'Alpha-1 Antitrypsin Deficiency', 'Dr. Thomas Reid', '2025-02-28'),
(8,  'C1QA',   'c.622C>T',           'p.Arg208Ter',             'rs104894523', '1',  22692567, 'C',  'T',   'heterozygous', '6105',    0.00000050, '{"PVS1":true,"PM2":true,"PP3":true}'::jsonb,                  'Pathogenic',         9,  'SLE-associated complement deficiency', 'Dr. Amy Liu', '2025-03-12'),
(9,  'LRRK2',  'c.6055G>A',          'p.Gly2019Ser',            'rs34637584',  '12', 40340400, 'G',  'A',   'heterozygous', '7022',    0.00100000, '{"PS3":true,"PM1":true,"PP1":true,"PP3":true,"PP5":true}'::jsonb, 'Pathogenic',         8,  'Familial Parkinson Disease', 'Dr. Nina Patel', '2025-01-30'),
(10, 'NOD2',   'c.2104C>T',          'p.Arg702Trp',             'rs2066844',   '16', 50712015, 'C',  'T',   'heterozygous', '4691',    0.04000000, '{"PS3":true,"PP3":true,"BS1":false}'::jsonb,                  'Likely pathogenic',  6,  'Crohn Disease susceptibility', 'Dr. Carlos Mendez', '2025-02-14'),
(11, 'KRAS',   'c.35G>A',            'p.Gly12Asp',              'rs121913529', '12', 25245350, 'C',  'T',   'heterozygous', '12579',   0.00000000, '{"PS1":true,"PS3":true,"PM1":true,"PM5":true,"PP3":true}'::jsonb, 'Pathogenic',         10, 'Somatic CRC driver', 'Dr. Sarah Chen', '2025-03-15'),
(12, 'APOE',   'c.388T>C',           'p.Cys130Arg',             'rs429358',    '19', 44908684, 'T',  'C',   'homozygous',   '17848',   0.13000000, '{"PS3":true,"PP1":true,"BS1":true}'::jsonb,                   'Risk allele (APOE4/4)', 4, 'Late-onset Alzheimer risk', 'Dr. Nina Patel', '2025-01-10'),
(13, 'HNF1A',  'c.872dupC',          'p.Gly292ArgfsTer25',      'rs587776825', '12', 121440963,'C',  'CC',  'heterozygous', '14938',   0.00000100, '{"PVS1":true,"PM2":true,"PP5":true}'::jsonb,                  'Pathogenic',         10, 'MODY3 — Maturity-Onset Diabetes', 'Dr. Laura Kim', '2025-03-25'),
(14, 'MOG',    'c.343C>T',           'p.Arg115Ter',             'rs1057519809','6',  29657193, 'C',  'T',   'heterozygous', '376521',  0.00010000, '{"PVS1":true,"PM2":true}'::jsonb,                             'Likely pathogenic',  6,  'MOG-associated demyelinating disease', 'Dr. Nina Patel', '2025-02-22'),
(15, 'SCN1A',  'c.4934C>T',          'p.Thr1645Ile',            'rs121917923', '2',  166055120,'C',  'T',   'heterozygous', '68713',   0.00000200, '{"PS1":true,"PM1":true,"PM2":true,"PP3":true}'::jsonb,        'Pathogenic',         8,  'Dravet Syndrome / GEFS+', 'Dr. Nina Patel', '2025-02-05');

-- Polygenic risk scores
INSERT INTO prs_scores (patient_id, trait, pgs_catalog_id, raw_score, z_score, percentile, ancestry, variant_count, risk_category, hazard_ratio, reference_population) VALUES
(1,  'Type 2 Diabetes',           'PGS000036',  4.182, 2.31, 98.96, 'EUR', 6917403, 'Very High', 3.20, 'UK Biobank EUR (n=391,124)'),
(1,  'Coronary Artery Disease',   'PGS000018',  3.547, 1.92, 97.26, 'EUR', 1745179, 'Very High', 2.81, 'UK Biobank EUR'),
(1,  'Atrial Fibrillation',       'PGS000016',  0.842, 0.41, 65.91, 'EUR', 6730541, 'Average',   1.08, 'UK Biobank EUR'),
(2,  'Asthma',                    'PGS000026',  1.732, 1.45, 92.65, 'EUR',  167825, 'High',      1.95, 'UK Biobank EUR'),
(2,  'Breast Cancer',             'PGS000015',  0.234, 0.18, 57.14, 'EUR',  313853, 'Average',   1.05, 'BCAC EUR (n=247,173)'),
(3,  'Coronary Artery Disease',   'PGS000018',  4.121, 2.78, 99.73, 'EUR', 1745179, 'Very High', 3.62, 'UK Biobank EUR'),
(3,  'Atrial Fibrillation',       'PGS000016',  3.012, 2.41, 99.20, 'EUR', 6730541, 'Very High', 3.41, 'UK Biobank EUR'),
(4,  'Rheumatoid Arthritis',      'PGS000041',  2.831, 1.78, 96.25, 'EUR',  198000, 'High',      2.45, 'PGC EUR'),
(5,  'Chronic Kidney Disease',    'PGS000295',  2.115, 1.42, 92.21, 'EUR',  765345, 'High',      1.88, 'CKDGen EUR'),
(6,  'Bipolar Disorder',          'PGS000027',  1.945, 1.61, 94.63, 'EUR',  823215, 'High',      2.10, 'PGC EUR (n=413,466)'),
(7,  'COPD',                      'PGS000043',  3.124, 2.05, 97.98, 'EUR',  413000, 'Very High', 2.95, 'COPDGene EUR'),
(8,  'Systemic Lupus Erythematosus','PGS001235',2.541, 1.82, 96.56, 'EUR',  158000, 'High',      2.41, 'IIBDGC EUR'),
(9,  'Parkinson Disease',         'PGS000909',  2.985, 2.12, 98.30, 'EUR', 1805135, 'Very High', 3.05, 'IPDGC EUR'),
(10, 'Crohn Disease',             'PGS000034',  2.421, 1.74, 95.91, 'EUR',  201000, 'High',      2.35, 'IIBDGC EUR'),
(11, 'ADHD',                      'PGS000041',  0.945, 0.78, 78.23, 'EUR',  100000, 'Average',   1.42, 'PGC EUR'),
(12, 'Osteoarthritis',            'PGS001293',  2.812, 1.95, 97.44, 'EUR',  513000, 'High',      2.55, 'UK Biobank EUR'),
(13, 'Type 1 Diabetes',           'PGS000028',  4.512, 3.12, 99.91, 'EUR',  672561, 'Very High', 5.81, 'T1DGC EUR'),
(14, 'Multiple Sclerosis',        'PGS000043',  3.245, 2.41, 99.20, 'EUR',  200000, 'Very High', 3.45, 'IMSGC EUR'),
(15, 'Migraine',                  'PGS000302',  1.456, 1.12, 86.86, 'EUR',  375000, 'High',      1.65, 'IHGC EUR'),
(1,  'Lipid (LDL-C)',             'PGS000061',  2.118, 1.41, 92.08, 'EUR',  223125, 'High',      1.85, 'GLGC EUR (n=1.65M)');

-- Clinical trials — real NCT IDs and conditions where possible (synthetic eligibility constants).
INSERT INTO clinical_trials (nct_id, title, phase, status, condition, intervention, sponsor, required_gene, required_variant, min_age, max_age, sex, ecog_max, location, enrollment_target, primary_endpoint, start_date, completion_date) VALUES
('NCT04303780', 'Osimertinib in EGFR T790M+ NSCLC After Prior TKI',                       'Phase 3', 'Recruiting', 'Non-Small Cell Lung Cancer',  'Osimertinib 80 mg PO daily', 'AstraZeneca',                'EGFR',  'T790M',     18, 85, 'all',    2, 'Multi-center US/EU',   320, 'Progression-free survival',  '2024-03-01', '2026-12-31'),
('NCT05456789', 'Sotorasib in KRAS G12C-mutated Colorectal Cancer',                       'Phase 2', 'Recruiting', 'Metastatic Colorectal Cancer','Sotorasib 960 mg PO daily',  'Amgen',                      'KRAS',  'G12C',      18, NULL,'all',   2, 'MSKCC / MD Anderson',  180, 'Objective response rate',    '2025-01-15', '2027-06-30'),
('NCT04567890', 'Olaparib Maintenance for BRCA1/2-mutated Ovarian Cancer',                'Phase 3', 'Recruiting', 'Ovarian Cancer',              'Olaparib 300 mg PO BID',     'AstraZeneca',                'BRCA1', '5266dupC',  18, NULL,'female',1, 'NCI Network',          425, 'Progression-free survival',  '2024-06-01', '2027-12-31'),
('NCT05123456', 'Talazoparib for BRCA2-mutated Metastatic Breast Cancer',                 'Phase 3', 'Recruiting', 'Breast Cancer',               'Talazoparib 1 mg PO daily',  'Pfizer',                     'BRCA2', '5946delT',  18, NULL,'female',2, 'NSABP sites',          412, 'Overall response rate',      '2024-09-01', '2027-09-30'),
('NCT04887493', 'Donanemab for Early Symptomatic Alzheimer Disease',                      'Phase 3', 'Active',     'Alzheimer Disease',           'Donanemab 1400 mg IV q4w',  'Eli Lilly',                  'APOE',  'E4/E4',     50, 90, 'all',    1, '300 global sites',    1736, 'iADRS rate of change',       '2023-06-01', '2027-12-31'),
('NCT04567123', 'Tofersen in SOD1-ALS — Open-Label Extension',                            'Phase 3', 'Active',     'Amyotrophic Lateral Sclerosis','Tofersen 100 mg IT q4w',    'Biogen',                     'SOD1',  'A5V',       18, 85, 'all',    3, 'Mayo / MGH / others',  108, 'Slow vital capacity',        '2024-01-01', '2027-01-01'),
('NCT05678234', 'Voretigene for RPE65 Biallelic Mutation Retinal Dystrophy',              'Phase 3', 'Recruiting', 'Inherited Retinal Dystrophy', 'Voretigene neparvovec 1.5e11 vg', 'Spark Therapeutics',   'RPE65', 'biallelic LoF', 3, NULL,'all', 2, 'CHOP / Bascom Palmer', 40,  'Multi-luminance mobility',   '2024-04-01', '2027-04-01'),
('NCT05002345', 'Inclisiran for High PRS-CAD Primary Prevention',                         'Phase 3', 'Recruiting', 'Coronary Artery Disease',     'Inclisiran 284 mg SC q6m',   'Novartis',                   NULL,    NULL,        45, 75, 'all',    1, 'NHLBI sites',         5000, 'MACE 4-yr incidence',        '2025-02-01', '2030-02-01'),
('NCT04999111', 'Crizotinib for ROS1-rearranged NSCLC',                                   'Phase 2', 'Recruiting', 'Non-Small Cell Lung Cancer',  'Crizotinib 250 mg PO BID',   'Pfizer',                     'ROS1',  'fusion',    18, NULL,'all',   2, 'LUNGevity sites',      150, 'Objective response rate',    '2024-07-01', '2027-07-01'),
('NCT05111222', 'Lecanemab in MCI Due to AD with APOE Stratification',                    'Phase 4', 'Recruiting', 'Mild Cognitive Impairment',   'Lecanemab 10 mg/kg IV q2w',  'Eisai',                      'APOE',  'E4 carrier',50, 85, 'all',    1, 'ADCS sites',          1500, 'Brain volume change',        '2025-03-01', '2029-03-01'),
('NCT04321789', 'Glasdegib in FLT3-WT AML with CEBPA Mutation',                           'Phase 2', 'Recruiting', 'Acute Myeloid Leukemia',      'Glasdegib 100 mg PO daily',  'Pfizer',                     'CEBPA', 'biallelic', 18, 75, 'all',    2, 'COG sites',            120, 'Complete remission rate',    '2024-10-01', '2027-10-01'),
('NCT05432187', 'CRISPR Cas9 ex-vivo BCL11A Edit for Sickle Cell Disease',                'Phase 3', 'Recruiting', 'Sickle Cell Disease',         'Exa-cel one-time infusion',  'Vertex / CRISPR',            'HBB',   'rs334',     12, 35, 'all',    1, 'Children\'s Hospitals', 75,  'Annualized VOC rate',        '2024-12-01', '2028-12-01'),
('NCT04999777', 'Bevacizumab + Pembrolizumab in HRD+ Endometrial Cancer',                 'Phase 2', 'Recruiting', 'Endometrial Cancer',          'Bevacizumab + Pembrolizumab','GOG Foundation',             'BRCA1', NULL,        18, NULL,'female',2, 'GOG sites',            200, 'Progression-free survival',  '2025-05-01', '2027-12-31'),
('NCT05098765', 'Givosiran for Acute Hepatic Porphyria',                                  'Phase 4', 'Recruiting', 'Hepatic Porphyria',           'Givosiran 2.5 mg/kg SC qm', 'Alnylam',                    'ALAS1', NULL,        18, NULL,'all',   2, 'Porphyria centers',    100, 'Annualized attack rate',     '2024-08-01', '2027-08-01'),
('NCT05765432', 'Patisiran for hATTR Cardiomyopathy with TTR Mutation',                   'Phase 3', 'Recruiting', 'Transthyretin Amyloidosis',   'Patisiran 0.3 mg/kg IV q3w','Alnylam',                    'TTR',   'V122I',     18, 85, 'all',    3, 'Mayo / Boston',        300, 'NT-proBNP change',           '2024-11-01', '2027-11-01'),
('NCT04432109', 'Lonafarnib for Hutchinson-Gilford Progeria',                             'Phase 3', 'Recruiting', 'Progeria',                    'Lonafarnib 150 mg/m2 PO BID','Eiger BioPharmaceuticals',  'LMNA',  'G608G',     2,  20, 'all',    2, 'Boston Childrens',     45,  'Vascular stiffness',         '2025-01-01', '2029-01-01'),
('NCT05000456', 'Pirtobrutinib in Ibrutinib-Resistant CLL with BTK C481S',                'Phase 3', 'Recruiting', 'Chronic Lymphocytic Leukemia','Pirtobrutinib 200 mg PO daily','Eli Lilly',                'BTK',   'C481S',     18, NULL,'all',   2, 'LRF / FCS sites',      350, 'Progression-free survival',  '2024-05-01', '2028-05-01'),
('NCT04654321', 'Selpercatinib for RET-fusion+ Solid Tumors',                             'Phase 2', 'Recruiting', 'Solid Tumors',                'Selpercatinib 160 mg PO BID','Eli Lilly',                  'RET',   'fusion',    18, NULL,'all',   2, 'NCI MATCH Network',    200, 'Objective response rate',    '2024-09-15', '2027-09-15'),
('NCT05012345', 'Tepotinib in MET Exon 14 Skipping NSCLC',                                'Phase 2', 'Recruiting', 'Non-Small Cell Lung Cancer',  'Tepotinib 450 mg PO daily',  'Merck KGaA',                 'MET',   'exon14',    18, NULL,'all',   2, 'Multi-center',         180, 'Objective response rate',    '2024-08-01', '2027-08-01'),
('NCT05444333', 'Adagrasib + Cetuximab in KRAS G12C CRC',                                 'Phase 3', 'Recruiting', 'Colorectal Cancer',           'Adagrasib + Cetuximab',      'Mirati / BMS',               'KRAS',  'G12C',      18, NULL,'all',   2, 'NCCN sites',           420, 'Overall survival',           '2025-02-01', '2028-02-01'),
('NCT05333222', 'Lumacaftor/Ivacaftor for F508del Homozygous CF Aged 12+',                'Phase 4', 'Recruiting', 'Cystic Fibrosis',             'Lumacaftor/Ivacaftor',       'Vertex',                     'CFTR',  'F508del',   12, NULL,'all',   2, 'CFF sites',            260, 'ppFEV1 change',              '2024-06-01', '2027-12-31'),
('NCT05222111', 'Sotagliflozin Add-on for T1D Adults with High PRS',                      'Phase 3', 'Recruiting', 'Type 1 Diabetes',             'Sotagliflozin 200 mg PO QD','Lexicon',                    NULL,    NULL,        18, 65, 'all',    1, 'JDRF Network',         380, 'Time-in-range',              '2024-12-01', '2027-12-01');

-- Drug-drug interactions — clinically important pairs.
INSERT INTO drug_interactions (drug_a, drug_b, severity, mechanism, clinical_effect, management, evidence) VALUES
('warfarin',    'amiodarone',     'major',         'CYP2C9 and CYP3A4 inhibition by amiodarone',           'Marked increase in warfarin INR; bleeding risk',                              'Reduce warfarin dose 30-50%; check INR every 3-5 days for 4 weeks.', 'excellent'),
('warfarin',    'fluconazole',    'major',         'CYP2C9 inhibition',                                    'Up to 38% INR increase',                                                      'Reduce warfarin dose 25-50% during course; monitor INR.', 'excellent'),
('clopidogrel', 'omeprazole',     'moderate',      'CYP2C19 inhibition reduces clopidogrel activation',    'Reduced antiplatelet effect; possible CV events',                             'Use pantoprazole instead, or separate dosing by 12h.', 'good'),
('simvastatin', 'clarithromycin', 'contraindicated','CYP3A4 inhibition',                                   '10-20x increase in simvastatin AUC; rhabdomyolysis risk',                     'Suspend simvastatin during macrolide course.', 'excellent'),
('metformin',   'iodinated contrast','major',      'Reduced renal clearance of metformin during AKI',      'Lactic acidosis risk if AKI develops',                                        'Hold metformin 48h pre/post contrast in CKD; reassess eGFR.', 'good'),
('SSRIs',       'tramadol',       'major',         'Serotonergic synergy + CYP2D6 effect',                  'Serotonin syndrome',                                                          'Avoid combination; if needed, monitor for tremor, hyperreflexia, fever.', 'good'),
('lithium',     'NSAIDs',         'major',         'Reduced renal Li clearance',                            'Up to 60% increase in serum lithium; toxicity',                              'Check lithium level within 5-7 days; consider acetaminophen alternative.', 'excellent'),
('digoxin',     'amiodarone',     'major',         'P-gp inhibition increases digoxin AUC',                 'Digoxin toxicity (nausea, arrhythmias)',                                      'Reduce digoxin dose by 50%; check level at 7 days.', 'excellent'),
('warfarin',    'aspirin',        'major',         'Additive antiplatelet + anticoagulant effect',          'Major bleeding risk',                                                         'Only combine if indication (post-PCI / MV replacement); use PPI prophylaxis.', 'excellent'),
('apixaban',    'rifampin',       'major',         'CYP3A4 + P-gp induction',                              'Reduced apixaban exposure; thromboembolism risk',                             'Avoid combination; switch to warfarin if rifampin essential.', 'good'),
('tamoxifen',   'paroxetine',     'major',         'CYP2D6 inhibition prevents endoxifen formation',        'Reduced tamoxifen efficacy; higher recurrence risk',                          'Use venlafaxine, citalopram, or escitalopram instead.', 'good'),
('methotrexate','trimethoprim',   'contraindicated','Additive folate antagonism',                          'Severe myelosuppression',                                                     'Strictly avoid; use alternative antibiotic.', 'excellent'),
('carbamazepine','clarithromycin','major',         'CYP3A4 inhibition',                                    'Carbamazepine toxicity (ataxia, diplopia)',                                   'Switch to azithromycin or doxycycline.', 'excellent'),
('phenytoin',   'fluconazole',    'major',         'CYP2C9 inhibition',                                    'Phenytoin toxicity (nystagmus, ataxia)',                                      'Monitor phenytoin level; reduce dose 25-50%.', 'good'),
('linezolid',   'SSRIs',          'major',         'MAO inhibition',                                       'Serotonin syndrome',                                                          'Hold SSRI 2 weeks before linezolid course.', 'good'),
('cyclosporine','grapefruit juice','moderate',     'CYP3A4 + P-gp inhibition by furanocoumarins',          '38% increase in cyclosporine AUC; nephrotoxicity',                            'Counsel patient to avoid grapefruit/Seville oranges.', 'good'),
('codeine',     'paroxetine',     'major',         'CYP2D6 inhibition prevents codeine -> morphine',        'Loss of analgesic effect',                                                    'Use non-codeine opioid (morphine, oxycodone).', 'good'),
('abacavir',    'HLA-B*57:01',    'contraindicated','Immune-mediated hypersensitivity',                    'Severe, sometimes fatal hypersensitivity syndrome',                           'Test HLA-B*57:01 before initiating; if positive, do not prescribe.', 'excellent'),
('azathioprine','allopurinol',    'contraindicated','XO inhibition blocks thiopurine metabolism',          '4-5x increase in 6-MP exposure; fatal myelosuppression',                      'Reduce azathioprine dose by 75%, or avoid combination.', 'excellent'),
('clopidogrel', 'CYP2C19 *2/*2',  'major',         'Loss of CYP2C19 activation of clopidogrel',            'Reduced antiplatelet effect; stent thrombosis risk',                          'Use prasugrel or ticagrelor (CPIC Level A).', 'excellent');

-- Warfarin dosing history (IWPC algorithm output)
INSERT INTO warfarin_doses (patient_id, cyp2c9_genotype, vkorc1_rs9923231, age_years, height_cm, weight_kg, amiodarone_use, enzyme_inducer_use, predicted_weekly_dose_mg, predicted_daily_dose_mg, predicted_inr, actual_inr, actual_weekly_dose_mg, notes) VALUES
(3, '*1/*2', 'A/A', 73, 178, 95, false, false, 14.21, 2.03, 2.5, 2.3, 15.0, 'IWPC algorithm initial estimate; titrated up by 5%.'),
(3, '*1/*2', 'A/A', 73, 178, 95, true,  false, 10.05, 1.44, 2.4, 2.4, 10.5, 'Switched to amiodarone for AFib rate control — dose reduction applied.'),
(11,'*1/*1', 'G/G', 39, 181, 83, false, false, 38.50, 5.50, 2.4, 2.5, 38.0, 'Wild-type; standard maintenance dose.'),
(7, '*2/*3', 'A/G', 81, 170, 92, false, false, 11.50, 1.64, 2.5, 2.6, 12.0, 'Two LoF CYP2C9 alleles + heterozygous VKORC1 promoter — very low dose.');

