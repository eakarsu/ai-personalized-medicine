import { useState } from 'react';
import { X, Edit, Trash2, FileText } from 'lucide-react';
import { api } from '../../api';

export default function HealthRecordDetail({ record, onClose, onRefresh, onEdit }: { record: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this health record?')) return;
    setDeleting(true);
    try { await api.deleteHealthRecord(record.id); onRefresh(); } catch (e) { console.error(e); setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-cyan-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><FileText className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white text-sm">{record.title}</div><div className="text-teal-100 text-xs">{record.patient_name} — {record.record_type}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><Edit className="w-4 h-4" /></button>
            <button onClick={handleDelete} disabled={deleting} className="p-2 text-white/80 hover:text-red-200 hover:bg-white/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            {record.blood_pressure && <div className="bg-red-50 border border-red-100 rounded-lg p-3"><div className="text-xs text-red-600 mb-1">Blood Pressure</div><div className="text-lg font-bold text-red-700">{record.blood_pressure}</div></div>}
            {record.heart_rate && <div className="bg-pink-50 border border-pink-100 rounded-lg p-3"><div className="text-xs text-pink-600 mb-1">Heart Rate</div><div className="text-lg font-bold text-pink-700">{record.heart_rate} bpm</div></div>}
            {record.temperature && <div className="bg-orange-50 border border-orange-100 rounded-lg p-3"><div className="text-xs text-orange-600 mb-1">Temperature</div><div className="text-lg font-bold text-orange-700">{record.temperature}°C</div></div>}
            {record.weight_kg && <div className="bg-blue-50 border border-blue-100 rounded-lg p-3"><div className="text-xs text-blue-600 mb-1">Weight</div><div className="text-lg font-bold text-blue-700">{record.weight_kg} kg</div></div>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {record.doctor_name && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Doctor</div><div className="text-sm font-medium text-gray-900">{record.doctor_name}</div></div>}
            {record.facility && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Facility</div><div className="text-sm font-medium text-gray-900">{record.facility}</div></div>}
            {record.record_date && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Date</div><div className="text-sm text-gray-900">{new Date(record.record_date).toLocaleDateString()}</div></div>}
            {record.height_cm && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500 mb-1">Height</div><div className="text-sm font-medium text-gray-900">{record.height_cm} cm</div></div>}
          </div>
          {record.description && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-2">Notes / Description</div><p className="text-sm text-gray-700">{record.description}</p></div>}
        </div>
      </div>
    </div>
  );
}
