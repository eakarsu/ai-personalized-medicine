import { useState, useEffect } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { api } from '../../api';
import HealthRecordDetail from './HealthRecordDetail';
import HealthRecordForm from './HealthRecordForm';

export default function HealthRecordsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getHealthRecords()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(r => r.title?.toLowerCase().includes(search.toLowerCase()) || r.patient_name?.toLowerCase().includes(search.toLowerCase()) || r.record_type?.toLowerCase().includes(search.toLowerCase()));

  const typeColor = (t: string) => ({ physical: 'bg-blue-100 text-blue-800', cardiology: 'bg-red-100 text-red-800', neurology: 'bg-purple-100 text-purple-800', 'follow-up': 'bg-gray-100 text-gray-600', psychiatry: 'bg-indigo-100 text-indigo-800', rheumatology: 'bg-orange-100 text-orange-800', endocrinology: 'bg-yellow-100 text-yellow-800', nephrology: 'bg-cyan-100 text-cyan-800', gastroenterology: 'bg-green-100 text-green-800', pulmonology: 'bg-sky-100 text-sky-800' }[t] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Health Records</h2><p className="text-gray-500 text-sm mt-1">{items.length} records</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Record</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Record','Patient','Type','Doctor','Date','BP / HR'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center"><FileText className="w-4 h-4 text-teal-600" /></div><div className="font-medium text-gray-900 text-sm">{r.title}</div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.patient_name || '—'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${typeColor(r.record_type)}`}>{r.record_type}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.doctor_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.record_date ? new Date(r.record_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.blood_pressure || '—'} / {r.heart_rate ? `${r.heart_rate} bpm` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <HealthRecordDetail record={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <HealthRecordForm record={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
