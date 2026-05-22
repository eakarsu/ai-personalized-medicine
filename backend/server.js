require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/health-records', require('./routes/health_records'));
app.use('/api/genome-markers', require('./routes/genome_markers'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/lab-results', require('./routes/lab_results'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/utility', require('./routes/utility'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`MedInsight backend running on port ${PORT}`));
app.use('/api/gap-ai-lab-trend-detector', require('./routes/gap-ai-lab-trend-detector'));
app.use('/api/gap-ai-dose-personalizer', require('./routes/gap-ai-dose-personalizer'));
app.use('/api/gap-ai-wearable-stream-analyzer', require('./routes/gap-ai-wearable-stream-analyzer'));
app.use('/api/gap-ai-genome-therapy-designer', require('./routes/gap-ai-genome-therapy-designer'));
app.use('/api/gap-ai-ehr-summarize', require('./routes/gap-ai-ehr-summarize'));
app.use('/api/gap-nonai-wearables-integration', require('./routes/gap-nonai-wearables-integration'));
app.use('/api/gap-nonai-fhir-connector', require('./routes/gap-nonai-fhir-connector'));
app.use('/api/gap-nonai-hipaa-audit', require('./routes/gap-nonai-hipaa-audit'));
app.use('/api/gap-nonai-consent-management', require('./routes/gap-nonai-consent-management'));
app.use('/api/gap-nonai-clinician-roles', require('./routes/gap-nonai-clinician-roles'));
app.use('/api/cf-mrna-n-of-1', require('./routes/cf-mrna-n-of-1'));
app.use('/api/cf-wearable-fusion', require('./routes/cf-wearable-fusion'));
app.use('/api/cf-trial-autofill', require('./routes/cf-trial-autofill'));
app.use('/api/cf-pharmacogenomics', require('./routes/cf-pharmacogenomics'));
app.use('/api/cf-longitudinal-twin', require('./routes/cf-longitudinal-twin'));

// Deep audit features (2026-05-14)
app.use('/api/pgx-cpic', require('./routes/pgx-cpic'));
app.use('/api/variant-acmg', require('./routes/variant-acmg'));
app.use('/api/prs', require('./routes/prs'));
app.use('/api/trial-matcher', require('./routes/trial-matcher'));
app.use('/api/warfarin-iwpc', require('./routes/warfarin-iwpc'));

// Custom Views (2026-05-18)
app.use('/api/custom-views', require('./routes/customViews'));

// Pass 7 (2026-05-21): structured consent + HIPAA field-level access tracking
app.use('/api/consents', require('./routes/consents'));
app.use('/api/field-access-log', require('./routes/field-access-log'));
app.use('/api/adverse-event-signals', require('./routes/adverse-event-signals'));

// JSON 404 for unknown API routes (mounted AFTER all routes)
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    disclaimer: 'Not medical advice — consult a clinician.',
  });
});
