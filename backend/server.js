'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const pool = require('./db');

function allowedOrigins() {
  return String(process.env.CORS_ORIGIN || '').split(',').map((value) => value.trim()).filter(Boolean);
}

function createApp() {
  const app = express();
  const origins = allowedOrigins();
  if (process.env.NODE_ENV === 'production' && !origins.length) throw new Error('CORS_ORIGIN is required in production');
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    req.correlationId = /^[A-Za-z0-9_-]{8,80}$/.test(req.get('x-correlation-id') || '') ? req.get('x-correlation-id') : crypto.randomUUID();
    res.set('x-correlation-id', req.correlationId);
    res.set('x-content-type-options', 'nosniff');
    res.set('x-frame-options', 'DENY');
    res.set('referrer-policy', 'no-referrer');
    res.set('cache-control', 'no-store');
    next();
  });
  app.use(cors({ credentials: false, origin(origin, callback) { if (!origin || origins.includes(origin) || (process.env.NODE_ENV !== 'production' && !origins.length)) return callback(null, true); callback(new Error('origin is not allowed')); } }));
  app.use(express.json({ limit: '512kb', strict: true }));

  app.get('/health/live', (_req, res) => res.json({ status: 'live' }));
  app.get('/health/ready', async (_req, res) => {
    try {
      const result = await pool.query("SELECT to_regclass('public.clinical_audit_events') AS migration");
      if (!result.rows[0].migration) return res.status(503).json({ status: 'not_ready', reason: 'migration missing' });
      res.json({ status: 'ready' });
    } catch { res.status(503).json({ status: 'not_ready' }); }
  });
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/governed-clinical', require('./routes/governedClinical'));
  app.use('/api/application-ai', require('./routes/applicationAi'));

  if (process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production') {
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
    for (const route of ['gap-ai-lab-trend-detector','gap-ai-dose-personalizer','gap-ai-wearable-stream-analyzer','gap-ai-genome-therapy-designer','gap-ai-ehr-summarize','gap-nonai-wearables-integration','gap-nonai-fhir-connector','gap-nonai-hipaa-audit','gap-nonai-consent-management','gap-nonai-clinician-roles','cf-mrna-n-of-1','cf-wearable-fusion','cf-trial-autofill','cf-pharmacogenomics','cf-longitudinal-twin','pgx-cpic','variant-acmg','prs','trial-matcher','warfarin-iwpc','customViews','consents','field-access-log','adverse-event-signals']) {
      app.use(`/api/${route === 'customViews' ? 'custom-views' : route}`, require(`./routes/${route}`));
    }
  }

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', correlationId: req.correlationId }));
  app.use((error, req, res, _next) => {
    const status = error.status || (/required|must|valid|unsupported|denied|not configured/.test(error.message) ? 400 : 500);
    if (status >= 500) console.error(req.correlationId, error);
    res.status(status).json({ error: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message, correlationId: req.correlationId });
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3004);
  const host = process.env.HOST || '127.0.0.1';
  createApp().listen(port, host, () => console.log(`MedInsight governed backend listening at http://${host}:${port}`));
}

module.exports = { createApp };
