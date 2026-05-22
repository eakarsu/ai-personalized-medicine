import { useEffect, useState } from 'react';
import { api } from '../api';

// Pass 7 (2026-05-21): Structured Consent Management UI.
// Synthetic data only — advisory; clinical decisions remain clinician-reviewed.

type Consent = {
  id: number;
  patient_id: number;
  scope: string;
  status: string;
  granted_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  granted_by: string | null;
  notes: string | null;
  updated_at: string;
};

export default function ConsentsPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [patientId, setPatientId] = useState('');
  const [scope, setScope] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [scopesResp, listResp] = await Promise.all([
        api.consentScopes(),
        api.consentsList(),
      ]);
      setScopes(scopesResp.scopes || []);
      setStatuses(scopesResp.statuses || []);
      setConsents(listResp.consents || []);
      if (!scope && scopesResp.scopes?.length) setScope(scopesResp.scopes[0]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.consentCreate({ patient_id: Number(patientId), scope, status, notes });
      setPatientId(''); setNotes('');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function changeStatus(id: number, next: string) {
    try { await api.consentUpdateStatus(id, { status: next }); await load(); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Consent Management</h1>
        <p className="text-sm text-slate-500 mb-4">Structured per-scope patient consents (Pass 7).</p>
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Synthetic data only — for demo use.</strong> Advisory output, requires clinician review. Not medical advice — consult a clinician.
        </div>

        <div className="bg-white shadow rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Record consent</h2>
          <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input type="number" required value={patientId} onChange={e => setPatientId(e.target.value)}
              placeholder="Patient ID" className="border border-slate-300 rounded-lg p-2 text-sm" />
            <select value={scope} onChange={e => setScope(e.target.value)} className="border border-slate-300 rounded-lg p-2 text-sm">
              {scopes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value)} className="border border-slate-300 rounded-lg p-2 text-sm">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
              className="border border-slate-300 rounded-lg p-2 text-sm" />
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded-lg">
              Save consent
            </button>
          </form>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Recorded consents</h2>
          {loading ? <div className="text-sm text-slate-500">Loading...</div> : (
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b">
                <tr><th className="py-2">Patient</th><th>Scope</th><th>Status</th><th>Updated</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {consents.map(c => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2">#{c.patient_id}</td>
                    <td>{c.scope}</td>
                    <td><span className={`inline-block px-2 py-0.5 rounded text-xs ${c.status === 'granted' ? 'bg-emerald-100 text-emerald-800' : c.status === 'revoked' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>{c.status}</span></td>
                    <td className="text-slate-500">{new Date(c.updated_at).toLocaleString()}</td>
                    <td className="text-slate-600">{c.notes || ''}</td>
                    <td className="space-x-1">
                      {c.status !== 'granted' && <button onClick={() => changeStatus(c.id, 'granted')} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Grant</button>}
                      {c.status !== 'revoked' && <button onClick={() => changeStatus(c.id, 'revoked')} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">Revoke</button>}
                    </td>
                  </tr>
                ))}
                {!consents.length && <tr><td colSpan={6} className="py-4 text-center text-slate-400">No consents recorded.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
