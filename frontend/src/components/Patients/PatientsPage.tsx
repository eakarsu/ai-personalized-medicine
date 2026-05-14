import { useState, useEffect } from 'react';
import { Plus, Search, User } from 'lucide-react';
import { api } from '../../api';
import PatientDetail from './PatientDetail';
import PatientForm from './PatientForm';

export default function PatientsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getPatients()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) || p.conditions?.toLowerCase().includes(search.toLowerCase()) || p.blood_type?.toLowerCase().includes(search.toLowerCase()));

  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-500', 'critical': 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Patients</h2><p className="text-gray-500 text-sm mt-1">{items.length} patients in registry</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Patient</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Patient','DOB / Gender','Blood Type','Conditions','Allergies','Status'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-teal-600" /></div><div><div className="font-medium text-gray-900 text-sm">{p.first_name} {p.last_name}</div><div className="text-xs text-gray-500">{p.email}</div></div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'} / <span className="capitalize">{p.gender}</span></td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-bold">{p.blood_type || '—'}</span></td>
                  <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">{p.conditions || '—'}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{p.allergies || 'None'}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <PatientDetail patient={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <PatientForm patient={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
