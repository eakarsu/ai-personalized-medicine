import { useEffect, useState } from 'react';
import { Database, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../api';

type Entity = { key: string; label: string };

type Toast = { kind: 'ok' | 'err'; text: string };

export default function SampleDataPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    api.sampleDataEntities()
      .then((r) => setEntities(r.entities || []))
      .catch(() => setEntities([
        { key: 'patients', label: 'Patients' },
        { key: 'health_records', label: 'Health Records' },
        { key: 'genome_markers', label: 'Genome Markers' },
        { key: 'medications', label: 'Medications' },
        { key: 'lab_results', label: 'Lab Results' },
        { key: 'treatment_recommendations', label: 'Treatment Recommendations' },
      ]));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const insert = async (entity: Entity) => {
    setLoading(entity.key);
    try {
      const r = await api.insertSampleData(entity.key);
      setCounts((c) => ({ ...c, [entity.key]: (c[entity.key] || 0) + r.inserted }));
      setToast({ kind: 'ok', text: `Inserted ${r.inserted} synthetic ${entity.label} rows.` });
    } catch (e: any) {
      setToast({ kind: 'err', text: e?.message || 'Insert failed' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-teal-600" /> Sample Data
        </h2>
        <p className="text-gray-500 text-sm mt-1">Seed the demo database with realistic, synthetic medical records.</p>
      </div>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div><strong>Synthetic data only — for demo use.</strong> All names, identifiers, contact details and clinical values are fabricated. No real patient PII is inserted.</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entities.map((e) => {
          const isLoading = loading === e.key;
          const inserted = counts[e.key] || 0;
          return (
            <div key={e.key} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <div className="font-semibold text-gray-900 truncate">{e.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">Inserts 5-10 synthetic rows</div>
                {inserted > 0 && (
                  <div className="text-xs text-teal-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {inserted} inserted this session
                  </div>
                )}
              </div>
              <button
                onClick={() => insert(e)}
                disabled={!!loading}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {isLoading ? 'Inserting...' : 'Insert sample'}
              </button>
            </div>
          );
        })}
        {entities.length === 0 && <div className="text-sm text-gray-400">Loading entities...</div>}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.kind === 'ok' ? 'bg-teal-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
