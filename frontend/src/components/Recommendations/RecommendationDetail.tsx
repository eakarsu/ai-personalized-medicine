import { useState } from 'react';
import { X, Edit, Trash2, ClipboardPlus, Sparkles } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

export default function RecommendationDetail({ recommendation, onClose, onRefresh, onEdit }: { recommendation: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this recommendation?')) return;
    setDeleting(true);
    try { await api.deleteRecommendation(recommendation.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult('');
    try { const r = await api.treatmentPlan({ patientName: recommendation.patient_name, conditions: recommendation.description, currentRecommendation: recommendation.title }); setAiResult(r.result); }
    catch (e) { setAiResult('AI analysis failed.'); } finally { setAiLoading(false); }
  };

  const priorityColor = (p: string) => ({ critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' }[p] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><ClipboardPlus className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white text-sm line-clamp-1">{recommendation.title}</div><div className="text-teal-100 text-xs">{recommendation.patient_name}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Priority</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${priorityColor(recommendation.priority)}`}>{recommendation.priority}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Evidence Level</div><div className="text-sm font-bold text-gray-900">Level {recommendation.evidence_level}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Type</div><div className="text-sm font-medium text-gray-900 capitalize">{recommendation.recommendation_type}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><div className={`text-sm font-medium capitalize ${recommendation.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>{recommendation.status}</div></div>
          </div>
          {recommendation.description && <div className="bg-blue-50 border border-blue-100 rounded-lg p-4"><div className="text-xs text-blue-600 font-medium mb-1">Description</div><p className="text-sm text-gray-700">{recommendation.description}</p></div>}
          {recommendation.rationale && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Clinical Rationale</div><p className="text-sm text-gray-700">{recommendation.rationale}</p></div>}
          {recommendation.contraindications && <div className="bg-red-50 border border-red-100 rounded-lg p-4"><div className="text-xs text-red-600 font-medium mb-1">Contraindications</div><p className="text-sm text-gray-700">{recommendation.contraindications}</p></div>}
          {recommendation.notes && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Notes</div><p className="text-sm text-gray-700">{recommendation.notes}</p></div>}
          <div>
            <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Treatment Plan Enhancement'}
            </button>
          </div>
          {(aiLoading || aiResult) && <AIResponse content={aiResult} title="Personalized Treatment Plan" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
