import { useEffect, useState } from 'react';
import { api } from '../api';
import { Activity, Droplet, Calculator, History } from 'lucide-react';

type Prediction = {
  predicted_weekly_dose_mg: number;
  predicted_daily_dose_mg: number;
  sqrt_dose_intermediate: number;
  contributing_factors: any;
  target_inr?: string;
  algorithm: string;
  disclaimer: string;
  inputs?: any;
  patient?: any;
};

const CYP_OPTIONS = ['*1/*1','*1/*2','*1/*3','*2/*2','*2/*3','*3/*3'];
const VKORC_OPTIONS = ['G/G','A/G','A/A'];

export default function WarfarinIwpc() {
  const [mode, setMode] = useState<'patient' | 'manual'>('patient');
  const [patientId, setPatientId] = useState<number>(3);
  const [age, setAge] = useState<number>(65);
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(80);
  const [cyp2c9, setCyp2c9] = useState<string>('*1/*1');
  const [vkorc1, setVkorc1] = useState<string>('G/G');
  const [race, setRace] = useState<string>('White');
  const [amiodarone, setAmiodarone] = useState<boolean>(false);
  const [enzymeInducer, setEnzymeInducer] = useState<boolean>(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try { setHistory(await api.warfarinHistory()); } catch {/* */}
    })();
  }, []);

  async function predict() {
    setLoading(true); setErr('');
    try {
      let r: Prediction;
      if (mode === 'patient') {
        r = await api.warfarinPredictPatient(patientId, { amiodarone_use: amiodarone, enzyme_inducer_use: enzymeInducer, race });
      } else {
        r = await api.warfarinPredict({
          age_years: age, height_cm: height, weight_kg: weight,
          cyp2c9, vkorc1, race,
          amiodarone_use: amiodarone, enzyme_inducer_use: enzymeInducer,
        });
      }
      setResult(r);
      setHistory(await api.warfarinHistory());
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  // Color based on weekly dose magnitude (low/typical/high).
  const doseTier = (mg: number) => mg < 10 ? 'text-red-700 bg-red-50' : mg <= 35 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Droplet className="w-6 h-6 text-teal-600" /> Warfarin IWPC Pharmacogenetic Dose Estimator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Implements IWPC 2009 algorithm (NEJM 360:753). Uses CYP2C9 + VKORC1 genotype, age, anthropometrics, race, and key co-medications.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-900">
        Educational use only. Dose must be titrated to INR 2.0–3.0. Reassess every 3–5 days during initiation.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Calculator className="w-5 h-5 text-teal-600" /> Inputs</h2>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setMode('patient')} className={`px-3 py-1 text-xs rounded ${mode==='patient' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Patient on file</button>
            <button onClick={() => setMode('manual')} className={`px-3 py-1 text-xs rounded ${mode==='manual' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Manual input</button>
          </div>

          {mode === 'patient' ? (
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-600">Patient ID</label>
              <input type="number" value={patientId} onChange={e => setPatientId(Number(e.target.value))} className="block mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-32" />
              <div className="text-[11px] text-slate-500 mt-1">Will pull age (from DOB), height/weight from latest vitals, CYP2C9 &amp; VKORC1 from PGx diplotypes.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="text-xs text-slate-600">Age (years)</label><input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="block mt-1 border border-slate-300 rounded px-2 py-1 text-sm w-full" /></div>
              <div><label className="text-xs text-slate-600">Height (cm)</label><input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="block mt-1 border border-slate-300 rounded px-2 py-1 text-sm w-full" /></div>
              <div><label className="text-xs text-slate-600">Weight (kg)</label><input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="block mt-1 border border-slate-300 rounded px-2 py-1 text-sm w-full" /></div>
              <div><label className="text-xs text-slate-600">CYP2C9</label>
                <select value={cyp2c9} onChange={e => setCyp2c9(e.target.value)} className="block mt-1 border border-slate-300 rounded px-2 py-1 text-sm w-full">
                  {CYP_OPTIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-slate-600">VKORC1 (rs9923231)</label>
                <select value={vkorc1} onChange={e => setVkorc1(e.target.value)} className="block mt-1 border border-slate-300 rounded px-2 py-1 text-sm w-full">
                  {VKORC_OPTIONS.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-slate-600">Race</label>
                <select value={race} onChange={e => setRace(e.target.value)} className="block mt-1 border border-slate-300 rounded px-2 py-1 text-sm w-full">
                  <option>White</option><option>Asian</option><option>Black/African American</option><option>Unknown</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1 mb-3">
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={amiodarone} onChange={e => setAmiodarone(e.target.checked)} />
              Amiodarone use (reduces dose ~22%)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={enzymeInducer} onChange={e => setEnzymeInducer(e.target.checked)} />
              Enzyme inducer (rifampin/carbamazepine/phenytoin — increases dose)
            </label>
          </div>

          <button onClick={predict} disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {loading ? 'Computing...' : 'Predict dose'}
          </button>
          {err && <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}
        </div>

        {/* Output */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Activity className="w-5 h-5 text-teal-600" /> Prediction</h2>
          {result ? (
            <div className="space-y-3">
              <div className={`rounded-lg p-4 ${doseTier(result.predicted_weekly_dose_mg)}`}>
                <div className="text-xs uppercase font-semibold">Weekly maintenance dose</div>
                <div className="text-3xl font-bold tabular-nums">{result.predicted_weekly_dose_mg} <span className="text-base font-medium">mg/week</span></div>
                <div className="text-xs mt-1">({result.predicted_daily_dose_mg} mg/day equivalent) • target INR {result.target_inr}</div>
              </div>
              {result.patient && (
                <div className="text-xs bg-slate-50 rounded p-2 border border-slate-200">
                  <span className="font-semibold">Patient:</span> {result.patient.first_name} {result.patient.last_name} (#{result.patient.id}), age {result.patient.age}
                </div>
              )}
              {result.inputs && (
                <div className="text-xs space-y-1 bg-slate-50 rounded p-2 border border-slate-200">
                  <div><span className="text-slate-500">CYP2C9:</span> <span className="font-mono">{result.inputs.cyp2c9 || '—'}</span></div>
                  <div><span className="text-slate-500">VKORC1 (rs9923231):</span> <span className="font-mono">{result.inputs.vkorc1 || '—'}</span></div>
                  <div><span className="text-slate-500">Height/Weight:</span> {result.inputs.height_cm} cm / {result.inputs.weight_kg} kg</div>
                  <div><span className="text-slate-500">Amiodarone:</span> {result.inputs.amiodarone_use ? 'yes' : 'no'} • <span className="text-slate-500">Enzyme inducer:</span> {result.inputs.enzyme_inducer_use ? 'yes' : 'no'}</div>
                </div>
              )}
              <div className="text-xs bg-slate-50 rounded p-2 border border-slate-200">
                <div className="font-semibold text-slate-700 mb-1">Algorithm: {result.algorithm}</div>
                <div className="text-slate-600">sqrt(weekly_dose) intermediate = {result.sqrt_dose_intermediate}</div>
              </div>
              <div className="text-[10px] text-slate-400 italic">{result.disclaimer}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">Click "Predict dose" to compute.</div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><History className="w-5 h-5 text-teal-600" /> Recent predictions ({history.length})</h2>
        <div className="overflow-x-auto max-h-[35vh]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white"><tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-2">When</th><th className="py-2 pr-2">Patient</th>
              <th className="py-2 pr-2">CYP2C9</th><th className="py-2 pr-2">VKORC1</th>
              <th className="py-2 pr-2 text-right">Weekly mg</th><th className="py-2 pr-2 text-right">Daily mg</th>
              <th className="py-2 pr-2 text-right">Actual INR</th>
            </tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b border-slate-100">
                  <td className="py-1 pr-2 text-slate-500">{new Date(h.created_at).toLocaleDateString()}</td>
                  <td className="py-1 pr-2 text-slate-800">{h.first_name} {h.last_name} #{h.patient_id}</td>
                  <td className="py-1 pr-2 font-mono">{h.cyp2c9_genotype || '—'}</td>
                  <td className="py-1 pr-2 font-mono">{h.vkorc1_rs9923231 || '—'}</td>
                  <td className="py-1 pr-2 text-right font-semibold tabular-nums">{Number(h.predicted_weekly_dose_mg).toFixed(1)}</td>
                  <td className="py-1 pr-2 text-right tabular-nums">{Number(h.predicted_daily_dose_mg).toFixed(2)}</td>
                  <td className="py-1 pr-2 text-right tabular-nums">{h.actual_inr ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
