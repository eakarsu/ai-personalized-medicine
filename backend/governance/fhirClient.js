'use strict';

const clinical = require('./clinicalWorkflow');

function configuration(env = process.env) {
  if (!env.FHIR_BASE_URL) throw new Error('FHIR_BASE_URL is required');
  const baseUrl = new URL(env.FHIR_BASE_URL);
  if (!['https:', 'http:'].includes(baseUrl.protocol) || (env.NODE_ENV === 'production' && baseUrl.protocol !== 'https:')) throw new Error('FHIR_BASE_URL must use HTTPS in production');
  if (baseUrl.username || baseUrl.password) throw new Error('FHIR_BASE_URL must not contain credentials');
  if (!baseUrl.pathname.endsWith('/')) baseUrl.pathname += '/';
  const token = env.FHIR_ACCESS_TOKEN;
  if (!token) throw new Error('FHIR_ACCESS_TOKEN is required');
  return { baseUrl, token, version: env.FHIR_VERSION || 'R4', timeoutMs: Number(env.FHIR_TIMEOUT_MS || 10000), maxBytes: Number(env.FHIR_MAX_RESPONSE_BYTES || 5_000_000) };
}

async function fetchPatientEverything(externalSubjectRef, options = {}) {
  const config = options.config || configuration();
  if (!/^[A-Za-z0-9.-]{1,128}$/.test(externalSubjectRef)) throw new Error('external subject reference is not a valid FHIR id');
  const url = new URL(`Patient/${encodeURIComponent(externalSubjectRef)}/$everything`, config.baseUrl);
  url.searchParams.set('_count', '500');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await (options.fetch || fetch)(url, {
      method: 'GET',
      redirect: 'error',
      signal: controller.signal,
      headers: { Accept: 'application/fhir+json', Authorization: `Bearer ${config.token}` },
    });
    if (!response.ok) throw new Error(`FHIR upstream returned ${response.status}`);
    if (!String(response.headers.get('content-type') || '').toLowerCase().includes('fhir+json')) throw new Error('FHIR upstream returned an unsupported content type');
    const advertised = Number(response.headers.get('content-length') || 0);
    if (advertised > config.maxBytes) throw new Error('FHIR response exceeds configured limit');
    const text = await response.text();
    if (Buffer.byteLength(text) > config.maxBytes) throw new Error('FHIR response exceeds configured limit');
    let bundle;
    try { bundle = JSON.parse(text); } catch { throw new Error('FHIR upstream returned invalid JSON'); }
    const retrievedAt = new Date().toISOString();
    const source = { system: config.baseUrl.origin + config.baseUrl.pathname, version: config.version, retrievedAt };
    return { bundle, source, normalized: clinical.normalizeFhirBundle(bundle, source) };
  } finally { clearTimeout(timer); }
}

module.exports = { configuration, fetchPatientEverything };
