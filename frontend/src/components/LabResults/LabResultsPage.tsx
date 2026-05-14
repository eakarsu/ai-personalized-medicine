import { useState, useEffect } from 'react';
import { Plus, Search, FlaskConical } from 'lucide-react';
import { api } from '../../api';
import LabResultDetail from './LabResultDetail';
import LabResultForm from './LabResultForm';

export default function LabResultsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getLabResults()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(r => r.test_name?.toLowerCase().includes(search.toLowerCase()) || r.patient_name?.toLowerCase().includes(search.toLowerCase()) || r.category?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => ({ normal: 'bg-green-100 text-green-800', low: 'bg-blue-100 text-blue-800', high: 'bg-red-100 text-red-800', abnormal: 'bg-orange-100 text-orange-800', critical: 'bg-red-200 text-red-900' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Lab Results</h2><p className="text-gray-500 text-sm mt-1">{items.length} test results</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Result</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lab results..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Test','Patient','Category','Value','Reference','Status','Date'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center"><FlaskConical className="w-4 h-4 text-cyan-600" /></div><div className="font-medium text-gray-900 text-sm">{r.test_name}</div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.patient_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{r.category || '—'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{r.value} {r.unit}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{r.reference_range || '—'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(r.status)}`}>{r.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.test_date ? new Date(r.test_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <LabResultDetail result={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <LabResultForm result={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
