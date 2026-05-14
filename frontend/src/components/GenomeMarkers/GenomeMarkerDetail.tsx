import { useState } from 'react';
import { X, Edit, Trash2, Dna, Sparkles } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

export default function GenomeMarkerDetail({ marker, onClose, onRefresh, onEdit }: { marker: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this genome marker?')) return;
    setDeleting(true);
    try { await api.deleteGenomeMarker(marker.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult('');
    try { const r = await api.genomicInsights({ patientName: marker.patient_name, geneName: marker.gene_name, variant: marker.variant, significance: marker.significance, conditionAssociation: marker.condition_association, confidenceScore: marker.confidence_score }); setAiResult(r.result); }
    catch (e) { setAiResult('AI analysis failed.'); } finally { setAiLoading(false); }
  };

  const sigColor = (s: string) => ({ pathogenic: 'bg-red-100 text-red-800', 'likely pathogenic': 'bg-orange-100 text-orange-800', 'uncertain significance': 'bg-yellow-100 text-yellow-800', benign: 'bg-green-100 text-green-800', 'likely benign': 'bg-teal-100 text-teal-800' }[s?.toLowerCase()] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><Dna className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{marker.gene_name}</div><div className="text-emerald-100 text-sm">{marker.variant}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Patient</div><div className="text-sm font-medium text-gray-900">{marker.patient_name || '—'}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Chromosome</div><div className="text-sm font-medium text-gray-900">Chr {marker.chromosome || '—'}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Clinical Significance</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sigColor(marker.significance)}`}>{marker.significance}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Confidence</div><div className="text-sm font-semibold text-gray-900">{marker.confidence_score}%</div></div>
          </div>
          {marker.position && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Genomic Position</div><div className="text-sm font-mono text-gray-900">{marker.position?.toLocaleString()}</div></div>}
          {marker.condition_association && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="text-xs text-red-600 font-medium mb-1">Associated Condition</div>
              <p className="text-sm text-gray-700">{marker.condition_association}</p>
            </div>
          )}
          {marker.notes && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Clinical Notes</div><p className="text-sm text-gray-700">{marker.notes}</p></div>}
          <div>
            <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
              <Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Genomic Insights'}
            </button>
          </div>
          {(aiLoading || aiResult) && <AIResponse content={aiResult} title="Genomic Insights" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
