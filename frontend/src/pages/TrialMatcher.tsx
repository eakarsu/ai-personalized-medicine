import { useEffect, useState } from 'react';
import { api } from '../api';
import { FlaskConical, ExternalLink, Target, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type Trial = {
  nct_id: string; title: string; phase: string; status: string; condition: string;
  intervention: string; sponsor: string; required_gene?: string; required_variant?: string;
  location: string; primary_endpoint: string;
};
type MatchRow = {
  trial: Trial;
  score: number; verdict: 'eligible' | 'screen' | 'consider' | 'no_match';
  reasons: { criterion: string; pass: boolean; detail: string }[];
};

const VERDICT_BG: Record<string,string> = {
  eligible:  'bg-emerald-100 text-emerald-800 border-emerald-300',
  screen:    'bg-amber-100 text-amber-800 border-amber-300',
  consider:  'bg-slate-100 text-slate-700 border-slate-300',
  no_match:  'bg-red-50 text-red-600 border-red-200',
};

export default function TrialMatcher() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [patientId, setPatientId] = useState<number>(3);
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [patientCtx, setPatientCtx] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verdictFilter, setVerdictFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      try {
        const [t, s] = await Promise.all([api.trialsList(), api.trialStats()]);
        setTrials(t); setStats(s);
      } catch { /* ignore */ }
    })();
  }, []);

  async function runMatch() {
    if (!patientId) return;
    setLoading(true);
    try {
      const r = await api.trialMatch(patientId);
      setMatches(r.matches);
      setPatientCtx({ patient: r.patient, ctx: r.patient_context, eligible: r.eligible_count, screen: r.screen_count });
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  const filtered = (matches || []).filter(m => verdictFilter === 'all' ? true : m.verdict === verdictFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-teal-600" /> Genotype-Aware Clinical Trial Matching
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Evaluates patient eligibility against {trials.length} trials using condition, age, sex, genotype, and exclusion criteria.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Trials in registry</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{trials.length}</div>
          {stats && <div className="text-xs text-slate-500 mt-1">{stats.totals.filter((t: any) => t.status === 'Recruiting').reduce((a: number, b: any) => a + Number(b.n), 0)} recruiting</div>}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Genotype-gated trials</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats?.genes.reduce((a: number, b: any) => a + Number(b.n), 0) ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-1">Across {stats?.genes.length ?? 0} genes</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Top conditions</div>
          <div className="text-sm font-semibold text-slate-900 mt-1 truncate">{stats?.conditions[0]?.condition || '—'}</div>
          <div className="text-xs text-slate-500 mt-1">{stats?.conditions[0]?.n || 0} trials</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-3">Run match for patient</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Patient ID</label>
            <input type="number" value={patientId} onChange={e => setPatientId(Number(e.target.value))} className="block mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-32" />
          </div>
          <button onClick={runMatch} disabled={loading} className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1">
            <Target className="w-4 h-4" />{loading ? 'Matching...' : 'Run match'}
          </button>
          {patientCtx && (
            <div className="ml-auto text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{patientCtx.patient.first_name} {patientCtx.patient.last_name}</span> • age {patientCtx.ctx.age} • {patientCtx.ctx.gender} • {patientCtx.ctx.gene_count} genes on file • <span className="text-emerald-700 font-semibold">{patientCtx.eligible} eligible</span> + <span className="text-amber-700 font-semibold">{patientCtx.screen} screen</span>
            </div>
          )}
        </div>
      </div>

      {matches && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Match results ({filtered.length})</h2>
            <div className="flex gap-1">
              {['all','eligible','screen','consider','no_match'].map(v => (
                <button key={v} onClick={() => setVerdictFilter(v)} className={`text-[11px] px-2 py-1 rounded border ${verdictFilter===v?'bg-teal-600 text-white border-teal-600':'bg-white border-slate-300 text-slate-700'}`}>{v}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto">
            {filtered.map((m, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={`https://clinicaltrials.gov/study/${m.trial.nct_id}`} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline font-mono text-xs flex items-center gap-0.5">
                        {m.trial.nct_id} <ExternalLink className="w-3 h-3" />
                      </a>
                      <span className="text-[10px] bg-slate-200 rounded px-1.5 py-0.5 text-slate-700">{m.trial.phase}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5">{m.trial.status}</span>
                      {m.trial.required_gene && <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5 font-mono">{m.trial.required_gene} {m.trial.required_variant || ''}</span>}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-1">{m.trial.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.trial.intervention} • {m.trial.sponsor} • {m.trial.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{m.score}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${VERDICT_BG[m.verdict]}`}>{m.verdict.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {m.reasons.map((r, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-[11px]">
                      {r.pass ? <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-600 shrink-0" /> :
                                <XCircle className="w-3 h-3 mt-0.5 text-red-500 shrink-0" />}
                      <span className="text-slate-700"><span className="font-semibold capitalize">{r.criterion}:</span> {r.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!matches && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-slate-400" /> Trials in registry</h2>
          <div className="overflow-x-auto max-h-[55vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white"><tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">NCT</th><th className="py-2 pr-2">Phase</th><th className="py-2 pr-2">Condition</th><th className="py-2 pr-2">Gene/Variant</th><th className="py-2 pr-2">Status</th>
              </tr></thead>
              <tbody>
                {trials.map(t => (
                  <tr key={t.nct_id} className="border-b border-slate-100">
                    <td className="py-1 pr-2 font-mono text-teal-700">{t.nct_id}</td>
                    <td className="py-1 pr-2 text-slate-700">{t.phase}</td>
                    <td className="py-1 pr-2 text-slate-800">{t.condition}</td>
                    <td className="py-1 pr-2 font-mono text-purple-700">{t.required_gene || '—'} {t.required_variant || ''}</td>
                    <td className="py-1 pr-2 text-emerald-700">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
