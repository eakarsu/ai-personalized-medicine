'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { configuration, fetchPatientEverything } = require('./fhirClient');

const body = JSON.stringify({ resourceType: 'Bundle', type: 'collection', entry: [{ resource: { resourceType: 'Patient', id: 'p1', identifier: [{ system: 'urn:mrn', value: '123' }], birthDate: '1990-01-01', name: [{ family: 'Smith' }] } }] });

test('FHIR client requires fixed HTTPS endpoint and bearer credentials in production', () => {
  assert.throws(() => configuration({ NODE_ENV: 'production', FHIR_BASE_URL: 'http://fhir.example', FHIR_ACCESS_TOKEN: 'x' }), /HTTPS/);
  assert.throws(() => configuration({ FHIR_BASE_URL: 'https://fhir.example' }), /TOKEN/);
});

test('FHIR client uses Patient everything endpoint and validates media type and payload', async () => {
  let requested;
  const result = await fetchPatientEverything('p1', {
    config: { baseUrl: new URL('https://fhir.example/R4/'), token: 'secret', version: 'R4', timeoutMs: 1000, maxBytes: 10000 },
    fetch: async (url, options) => {
      requested = { url: String(url), options };
      return new Response(body, { status: 200, headers: { 'content-type': 'application/fhir+json' } });
    },
  });
  assert.match(requested.url, /Patient\/p1\/\$everything/);
  assert.equal(requested.options.headers.Authorization, 'Bearer secret');
  assert.equal(result.normalized.resources[0].id, 'p1');
});

test('FHIR client rejects redirects, wrong media type, large and malformed responses', async () => {
  const config = { baseUrl: new URL('https://fhir.example/'), token: 'secret', version: 'R4', timeoutMs: 1000, maxBytes: 20 };
  await assert.rejects(fetchPatientEverything('p1', { config, fetch: async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }) }), /content type/);
  await assert.rejects(fetchPatientEverything('p1', { config, fetch: async () => new Response(body, { status: 200, headers: { 'content-type': 'application/fhir+json' } }) }), /limit/);
  await assert.rejects(fetchPatientEverything('../admin', { config }), /valid FHIR id/);
});
