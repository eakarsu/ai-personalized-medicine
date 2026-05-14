import { useState } from 'react';
import { X, Edit, Trash2, Pill, Sparkles } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

export default function MedicationDetail({ medication, onClose, onRefresh, onEdit }: { medication: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this medication?')) return;
    setDeleting(true);
    try { await api.deleteMedication(medication.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult('');
    try { const r = await api.medicationAnalysis({ patientName: medication.patient_name, medications: medication.name, indication: medication.indication }); setAiResult(r.result); }
    catch (e) { setAiResult('AI analysis failed.'); } finally { setAiLoading(false); }
  };

  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', discontinued: 'bg-red-100 text-red-800', completed: 'bg-gray-100 text-gray-500', 'on-hold': 'bg-yellow-100 text-yellow-800' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-violet-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Pill className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{medication.name}</div><div className="text-purple-100 text-sm">{medication.generic_name}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Patient</div><div className="text-sm font-medium text-gray-900">{medication.patient_name || '—'}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(medication.status)}`}>{medication.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Dosage</div><div className="text-sm font-semibold text-gray-900">{medication.dosage || '—'}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Frequency</div><div className="text-sm text-gray-900">{medication.frequency || '—'}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Route</div><div className="text-sm text-gray-900 capitalize">{medication.route || '—'}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Prescriber</div><div className="text-sm text-gray-900">{medication.prescriber || '—'}</div></div>
          </div>
          {medication.indication && <div className="bg-blue-50 border border-blue-100 rounded-lg p-4"><div className="text-xs text-blue-600 font-medium mb-1">Indication</div><p className="text-sm text-gray-700">{medication.indication}</p></div>}
          {medication.side_effects && <div className="bg-orange-50 border border-orange-100 rounded-lg p-4"><div className="text-xs text-orange-600 font-medium mb-1">Side Effects</div><p className="text-sm text-gray-700">{medication.side_effects}</p></div>}
          {(medication.start_date || medication.end_date) && (
            <div className="grid grid-cols-2 gap-4">
              {medication.start_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Start Date</div><div className="text-sm text-gray-900">{new Date(medication.start_date).toLocaleDateString()}</div></div>}
              {medication.end_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">End Date</div><div className="text-sm text-gray-900">{new Date(medication.end_date).toLocaleDateString()}</div></div>}
            </div>
          )}
          <div>
            <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Pharmacogenomics Analysis'}
            </button>
          </div>
          {(aiLoading || aiResult) && <AIResponse content={aiResult} title="Medication Analysis" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
