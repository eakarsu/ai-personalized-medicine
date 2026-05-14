import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

export default function GenomeMarkerForm({ marker, onClose, onSave }: { marker: any; onClose: () => void; onSave: () => void; }) {
  const [form, setForm] = useState({ patient_id: marker?.patient_id || '', gene_name: marker?.gene_name || '', variant: marker?.variant || '', chromosome: marker?.chromosome || '', position: marker?.position || '', significance: marker?.significance || 'uncertain significance', condition_association: marker?.condition_association || '', confidence_score: marker?.confidence_score || 75, notes: marker?.notes || '' });
  const [patients, setPatients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  useEffect(() => { api.getPatients().then(setPatients).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, patient_id: form.patient_id || null, position: form.position || null };
      if (marker) await api.updateGenomeMarker(marker.id, payload); else await api.createGenomeMarker(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{marker ? 'Edit Genome Marker' : 'New Genome Marker'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select value={form.patient_id} onChange={e => set('patient_id', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
              <option value="">Select patient</option>{patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Gene Name *</label><input required value={form.gene_name} onChange={e => set('gene_name', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Variant</label><input value={form.variant} onChange={e => set('variant', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Chromosome</label><input value={form.chromosome} onChange={e => set('chromosome', e.target.value)} placeholder="e.g. 7" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Position</label><input type="number" value={form.position} onChange={e => set('position', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Clinical Significance</label>
            <select value={form.significance} onChange={e => set('significance', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
              <option value="pathogenic">Pathogenic</option><option value="likely pathogenic">Likely Pathogenic</option><option value="uncertain significance">Uncertain Significance</option><option value="likely benign">Likely Benign</option><option value="benign">Benign</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Condition Association</label><textarea value={form.condition_association} onChange={e => set('condition_association', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confidence Score (%)</label><input type="number" min="0" max="100" step="0.5" value={form.confidence_score} onChange={e => set('confidence_score', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">{saving ? 'Saving...' : marker ? 'Save Changes' : 'Create Marker'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
