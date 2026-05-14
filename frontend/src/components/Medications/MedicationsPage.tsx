import { useState, useEffect } from 'react';
import { Plus, Search, Pill } from 'lucide-react';
import { api } from '../../api';
import MedicationDetail from './MedicationDetail';
import MedicationForm from './MedicationForm';

export default function MedicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getMedications()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.patient_name?.toLowerCase().includes(search.toLowerCase()) || m.indication?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', discontinued: 'bg-red-100 text-red-800', completed: 'bg-gray-100 text-gray-500', 'on-hold': 'bg-yellow-100 text-yellow-800' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Medications</h2><p className="text-gray-500 text-sm mt-1">{items.length} prescriptions tracked</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Medication</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medications..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Medication','Patient','Dosage','Frequency','Indication','Status','Prescriber'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(m => (
                <tr key={m.id} onClick={() => setSelected(m)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"><Pill className="w-4 h-4 text-purple-600" /></div><div><div className="font-medium text-gray-900 text-sm">{m.name}</div><div className="text-xs text-gray-500">{m.generic_name}</div></div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.patient_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.dosage || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.frequency || '—'}</td>
                  <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">{m.indication || '—'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(m.status)}`}>{m.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.prescriber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <MedicationDetail medication={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <MedicationForm medication={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
