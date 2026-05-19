import { useEffect, useState } from 'react';
import { api } from '../api';
import { LineChart, Users, TrendingUp, Shield } from 'lucide-react';

type Row = {
  id: number; patient_id: number; first_name?: string; last_name?: string;
  trait: string; pgs_catalog_id?: string; raw_score?: number; z_score?: number;
  percentile?: number; ancestry?: string; risk_category?: string; hazard_ratio?: number;
};

const RISK_BG: Record<string,string> = {
  'Very High': 'bg-red-100 text-red-800 border-red-300',
  High:        'bg-orange-100 text-orange-800 border-orange-300',
  Average:     'bg-slate-100 text-slate-700 border-slate-300',
  Low:         'bg-emerald-100 text-emerald-700 border-emerald-300',
};

export default function PrsDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [selectedTrait, setSelectedTrait] = useState<string>('Coronary Artery Disease');
  const [traitDist, setTraitDist] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [screening, setScreening] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await api.prsAll();
        setRows(all);
        const tset = Array.from(new Set(all.map((r: Row) => r.trait))).sort();
        setTraits(tset);
        if (all.length > 0) setSelectedPatient(all[0].patient_id);
      } catch {/* ignore */}
    })();
  }, []);

  useEffect(() => {
    if (!selectedTrait) return;
    (async () => {
      try { setTraitDist(await api.prsTrait(selectedTrait)); } catch {/* ignore */}
    })();
  }, [selectedTrait]);

  useEffect(() => {
    if (!selectedPatient) return;
    (async () => {
      try {
        const [pp, sc] = await Promise.all([api.prsPatient(selectedPatient), api.prsScreening(selectedPatient)]);
        setPatientProfile(pp); setScreening(sc);
      } catch {/* ignore */}
    })();
  }, [selectedPatient]);

  const veryHigh = rows.filter(r => Number(r.percentile) >= 95).length;
  const high = rows.filter(r => Number(r.percentile) >= 80 && Number(r.percentile) < 95).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <LineChart className="w-6 h-6 text-teal-600" /> Polygenic Risk Scores
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          PGS-Catalog scores with population percentiles, hazard ratios, and screening recommendations.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> Total scores</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{rows.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Traits</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{traits.length}</div>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-4">
          <div className="text-xs text-red-600 flex items-center gap-1"><Shield className="w-3 h-3" /> ≥95th percentile</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{veryHigh}</div>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-4">
          <div className="text-xs text-orange-600 flex items-center gap-1"><Shield className="w-3 h-3" /> 80–94th percentile</div>
          <div className="text-2xl font-bold text-orange-700 mt-1">{high}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trait distribution */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-semibold text-slate-900">Trait distribution</h2>
            <select value={selectedTrait} onChange={e => setSelectedTrait(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-sm">
              {traits.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {traitDist && (
            <>
              <div className="text-xs text-slate-500 mb-2">{traitDist.n} patient(s) scored. {traitDist.guideline?.high ? `Guideline (high PRS): ${traitDist.guideline.high}` : ''}</div>
              {/* Decile histogram */}
              <div className="flex items-end gap-1 h-32 mb-3">
                {traitDist.decile_counts.map((n: number, i: number) => {
                  const max = Math.max(1, ...traitDist.decile_counts);
                  const pct = 100 * n / max;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className={`w-full ${i >= 9 ? 'bg-red-500' : i >= 8 ? 'bg-orange-400' : i >= 5 ? 'bg-slate-400' : 'bg-emerald-400'}`} style={{ height: `${pct}%`, minHeight: n > 0 ? '4px' : '0' }} title={`Decile ${i+1}: ${n}`} />
                      <div className="text-[9px] text-slate-400 mt-0.5">{(i+1)*10}</div>
                    </div>
                  );
                })}
              </div>
              <div className="overflow-x-auto max-h-[35vh]">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-1 pr-2">Patient</th><th className="py-1 pr-2 text-right">z-score</th><th className="py-1 pr-2 text-right">%ile</th><th className="py-1 pr-2 text-right">HR</th><th className="py-1 pr-2">Category</th>
                  </tr></thead>
                  <tbody>
                    {traitDist.rows.map((r: Row) => (
                      <tr key={r.patient_id} onClick={() => setSelectedPatient(r.patient_id)} className="hover:bg-slate-50 cursor-pointer border-b border-slate-100">
                        <td className="py-1 pr-2 text-slate-800">{r.first_name} {r.last_name} <span className="text-slate-400">#{r.patient_id}</span></td>
                        <td className="py-1 pr-2 text-right font-mono">{Number(r.z_score).toFixed(2)}</td>
                        <td className="py-1 pr-2 text-right font-semibold text-slate-900">{Number(r.percentile).toFixed(1)}</td>
                        <td className="py-1 pr-2 text-right font-mono">{r.hazard_ratio ? Number(r.hazard_ratio).toFixed(2) : '—'}</td>
                        <td className="py-1 pr-2"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${RISK_BG[r.risk_category || '']}`}>{r.risk_category}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Patient profile + screening */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Patient profile</h2>
          <select value={selectedPatient || ''} onChange={e => setSelectedPatient(Number(e.target.value))} className="block w-full border border-slate-300 rounded px-2 py-1 text-sm mb-3">
            {Array.from(new Set(rows.map(r => r.patient_id))).map(pid => {
              const row = rows.find(r => r.patient_id === pid);
              return <option key={pid} value={pid}>{row?.first_name} {row?.last_name} (#{pid})</option>;
            })}
          </select>
          {patientProfile && (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto">
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">All traits ({patientProfile.profile.length})</div>
                {patientProfile.profile.map((p: Row) => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-800">{p.trait}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 tabular-nums">{Number(p.percentile).toFixed(1)}%</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${RISK_BG[p.risk_category || '']}`}>{p.risk_category}</span>
                    </div>
                  </div>
                ))}
              </div>
              {screening?.items.filter((i: any) => i.priority === 'high').length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-2 mt-3">Screening recommendations (high priority)</div>
                  {screening.items.filter((i: any) => i.priority === 'high').map((i: any, idx: number) => (
                    <div key={idx} className="rounded p-2 border border-red-200 bg-red-50 mb-2">
                      <div className="text-xs font-semibold text-red-900">{i.trait} • {i.percentile.toFixed(1)}%ile {i.hazard_ratio ? `(HR ${i.hazard_ratio.toFixed(2)})` : ''}</div>
                      <div className="text-[11px] text-red-800 mt-1">{i.action}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-slate-400 italic">{patientProfile.disclaimer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
