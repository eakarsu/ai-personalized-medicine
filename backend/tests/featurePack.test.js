'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { filterRecords, toCsv, buildFallbackInsights, insightKinds } = require('../featurePack');
const rows = [
  { first_name: 'Ada', status: 'active', amount: 0, notes: '' },
  { first_name: 'Ben', status: 'inactive', amount: 250, notes: 'review' },
  { first_name: '', status: 'active', amount: 0, notes: null },
];
test('search/filter preserves 0/empty', () => {
  assert.equal(filterRecords(rows, {}).length, 3);
  assert.equal(filterRecords(rows, { q: 'ada' }).length, 1);
  assert.equal(filterRecords(rows, { status: 'active' }).length, 2);
});
test('csv preserves 0', () => { assert.ok(toCsv(rows, ['first_name','amount']).includes('Ada,0')); });
test('fallback labelled aiGenerated:false, no diagnosis', () => {
  const r = buildFallbackInsights(rows, { kind: 'record-completeness' });
  assert.equal(r.aiGenerated, false); assert.ok(r.sections.length >= 3);
  assert.match(r.disclaimer, /Not medical advice/); assert.ok(insightKinds().length >= 3);
});
