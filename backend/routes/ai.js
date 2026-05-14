const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const DISCLAIMER = 'Not medical advice — consult a clinician.';

async function callAI(prompt) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI service not configured');
    err.status = 503;
    throw err;
  }
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', messages: [{ role: 'user', content: prompt }], max_tokens: 1024 })
  });
  if (!res.ok) {
    const err = new Error(`AI upstream error (${res.status})`);
    err.status = 503;
    throw err;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

function aiError(res, e) {
  const status = e.status || 500;
  return res.status(status).json({ error: e.message, disclaimer: DISCLAIMER });
}

async function logAudit(req, action, target, meta) {
  try {
    const pool = require('../db');
    await pool.query(
      'INSERT INTO audit_log (user_id, user_email, action, target, meta) VALUES ($1,$2,$3,$4,$5)',
      [req.user?.id || null, req.user?.email || null, action, target || null, meta ? JSON.stringify(meta) : null]
    );
  } catch (_) { /* audit log table may not exist yet — non-fatal */ }
}

router.post('/patient-risk', auth, async (req, res) => {
  try {
    const { patientName, age, conditions, bloodType, allergies, genomicMarkers } = req.body;
    const result = await callAI(`You are a medical AI assistant. Analyze the health risk profile for patient ${patientName || 'Unknown'}.
Age: ${age || 'Unknown'}, Blood Type: ${bloodType || 'Unknown'}
Conditions: ${conditions || 'None reported'}
Allergies: ${allergies || 'None'}
Genomic Markers: ${genomicMarkers || 'None available'}

Provide a comprehensive risk assessment including:
- Overall risk level
- Key risk factors identified
- Disease susceptibilities based on genomic data
- Preventive care recommendations
- Priority health screenings needed
Be specific and clinically relevant.`);
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

router.post('/genomic-insights', auth, async (req, res) => {
  try {
    const { patientName, geneName, variant, significance, conditionAssociation, confidenceScore } = req.body;
    const result = await callAI(`You are a genomics AI specialist. Analyze this genomic finding for patient ${patientName || 'Unknown'}.
Gene: ${geneName}, Variant: ${variant}
Clinical Significance: ${significance}
Associated Condition: ${conditionAssociation}
Confidence Score: ${confidenceScore}%

Provide insights on:
- Clinical implications of this variant
- Inheritance patterns
- Recommended follow-up tests
- Potential therapeutic options
- Family screening recommendations
Use evidence-based guidance.`);
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

router.post('/medication-analysis', auth, async (req, res) => {
  try {
    const { patientName, medications, conditions, genomicMarkers } = req.body;
    const result = await callAI(`You are a clinical pharmacogenomics AI. Analyze the medication profile for patient ${patientName || 'Unknown'}.
Current Medications: ${medications || 'None'}
Conditions: ${conditions || 'Unknown'}
Relevant Genomic Markers: ${genomicMarkers || 'None available'}

Provide analysis on:
- Drug-drug interaction risks
- Pharmacogenomic considerations (CYP450 metabolism)
- Dosage optimization based on genetics
- Alternative medications if warranted
- Monitoring recommendations
Prioritize patient safety.`);
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

router.post('/treatment-plan', auth, async (req, res) => {
  try {
    const { patientName, age, conditions, labResults, genomicMarkers, currentMedications } = req.body;
    const result = await callAI(`You are a precision medicine AI. Generate a personalized treatment plan for ${patientName || 'a patient'}.
Age: ${age || 'Unknown'}, Conditions: ${conditions || 'None specified'}
Recent Lab Results: ${labResults || 'Not available'}
Genomic Profile: ${genomicMarkers || 'Standard'}
Current Medications: ${currentMedications || 'None'}

Create a personalized treatment plan including:
- Evidence-based treatment options tailored to genomic profile
- Lifestyle modifications
- Monitoring schedule
- Expected outcomes and timelines
- Precision medicine opportunities
Base recommendations on current clinical guidelines.`);
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

// ===== New AI features =====

// 1) Drug-interaction risk scorer
router.post('/drug-interaction', auth, async (req, res) => {
  try {
    const { patientName, medications, allergies, conditions } = req.body;
    const result = await callAI(`You are a clinical pharmacology AI. Score the drug-interaction risk for ${patientName || 'a patient'}.
Medications: ${medications || 'None'}
Allergies: ${allergies || 'None'}
Conditions: ${conditions || 'None'}

Provide:
- Overall interaction risk score (Low / Moderate / High / Critical) with brief justification
- Specific pairwise interactions (mechanism, severity, clinical impact)
- Allergy or contraindication conflicts
- Monitoring suggestions and lab markers to track
- Suggested alternative regimens where appropriate
Be concise and structured.`);
    await logAudit(req, 'ai.drug_interaction', patientName, { medications });
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

// 2) Treatment-response predictor
router.post('/treatment-response', auth, async (req, res) => {
  try {
    const { patientName, age, conditions, proposedTreatment, genomicMarkers, labResults } = req.body;
    const result = await callAI(`You are a precision medicine AI. Predict treatment response for ${patientName || 'a patient'}.
Age: ${age || 'Unknown'}, Conditions: ${conditions || 'Unknown'}
Proposed Treatment: ${proposedTreatment || 'Unspecified'}
Relevant Genomics: ${genomicMarkers || 'None'}
Lab Results: ${labResults || 'None'}

Output:
- Predicted response likelihood (percentage estimate with confidence band)
- Pharmacogenomic factors influencing response
- Time-to-response expectation
- Early indicators of efficacy or failure
- Recommended monitoring cadence
Use evidence-based reasoning.`);
    await logAudit(req, 'ai.treatment_response', patientName, { proposedTreatment });
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

// 3) Biomarker-pattern detector
router.post('/biomarker-pattern', auth, async (req, res) => {
  try {
    const { patientName, labResults, conditions } = req.body;
    const result = await callAI(`You are a biomarker analytics AI. Detect biomarker patterns for ${patientName || 'a patient'}.
Lab Results (recent): ${labResults || 'Not provided'}
Conditions: ${conditions || 'None'}

Identify:
- Notable biomarker clusters or trends (e.g., metabolic, inflammatory, hepatic, renal)
- Patterns suggestive of a specific syndrome or disease progression
- Outliers requiring repeat testing
- Suggested confirmatory tests
- Differential considerations
Keep findings clinically actionable.`);
    await logAudit(req, 'ai.biomarker_pattern', patientName);
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

// 4) Clinical-trial matcher
router.post('/clinical-trial-match', auth, async (req, res) => {
  try {
    const { patientName, age, gender, conditions, genomicMarkers, location } = req.body;
    const result = await callAI(`You are a clinical-trial matching AI. Suggest plausible trial categories for ${patientName || 'a patient'}.
Age: ${age || 'Unknown'}, Gender: ${gender || 'Unknown'}
Conditions: ${conditions || 'Unknown'}
Genomic Markers: ${genomicMarkers || 'None'}
Preferred Region: ${location || 'Any'}

Output:
- 3–5 candidate trial categories or NCT-style themes (illustrative, not real listings)
- Likely inclusion criteria the patient may meet
- Likely exclusion criteria to verify
- Specialty referrals to pursue enrollment
- Next steps for the care team
Note: results are illustrative; verify on ClinicalTrials.gov.`);
    await logAudit(req, 'ai.trial_match', patientName);
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

// 5) Adverse-event early warning
router.post('/adverse-event-warning', auth, async (req, res) => {
  try {
    const { patientName, medications, recentSymptoms, vitals, labResults } = req.body;
    const result = await callAI(`You are a pharmacovigilance AI. Provide an adverse-event early-warning assessment for ${patientName || 'a patient'}.
Medications: ${medications || 'None'}
Recent Symptoms: ${recentSymptoms || 'None reported'}
Vitals: ${vitals || 'Unknown'}
Lab Results: ${labResults || 'None'}

Provide:
- Warning level (Green / Yellow / Orange / Red)
- Suspected adverse drug reactions with likely culprit medications
- Red-flag findings that require urgent attention
- Suggested workup and monitoring
- When to consider de-escalation or discontinuation
Be specific and prioritize patient safety.`);
    await logAudit(req, 'ai.adverse_event_warning', patientName);
    res.json({ result, disclaimer: DISCLAIMER });
  } catch (e) { aiError(res, e); }
});

module.exports = router;
