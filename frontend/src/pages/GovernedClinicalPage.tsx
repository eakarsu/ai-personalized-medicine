import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

type Subject = { id: string; external_subject_ref: string; created_at: string };
type Recommendation = { id: string; subject_id: string; status: string; contraindications: string[]; confidence: number; created_at: string; author_id: string };

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';
const buttonClass = 'rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

export default function GovernedClinicalPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}') as { role?: string };
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ externalSubjectRef: '', mrn: '', birthDate: '', family: '' });
  const [medication, setMedication] = useState({ code: '', display: '', dose: '1', unit: 'mg', route: 'oral', rationale: '' });
  const [fhirJson, setFhirJson] = useState('');

  const load = useCallback(async () => {
    const recs = await api.governedRecommendations();
    setRecommendations(recs);
    if (user.role !== 'patient' && user.role !== 'auditor') {
      const items = await api.governedSubjects();
      setSubjects(items);
      setSelected(current => current || items[0]?.id || '');
    }
  }, [user.role]);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);
  const selectedSubject = useMemo(() => subjects.find(subject => subject.id === selected), [subjects, selected]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(message); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Request failed'); } finally { setBusy(false); }
  }

  const createSubject = () => run(async () => {
    const created = await api.governedSubjectCreate({ externalSubjectRef: subjectForm.externalSubjectRef, identity: { identifiers: [{ system: 'urn:mrn', value: subjectForm.mrn }], birthDate: subjectForm.birthDate, family: subjectForm.family } });
    setSelected(created.id);
  }, 'Clinical subject created with encrypted identity data.');

  const createConsent = () => run(() => api.governedConsentCreate(selected, {
    purpose: 'care_coordination', purposes: ['care', 'care_coordination'], scopes: ['sensitive_clinical', 'care_plan'],
    validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
    sourceUri: 'urn:medinsight:consent-form', sourceVersion: '1',
  }), 'Purpose-bound consent recorded.');

  const importFhir = () => run(() => {
    const bundle = JSON.parse(fhirJson);
    return api.governedFhirImport(selected, { purpose: 'care', retainUntil: new Date(Date.now() + 7 * 365 * 86400000).toISOString(), source: { system: 'https://fhir.source.example/R4/', version: 'R4', retrievedAt: new Date().toISOString() }, bundle });
  }, 'FHIR R4 bundle matched, encrypted, and audited.');

  const createRecommendation = () => run(() => api.governedRecommendationCreate(selected, {
    purpose: 'care', confidence: 0.9,
    proposal: { type: 'medication', medications: [{ ...medication, dose: Number(medication.dose) }], rationale: medication.rationale },
    provenance: { modelVersion: 'clinician-authored-1', sources: [{ uri: 'urn:medinsight:clinician-evidence', version: '1', retrievedAt: new Date().toISOString() }] },
  }), 'Recommendation routed to independent clinical review; it was not auto-released.');

  const review = (id: string, decision: 'approve' | 'reject') => run(() => api.governedRecommendationReview(id, { decision, reason: decision === 'approve' ? 'Reviewed complete current clinical and safety evidence.' : 'Clinical review rejected this recommendation.', attestation: decision === 'approve' }), `Recommendation ${decision === 'approve' ? 'approved' : 'rejected'}.`);

  return (
    <div className="p-8 space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Governed Clinical Workflow</h1><p className="mt-1 text-sm text-slate-600">FHIR identity matching, consent, encrypted records, deterministic safety holds, independent review, and audited handoff.</p></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      {['caseworker', 'clinician', 'privacy_officer'].includes(user.role || '') && <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Clinical subject</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <input className={inputClass} placeholder="FHIR patient ID" value={subjectForm.externalSubjectRef} onChange={e => setSubjectForm({ ...subjectForm, externalSubjectRef: e.target.value })} />
          <input className={inputClass} placeholder="Authoritative MRN" value={subjectForm.mrn} onChange={e => setSubjectForm({ ...subjectForm, mrn: e.target.value })} />
          <input className={inputClass} type="date" value={subjectForm.birthDate} onChange={e => setSubjectForm({ ...subjectForm, birthDate: e.target.value })} />
          <input className={inputClass} placeholder="Family name" value={subjectForm.family} onChange={e => setSubjectForm({ ...subjectForm, family: e.target.value })} />
          <button className={buttonClass} disabled={busy} onClick={createSubject}>Create subject</button>
        </div>
        <div className="mt-3 flex gap-3">
          <select className={inputClass} value={selected} onChange={e => setSelected(e.target.value)}><option value="">Select subject</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.external_subject_ref}</option>)}</select>
          {['caseworker', 'privacy_officer'].includes(user.role || '') && <button className={buttonClass} disabled={busy || !selected} onClick={createConsent}>Record one-year care consent</button>}
        </div>
      </section>}

      {user.role === 'clinician' && <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="font-semibold">FHIR R4 intake</h2><p className="my-2 text-xs text-slate-500">The Bundle must contain exactly one Patient matching the encrypted authoritative identity. Configure server-side FHIR sync for production integrations.</p><textarea className={`${inputClass} h-36 font-mono`} placeholder="Paste a FHIR R4 Bundle" value={fhirJson} onChange={e => setFhirJson(e.target.value)} /><button className={`${buttonClass} mt-3`} disabled={busy || !selected || !fhirJson} onClick={importFhir}>Validate and import</button></div>
        <div className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="font-semibold">Medication recommendation</h2><div className="mt-3 grid grid-cols-2 gap-3"><input className={inputClass} placeholder="Medication code" value={medication.code} onChange={e => setMedication({ ...medication, code: e.target.value })} /><input className={inputClass} placeholder="Display name" value={medication.display} onChange={e => setMedication({ ...medication, display: e.target.value })} /><input className={inputClass} type="number" min="0.01" step="any" value={medication.dose} onChange={e => setMedication({ ...medication, dose: e.target.value })} /><input className={inputClass} placeholder="Dose unit" value={medication.unit} onChange={e => setMedication({ ...medication, unit: e.target.value })} /><input className={inputClass} placeholder="Route" value={medication.route} onChange={e => setMedication({ ...medication, route: e.target.value })} /><input className={inputClass} placeholder="Clinical rationale" value={medication.rationale} onChange={e => setMedication({ ...medication, rationale: e.target.value })} /></div><button className={`${buttonClass} mt-3`} disabled={busy || !selected} onClick={createRecommendation}>Run safety policy and request review</button></div>
      </section>}

      <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="font-semibold">Recommendation queue</h2><div className="mt-3 space-y-3">{recommendations.length === 0 && <p className="text-sm text-slate-500">No recommendations in your permitted scope.</p>}{recommendations.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><div className="font-mono text-xs text-slate-500">{item.id}</div><div className="text-sm font-semibold">{item.status.replace(/_/g, ' ')}</div>{item.contraindications?.length > 0 && <div className="text-xs text-red-700">Safety hold: {item.contraindications.join(', ')}</div>}</div>{user.role === 'clinician' && item.status === 'clinician_review_required' && <div className="flex gap-2"><button className={buttonClass} disabled={busy} onClick={() => review(item.id, 'approve')}>Approve with attestation</button><button className="rounded-lg border px-4 py-2 text-sm" disabled={busy} onClick={() => review(item.id, 'reject')}>Reject</button></div>}</div>)}</div></section>
      {selectedSubject && <p className="text-xs text-slate-500">Selected subject: {selectedSubject.external_subject_ref}</p>}
    </div>
  );
}
