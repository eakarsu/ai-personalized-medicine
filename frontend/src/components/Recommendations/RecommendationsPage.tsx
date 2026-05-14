import { useState, useEffect } from 'react';
import { Plus, Search, ClipboardPlus } from 'lucide-react';
import { api } from '../../api';
import RecommendationDetail from './RecommendationDetail';
import RecommendationForm from './RecommendationForm';

export default function RecommendationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getRecommendations()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(r => r.title?.toLowerCase().includes(search.toLowerCase()) || r.patient_name?.toLowerCase().includes(search.toLowerCase()) || r.recommendation_type?.toLowerCase().includes(search.toLowerCase()));

  const priorityColor = (p: string) => ({ critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' }[p] || 'bg-gray-100');
  const typeColor = (t: string) => ({ medication: 'bg-purple-100 text-purple-800', lifestyle: 'bg-green-100 text-green-800', monitoring: 'bg-blue-100 text-blue-800', referral: 'bg-indigo-100 text-indigo-800', vaccination: 'bg-teal-100 text-teal-800', technology: 'bg-cyan-100 text-cyan-800', surgery: 'bg-red-100 text-red-800' }[t] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Treatment Recommendations</h2><p className="text-gray-500 text-sm mt-1">{items.length} personalized recommendations</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Recommendation</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recommendations..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Recommendation','Patient','Type','Priority','Evidence','Status'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center"><ClipboardPlus className="w-4 h-4 text-teal-600" /></div><div className="font-medium text-gray-900 text-sm max-w-xs truncate">{r.title}</div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.patient_name || '—'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${typeColor(r.recommendation_type)}`}>{r.recommendation_type}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${priorityColor(r.priority)}`}>{r.priority}</span></td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold">Level {r.evidence_level}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${r.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <RecommendationDetail recommendation={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <RecommendationForm recommendation={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
