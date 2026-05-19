import { useEffect, useState } from 'react';
import { ClipboardPlus, Pencil, Trash2, Plus, X, Save } from 'lucide-react';

type Protocol = {
  id: number;
  name: string;
  condition: string;
  genomic_criteria: string;
  drug: string;
  dose_mg: number | null;
  frequency: string;
  monitoring: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  title: string;
  total: number;
  items: Protocol[];
  disclaimer: string;
};

const empty = (): Partial<Protocol> => ({
  name: '',
  condition: '',
  genomic_criteria: '',
  drug: '',
  dose_mg: 0,
  frequency: 'daily',
  monitoring: '',
  status: 'draft',
});

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  };
}

export default function TreatmentProtocolEditor() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Partial<Protocol> | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/custom-views/protocols', { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setBusy(true); setErr('');
    try {
      const url = editing.id
        ? `/api/custom-views/protocols/${editing.id}`
        : '/api/custom-views/protocols';
      const method = editing.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...editing,
          dose_mg: editing.dose_mg === null || editing.dose_mg === undefined || (editing.dose_mg as any) === ''
            ? null
            : Number(editing.dose_mg),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      setEditing(null); setCreating(false);
      await load();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  async function remove(id: number) {
    if (!confirm(`Delete protocol #${id}?`)) return;
    setBusy(true); setErr('');
    try {
      const res = await fetch(`/api/custom-views/protocols/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  function startCreate() {
    setCreating(true);
    setEditing(empty());
  }
  function startEdit(p: Protocol) {
    setCreating(false);
    setEditing({ ...p });
  }
  function cancel() {
    setEditing(null); setCreating(false);
  }

  if (err && !data) return <div className="p-4 text-red-600 text-sm">Protocol editor error: {err}</div>;
  if (!data) return <div className="p-4 text-slate-500 text-sm">Loading protocols...</div>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="protocol-editor">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardPlus className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-slate-900">Treatment Protocol Editor</h2>
        </div>
        <button onClick={startCreate}
                className="text-xs bg-teal-600 text-white rounded px-2 py-1 inline-flex items-center gap-1 hover:bg-teal-700">
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3">{data.total} protocol{data.total === 1 ? '' : 's'}</p>

      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}

      {editing && (
        <div className="border border-teal-300 bg-teal-50 rounded p-3 mb-3" data-testid="protocol-form">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-900">
              {creating ? 'New protocol' : `Editing protocol #${editing.id}`}
            </div>
            <button onClick={cancel} className="text-slate-500 hover:text-slate-800"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="col-span-2">Name
              <input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })}
                     className="mt-1 w-full border border-slate-300 rounded px-2 py-1" />
            </label>
            <label>Condition
              <input value={editing.condition || ''} onChange={e => setEditing({ ...editing, condition: e.target.value })}
                     className="mt-1 w-full border border-slate-300 rounded px-2 py-1" />
            </label>
            <label>Genomic criteria
              <input value={editing.genomic_criteria || ''} onChange={e => setEditing({ ...editing, genomic_criteria: e.target.value })}
                     className="mt-1 w-full border border-slate-300 rounded px-2 py-1" />
            </label>
            <label>Drug
              <input value={editing.drug || ''} onChange={e => setEditing({ ...editing, drug: e.target.value })}
                     className="mt-1 w-full border border-slate-300 rounded px-2 py-1" />
            </label>
            <label>Dose (mg)
              <input type="number" value={editing.dose_mg ?? ''} onChange={e => setEditing({ ...editing, dose_mg: e.target.value === '' ? null : Number(e.target.value) })}
                     className="mt-1 w-full border border-slate-300 rounded px-2 py-1" />
            </label>
            <label>Frequency
              <input value={editing.frequency || ''} onChange={e => setEditing({ ...editing, frequency: e.target.value })}
                     className="mt-1 w-full border border-slate-300 rounded px-2 py-1" />
            </label>
            <label>Status
              <select value={editing.status || 'draft'} onChange={e => setEditing({ ...editing, status: e.target.value })}
                      className="mt-1 w-full border border-slate-300 rounded px-2 py-1 bg-white">
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="col-span-2">Monitoring
              <textarea value={editing.monitoring || ''} onChange={e => setEditing({ ...editing, monitoring: e.target.value })}
                        rows={2}
                        className="mt-1 w-full border border-slate-300 rounded px-2 py-1" />
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={cancel} disabled={busy}
                    className="text-xs px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800">Cancel</button>
            <button onClick={save} disabled={busy}
                    className="text-xs px-3 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white inline-flex items-center gap-1 disabled:opacity-50">
              <Save className="w-3 h-3" /> {busy ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {data.items.map(p => (
          <div key={p.id} className="border border-slate-200 rounded p-3 hover:border-slate-300">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-900 truncate">{p.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{p.condition}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  p.status === 'active' ? 'bg-teal-100 text-teal-800' :
                  p.status === 'draft'  ? 'bg-amber-100 text-amber-800' :
                                          'bg-slate-100 text-slate-700'
                }`}>{p.status}</span>
                <button onClick={() => startEdit(p)} title="Edit"
                        className="p-1 text-slate-500 hover:text-teal-700"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(p.id)} title="Delete"
                        className="p-1 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-600">
              <div><b>Drug:</b> {p.drug}{p.dose_mg ? ` (${p.dose_mg} mg ${p.frequency})` : ''}</div>
              <div><b>Genomic:</b> {p.genomic_criteria || '-'}</div>
              {p.monitoring && <div><b>Monitoring:</b> {p.monitoring}</div>}
            </div>
          </div>
        ))}
        {data.items.length === 0 && (
          <div className="text-xs text-slate-500 text-center py-6">No protocols yet — click "New" to add one.</div>
        )}
      </div>

      <p className="text-[11px] text-amber-700 mt-3">{data.disclaimer}</p>
    </div>
  );
}
