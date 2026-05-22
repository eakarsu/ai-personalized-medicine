import { useEffect, useState } from 'react';
import { api } from '../api';

// Pass 7 (2026-05-21): HIPAA field-level access log viewer.
// Synthetic data only — advisory; clinical decisions remain clinician-reviewed.

type Entry = {
  id: number;
  user_email: string | null;
  patient_id: number | null;
  resource: string;
  field: string;
  action: string;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
};

export default function FieldAccessLogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      const cleaned: Record<string, string> = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) cleaned[k] = v; });
      const r = await api.fieldAccessList(cleaned);
      setEntries(r.entries || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function record(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const f = filters;
      await api.fieldAccessLog({
        patient_id: f.patient_id ? Number(f.patient_id) : undefined,
        resource: f.resource || 'patients',
        field: f.field || 'all',
        action: f.action || 'view',
        reason: f.reason || 'manual log',
      });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  function set(k: string, v: string) { setFilters(prev => ({ ...prev, [k]: v })); }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">HIPAA Field-Level Access Log</h1>
        <p className="text-sm text-slate-500 mb-4">Per-field access audit trail (Pass 7).</p>
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Synthetic data only — for demo use.</strong> Advisory output, requires clinician review. Not medical advice — consult a clinician.
        </div>

        <div className="bg-white shadow rounded-xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Filter / record</h2>
          <form onSubmit={record} className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <input value={filters.patient_id || ''} onChange={e => set('patient_id', e.target.value)} placeholder="Patient ID" className="border border-slate-300 rounded-lg p-2 text-sm" />
            <input value={filters.resource || ''} onChange={e => set('resource', e.target.value)} placeholder="Resource (e.g. patients)" className="border border-slate-300 rounded-lg p-2 text-sm" />
            <input value={filters.field || ''} onChange={e => set('field', e.target.value)} placeholder="Field (e.g. ssn)" className="border border-slate-300 rounded-lg p-2 text-sm" />
            <input value={filters.action || ''} onChange={e => set('action', e.target.value)} placeholder="Action (view/edit)" className="border border-slate-300 rounded-lg p-2 text-sm" />
            <input value={filters.user_email || ''} onChange={e => set('user_email', e.target.value)} placeholder="User email" className="border border-slate-300 rounded-lg p-2 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={load} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-lg text-sm">Apply</button>
              <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-sm">Log access</button>
            </div>
          </form>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Access entries</h2>
          {loading ? <div className="text-sm text-slate-500">Loading...</div> : (
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b">
                <tr><th className="py-2">When</th><th>User</th><th>Patient</th><th>Resource.Field</th><th>Action</th><th>IP</th></tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 text-slate-500">{new Date(e.created_at).toLocaleString()}</td>
                    <td>{e.user_email || '-'}</td>
                    <td>{e.patient_id ? `#${e.patient_id}` : '-'}</td>
                    <td><code className="text-xs">{e.resource}.{e.field}</code></td>
                    <td>{e.action}</td>
                    <td className="text-slate-500">{e.ip_address || '-'}</td>
                  </tr>
                ))}
                {!entries.length && <tr><td colSpan={6} className="py-4 text-center text-slate-400">No access entries.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
