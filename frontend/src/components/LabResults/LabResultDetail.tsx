import { useState } from 'react';
import { X, Edit, Trash2, FlaskConical } from 'lucide-react';
import { api } from '../../api';

export default function LabResultDetail({ result, onClose, onRefresh, onEdit }: { result: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm('Delete this lab result?')) return;
    setDeleting(true);
    try { await api.deleteLabResult(result.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };
  const statusColor = (s: string) => ({ normal: 'bg-green-100 text-green-800', low: 'bg-blue-100 text-blue-800', high: 'bg-red-100 text-red-800', abnormal: 'bg-orange-100 text-orange-800', critical: 'bg-red-200 text-red-900' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-600 to-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><FlaskConical className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white">{result.test_name}</div><div className="text-cyan-100 text-sm">{result.patient_name} — {result.category}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 text-center">
            <div className="text-xs text-cyan-700 font-medium mb-1">Result</div>
            <div className="text-4xl font-bold text-cyan-800">{result.value} <span className="text-xl text-cyan-600">{result.unit}</span></div>
            {result.reference_range && <div className="text-sm text-cyan-600 mt-2">Reference: {result.reference_range}</div>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(result.status)}`}>{result.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Category</div><div className="text-sm font-medium text-gray-900 capitalize">{result.category}</div></div>
            {result.test_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Test Date</div><div className="text-sm text-gray-900">{new Date(result.test_date).toLocaleDateString()}</div></div>}
            {result.lab_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Laboratory</div><div className="text-sm text-gray-900">{result.lab_name}</div></div>}
          </div>
          {result.notes && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Notes</div><p className="text-sm text-gray-700">{result.notes}</p></div>}
        </div>
      </div>
    </div>
  );
}
