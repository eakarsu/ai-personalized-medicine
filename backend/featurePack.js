'use strict';
// Deterministic offline helpers. No provider calls; fallback labelled aiGenerated:false.
// Operational summaries only — not medical advice, no diagnosis.
function filterRecords(rows, { q = '', status = '', risk = '', priority = '' } = {}) {
  const needle = String(q).trim().toLowerCase();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (status && String(row.status ?? row.state ?? '') !== status) return false;
    if (risk && String(row.risk ?? '') !== risk) return false;
    if (priority && String(row.priority ?? '') !== priority) return false;
    if (!needle) return true;
    return Object.values(row ?? {}).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(needle));
  });
}
function toCsv(rows, columns) {
  const list = Array.isArray(rows) ? rows : [];
  const cols = columns && columns.length ? columns : [...new Set(list.flatMap((r) => Object.keys(r || {})))];
  const esc = (v) => { if (v === null || v === undefined) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(','), ...list.map((r) => cols.map((c) => esc(r && r[c])).join(','))].join('\n');
}
const KINDS = { 'record-completeness': 'Record completeness check', 'follow-up-queue': 'Follow-up queue triage', 'review-queue': 'Clinician review queue summary' };
function insightKinds() { return Object.entries(KINDS).map(([id, label]) => ({ id, label })); }
function buildFallbackInsights(records, { kind = 'record-completeness', now = new Date() } = {}) {
  const list = Array.isArray(records) ? records : [];
  const open = list.filter((r) => !['Closed', 'Approved', 'DONE', 'CANCELLED', 'completed'].includes(String(r.status ?? r.state ?? ''))).length;
  const missingOwner = list.filter((r) => !(r.owner ?? r.assignee_id ?? r.created_by ?? r.doctor_name ?? r.prescriber)).length;
  const label = KINDS[kind] || KINDS['record-completeness'];
  return {
    aiGenerated: false, source: 'deterministic-fallback', provider: 'none', kind, label,
    disclaimer: 'Deterministic offline operational summary over your own records. Not medical advice and not a diagnosis; a clinician must review any care decision.',
    summary: `${label} over ${list.length} record(s): ${open} open, ${missingOwner} without a recorded owner/clinician.`,
    metrics: [
      { label: 'Records considered', value: list.length },
      { label: 'Open records', value: open },
      { label: 'Records missing owner', value: missingOwner },
      { label: 'Total amount (not applicable, preserved as 0)', value: 0 },
    ],
    sections: [
      { title: 'Records considered', detail: `${list.length} record(s) were included, including records with zero, false, or empty fields.` },
      { title: 'Completeness', detail: `${missingOwner} record(s) have no owner, clinician, or prescriber recorded. Assign one before follow-up.` },
      { title: 'Follow-up queue', detail: `${open} record(s) remain open. Order by due date and clinician review, not by this summary alone.` },
      { title: 'Next actions', detail: 'Route open items to the responsible clinician queue and retain review evidence. This fallback made no provider call.' },
    ],
  };
}
module.exports = { filterRecords, toCsv, buildFallbackInsights, insightKinds, KINDS };
