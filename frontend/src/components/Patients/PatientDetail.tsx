import { useState } from 'react';
import { X, Edit, Trash2, User, Sparkles } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

export default function PatientDetail({ patient, onClose, onRefresh, onEdit }: { patient: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this patient?')) return;
    setDeleting(true);
    try { await api.deletePatient(patient.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult('');
    const age = patient.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31536000000) : null;
    try { const r = await api.patientRisk({ patientName: `${patient.first_name} ${patient.last_name}`, age, conditions: patient.conditions, bloodType: patient.blood_type, allergies: patient.allergies }); setAiResult(r.result); }
    catch (e) { setAiResult('AI analysis failed.'); } finally { setAiLoading(false); }
  };

  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-500', critical: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');
  const age = patient.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31536000000) : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{patient.first_name} {patient.last_name}</div><div className="text-teal-100 text-sm">{age ? `${age} years old` : ''} {patient.gender}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Blood Type</div><div className="text-lg font-bold text-red-600">{patient.blood_type || '—'}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(patient.status)}`}>{patient.status}</span></div>
            {patient.email && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Email</div><div className="text-sm text-gray-900 truncate">{patient.email}</div></div>}
            {patient.phone && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Phone</div><div className="text-sm text-gray-900">{patient.phone}</div></div>}
          </div>
          {patient.conditions && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="text-xs text-red-600 font-medium mb-1">Medical Conditions</div>
              <p className="text-sm text-gray-700">{patient.conditions}</p>
            </div>
          )}
          {patient.allergies && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <div className="text-xs text-orange-600 font-medium mb-1">Allergies</div>
              <p className="text-sm text-gray-700">{patient.allergies}</p>
            </div>
          )}
          {patient.date_of_birth && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Date of Birth</div><div className="text-sm text-gray-900">{new Date(patient.date_of_birth).toLocaleDateString()} (Age {age})</div></div>}
          <div>
            <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Risk Assessment'}
            </button>
          </div>
          {(aiLoading || aiResult) && <AIResponse content={aiResult} title="Patient Risk Assessment" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
