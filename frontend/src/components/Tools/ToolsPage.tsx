import { useState, useEffect } from 'react';
import { Download, Search, ScrollText, Filter } from 'lucide-react';
import { api } from '../../api';

const RESOURCE_LABELS: Record<string, string> = {
  patients: 'Patients',
  health_records: 'Health Records',
  genome_markers: 'Genome Markers',
  medications: 'Medications',
  lab_results: 'Lab Results',
  recommendations: 'Treatment Recommendations',
};

type Tab = 'export' | 'search' | 'audit';

export default function ToolsPage() {
  const [tab, setTab] = useState<Tab>('export');
  const [resources, setResources] = useState<Record<string, any>>({});
  const [resource, setResource] = useState<string>('patients');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');
  const [audit, setAudit] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState('');
  const [auditNote, setAuditNote] = useState('');

  useEffect(() => { api.utilityResources().then(setResources).catch(() => {}); }, []);

  useEffect(() => { setFilters({}); setRows([]); setSearchErr(''); }, [resource]);

  const meta = resources[resource] || { searchable: [], filterable: [], columns: [] };

  const runSearch = async () => {
    setSearching(true); setSearchErr('');
    try {
      const r = await api.utilitySearch(resource, q, filters);
      setRows(r.rows || []);
    } catch (e: any) { setSearchErr(e?.message || 'Search failed'); setRows([]); }
    finally { setSearching(false); }
  };

  const downloadCsv = async () => {
    const url = api.utilityExportCsvUrl(resource);
    const token = localStorage.getItem('token') || '';
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${resource}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      await api.utilityCreateAudit({ action: 'frontend.download_csv', target: resource });
    } catch (e: any) { alert(`Download failed: ${e?.message}`); }
  };

  const loadAudit = async () => {
    setAuditNote('');
    try {
      const r = await api.utilityAuditLog(auditFilter ? { action: auditFilter } : {});
      setAudit(r.rows || []);
      if (r.note) setAuditNote(r.note);
    } catch (e: any) { setAudit([]); setAuditNote(e?.message || 'Failed to load audit log'); }
  };

  useEffect(() => { if (tab === 'audit') loadAudit(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tools</h2>
        <p className="text-gray-500 text-sm mt-1">CSV export, advanced search and filtering, audit log</p>
      </div>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <strong>Disclaimer:</strong> Not medical advice — consult a clinician. Exported data is for authorized clinical workflows only.
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {([
          { k: 'export', label: 'CSV Export', icon: Download },
          { k: 'search', label: 'Search & Filter', icon: Search },
          { k: 'audit', label: 'Audit Log', icon: ScrollText },
        ] as { k: Tab; label: string; icon: any }[]).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.k ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'export' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Export resource as CSV</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Resource</label>
              <select value={resource} onChange={e => setResource(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {Object.keys(RESOURCE_LABELS).map(k => <option key={k} value={k}>{RESOURCE_LABELS[k]}</option>)}
              </select>
            </div>
            <button onClick={downloadCsv} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
              <Download className="w-4 h-4" /> Download {RESOURCE_LABELS[resource]} CSV
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">Columns exported: {(meta.columns || []).join(', ') || '—'}</p>
        </div>
      )}

      {tab === 'search' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Resource</label>
              <select value={resource} onChange={e => setResource(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {Object.keys(RESOURCE_LABELS).map(k => <option key={k} value={k}>{RESOURCE_LABELS[k]}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search query</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch()} placeholder={`Search across: ${(meta.searchable || []).join(', ')}`} className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          {(meta.filterable || []).length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2"><Filter className="w-3 h-3" /> Filters</div>
              <div className="flex flex-wrap gap-2">
                {(meta.filterable || []).map((col: string) => (
                  <input key={col} value={filters[col] || ''} onChange={e => setFilters(f => ({ ...f, [col]: e.target.value }))} placeholder={col} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs" />
                ))}
              </div>
            </div>
          )}

          <button onClick={runSearch} disabled={searching} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm">{searching ? 'Searching...' : 'Run Search'}</button>

          {searchErr && <div className="mt-3 text-sm text-red-600">{searchErr}</div>}

          {rows.length > 0 && (
            <div className="mt-4 overflow-auto border border-gray-100 rounded-lg max-h-[480px]">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>{(meta.columns || Object.keys(rows[0])).map((c: string) => <th key={c} className="text-left px-3 py-2 font-semibold text-gray-600 uppercase">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {(meta.columns || Object.keys(r)).map((c: string) => <td key={c} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-xs truncate">{r[c] === null || r[c] === undefined ? '' : String(r[c])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length === 0 && !searching && !searchErr && <div className="mt-3 text-sm text-gray-400">No results yet — run a search.</div>}
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by action</label>
              <input value={auditFilter} onChange={e => setAuditFilter(e.target.value)} placeholder="e.g. ai.drug_interaction" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button onClick={loadAudit} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm">Refresh</button>
          </div>
          {auditNote && <div className="mb-3 text-xs text-amber-700">{auditNote}</div>}
          <div className="overflow-auto border border-gray-100 rounded-lg max-h-[520px]">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>{['When','User','Action','Target','Meta'].map(h => <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audit.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.user_email || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 font-medium whitespace-nowrap">{r.action}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.target || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-md truncate">{r.meta ? JSON.stringify(r.meta) : ''}</td>
                  </tr>
                ))}
                {audit.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">No audit entries.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
