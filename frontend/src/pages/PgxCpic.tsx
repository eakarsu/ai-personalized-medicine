import { useEffect, useState } from 'react';
import { api } from '../api';
import { Pill, Activity, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';

type Diplotype = { id: number; patient_id: number; first_name?: string; last_name?: string; gene: string; allele1: string; allele2: string; phenotype: string; activity_score?: number; reported_at?: string; notes?: string };
type Rule = { gene: string; drug: string; phenotype: string; recommendation: string; classification: string; evidence_level: string; cpic_guideline: string };
type CheckResult = { drug: string; verdict: string; verdict_text: string; matches: any[]; missing_genes: string[]; diplotype_count: number; rule_count: number };

const ALERT_BG: Record<string,string> = {
  critical: 'bg-red-900/40 border-red-700 text-red-200',
  warning:  'bg-amber-900/40 border-amber-700 text-amber-200',
  ok:       'bg-emerald-900/40 border-emerald-700 text-emerald-200',
  info:     'bg-slate-800/60 border-slate-700 text-slate-200',
};

const POPULAR_DRUGS = ['clopidogrel','warfarin','codeine','tamoxifen','escitalopram','simvastatin','abacavir','azathioprine','tacrolimus','carbamazepine','fluorouracil','efavirenz'];

export default function PgxCpic() {
  const [diplotypes, setDiplotypes] = useState<Diplotype[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [patientId, setPatientId] = useState<number | ''>('');
  const [drug, setDrug] = useState('clopidogrel');
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [d, r] = await Promise.all([api.pgxDiplotypes(), api.pgxRules()]);
        setDiplotypes(d); setRules(r);
        if (d.length > 0) setPatientId(d[0].patient_id);
      } catch (e: any) { setErr(e.message); }
    })();
  }, []);

  async function runCheck() {
    if (!patientId || !drug) return;
    setLoading(true); setErr('');
    try {
      const c = await api.pgxCheck(Number(patientId), drug);
      setCheck(c);
      const cov = await api.pgxCoverage(Number(patientId));
      setCoverage(cov);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  // Group diplotypes by patient for the left rail.
  const byPatient: Record<string, Diplotype[]> = {};
  for (const d of diplotypes) {
    const k = `${d.patient_id}|${d.first_name || ''} ${d.last_name || ''}`;
    (byPatient[k] = byPatient[k] || []).push(d);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Pill className="w-6 h-6 text-teal-600" /> CPIC Pharmacogenomics Decision Support
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Genotype-to-drug guidance from CPIC Level A guidelines. {rules.length} rules, {diplotypes.length} diplotype calls on file.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-900">
        Synthetic data only — for demo use. Not medical advice — consult a clinician.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: patient diplotype roster */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-teal-600" /> Diplotype roster</h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {Object.entries(byPatient).map(([k, list]) => {
              const [pid, name] = k.split('|');
              return (
                <button key={pid} onClick={() => setPatientId(Number(pid))}
                  className={`w-full text-left rounded-lg p-3 border ${Number(patientId)===Number(pid) ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                  <div className="text-xs text-slate-500">Patient #{pid}</div>
                  <div className="text-sm font-semibold text-slate-900">{name.trim() || 'Unknown'}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {list.map(d => (
                      <span key={d.id} className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700">
                        {d.gene} <span className="text-teal-700">{d.allele1}/{d.allele2}</span>
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: drug-check + coverage */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Prescribing check</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Patient ID</label>
                <input type="number" value={patientId} onChange={e => setPatientId(e.target.value ? Number(e.target.value) : '')}
                  className="block mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-32" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-slate-600">Drug</label>
                <input type="text" value={drug} onChange={e => setDrug(e.target.value)} list="drug-list"
                  className="block mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full" />
                <datalist id="drug-list">{POPULAR_DRUGS.map(d => <option key={d} value={d} />)}</datalist>
              </div>
              <button onClick={runCheck} disabled={loading || !patientId}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">
                {loading ? 'Checking...' : 'Run CPIC check'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {POPULAR_DRUGS.map(d => (
                <button key={d} onClick={() => setDrug(d)} className={`text-[11px] px-2 py-0.5 rounded-full border ${drug===d?'bg-teal-600 text-white border-teal-600':'bg-slate-50 text-slate-700 border-slate-200'}`}>{d}</button>
              ))}
            </div>

            {err && <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}

            {check && (
              <div className="mt-5 space-y-3">
                <div className={`rounded-lg border p-3 ${ALERT_BG[check.verdict] || ALERT_BG.info}`}>
                  <div className="flex items-start gap-2">
                    {check.verdict==='critical' ? <AlertTriangle className="w-5 h-5 mt-0.5" /> :
                      check.verdict==='warning' ? <AlertTriangle className="w-5 h-5 mt-0.5" /> :
                      <CheckCircle className="w-5 h-5 mt-0.5" />}
                    <div>
                      <div className="text-sm font-semibold uppercase">{check.verdict}</div>
                      <div className="text-xs mt-0.5">{check.verdict_text}</div>
                    </div>
                  </div>
                </div>
                {check.matches.length > 0 ? check.matches.map((m, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">{m.gene} {m.allele1}/{m.allele2}</div>
                      <span className="text-[10px] bg-slate-200 rounded px-1.5 py-0.5">CPIC {m.evidence_level}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{m.phenotype} • activity score {m.activity_score ?? '—'}</div>
                    <div className={`mt-2 text-xs font-medium ${m.alert==='critical'?'text-red-700':m.alert==='warning'?'text-amber-700':'text-emerald-700'}`}>
                      [{m.classification}] {m.recommendation}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {m.cpic_guideline}</div>
                  </div>
                )) : (
                  <div className="text-xs text-slate-500 italic">No phenotype-matched rules. {check.missing_genes.length>0 && `Missing genotypes: ${check.missing_genes.join(', ')}.`}</div>
                )}
              </div>
            )}
          </div>

          {coverage && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 mb-1">Full CPIC coverage for patient {patientId}</h2>
              <div className="text-xs text-slate-500 mb-3">{coverage.summary.total_actionable} actionable rules • {coverage.summary.critical} critical • {coverage.summary.warning} warning</div>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {coverage.groups.map((g: any) => (
                  <div key={`${g.gene}-${g.phenotype}`} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="text-sm font-medium text-slate-900">{g.gene} {g.allele1}/{g.allele2} <span className="text-slate-500">— {g.phenotype}</span></div>
                    <ul className="mt-2 space-y-1">
                      {g.drugs.map((d: any, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className={`shrink-0 mt-0.5 inline-block w-2 h-2 rounded-full ${d.alert==='critical'?'bg-red-500':d.alert==='warning'?'bg-amber-500':'bg-emerald-500'}`} />
                          <span className="text-slate-800"><span className="font-semibold">{d.drug}</span> — [{d.classification}] {d.recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
