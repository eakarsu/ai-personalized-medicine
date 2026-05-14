import { useEffect, useState } from 'react';
import { api } from '../api';
import { Dna, Calculator, ChevronDown, ChevronRight } from 'lucide-react';

type Variant = {
  id: number; patient_id: number; first_name?: string; last_name?: string;
  gene: string; hgvs_c?: string; hgvs_p?: string; rsid?: string;
  acmg_classification?: string; acmg_score?: number; acmg_criteria?: any;
  gnomad_af?: number; clinvar_id?: string; condition?: string; zygosity?: string;
};

const CLASS_BG: Record<string,string> = {
  Pathogenic:                   'bg-red-100 text-red-800 border-red-300',
  'Likely pathogenic':          'bg-orange-100 text-orange-800 border-orange-300',
  'Uncertain significance':     'bg-amber-100 text-amber-800 border-amber-300',
  'Likely benign':              'bg-emerald-50 text-emerald-700 border-emerald-200',
  Benign:                       'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Risk allele (APOE4/4)':      'bg-amber-100 text-amber-800 border-amber-300',
};

const CRITERIA_GROUPS: { label: string; codes: string[]; color: string }[] = [
  { label: 'Very Strong (PVS, +8)', codes: ['PVS1'],                                              color: 'border-red-600' },
  { label: 'Strong (PS, +4)',       codes: ['PS1','PS2','PS3','PS4'],                             color: 'border-red-500' },
  { label: 'Moderate (PM, +2)',     codes: ['PM1','PM2','PM3','PM4','PM5','PM6'],                 color: 'border-orange-500' },
  { label: 'Supporting (PP, +1)',   codes: ['PP1','PP2','PP3','PP4','PP5'],                       color: 'border-amber-500' },
  { label: 'Benign Strong (BS, -4)',codes: ['BS1','BS2','BS3','BS4'],                             color: 'border-emerald-500' },
  { label: 'Benign Supporting (BP, -1)', codes: ['BP1','BP2','BP3','BP4','BP5','BP6','BP7'],     color: 'border-emerald-400' },
];

export default function VariantAcmg() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [glossary, setGlossary] = useState<any>(null);
  const [picked, setPicked] = useState<Record<string,boolean>>({});
  const [classifyResult, setClassifyResult] = useState<any>(null);
  const [filter, setFilter] = useState({ gene: '', classification: '' });
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [v, s, g] = await Promise.all([api.acmgList(), api.acmgStats(), api.acmgGlossary()]);
        setVariants(v); setStats(s); setGlossary(g);
      } catch (e: any) { /* noop */ }
    })();
  }, []);

  async function reload() {
    const params: Record<string,string> = {};
    if (filter.gene) params.gene = filter.gene;
    if (filter.classification) params.classification = filter.classification;
    setVariants(await api.acmgList(params));
  }

  async function runClassifier() {
    const c = await api.acmgClassify(picked);
    setClassifyResult(c);
  }

  function toggle(code: string) { setPicked(p => ({ ...p, [code]: !p[code] })); }

  // Load variant criteria into classifier.
  function loadCriteria(v: Variant) {
    const next: Record<string,boolean> = {};
    if (v.acmg_criteria && typeof v.acmg_criteria === 'object') {
      for (const [k, val] of Object.entries(v.acmg_criteria)) next[k] = !!val;
    }
    setPicked(next);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Dna className="w-6 h-6 text-teal-600" /> ACMG/AMP Variant Classifier
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tavtigian-2018 point-based combiner over Richards-2015 criteria. Real ClinVar/gnomAD identifiers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — variant roster */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Patient variants ({variants.length})</h2>
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <input value={filter.gene} onChange={e => setFilter({...filter, gene: e.target.value})} placeholder="Gene..."
              className="border border-slate-300 rounded px-2 py-1" />
            <select value={filter.classification} onChange={e => setFilter({...filter, classification: e.target.value})}
              className="border border-slate-300 rounded px-2 py-1">
              <option value="">All classifications</option>
              {Object.keys(CLASS_BG).map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={reload} className="bg-teal-600 text-white rounded px-2.5 py-1">Filter</button>
          </div>
          {stats && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {stats.by_classification.slice(0, 4).map((s: any) => (
                <div key={s.acmg_classification} className={`rounded p-2 border text-xs ${CLASS_BG[s.acmg_classification] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  <div className="font-semibold">{s.acmg_classification}</div>
                  <div className="text-lg font-bold">{s.n}</div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            {variants.map(v => (
              <div key={v.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <button onClick={() => setExpanded(expanded === v.id ? null : v.id)} className="w-full flex items-start gap-2 text-left">
                  {expanded === v.id ? <ChevronDown className="w-4 h-4 mt-1 text-slate-500" /> : <ChevronRight className="w-4 h-4 mt-1 text-slate-500" />}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{v.gene} {v.hgvs_p || v.hgvs_c}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CLASS_BG[v.acmg_classification || ''] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {v.acmg_classification} {v.acmg_score != null ? `(${v.acmg_score}p)` : ''}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Patient #{v.patient_id} {v.first_name} {v.last_name} • {v.rsid} • gnomAD AF {v.gnomad_af ?? '—'} • {v.zygosity}
                    </div>
                  </div>
                </button>
                {expanded === v.id && (
                  <div className="mt-2 pl-6 text-xs space-y-1">
                    <div><span className="text-slate-500">Condition:</span> {v.condition || '—'}</div>
                    <div><span className="text-slate-500">ClinVar:</span> {v.clinvar_id || '—'}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500">Applied criteria:</span>
                      {v.acmg_criteria && Object.entries(v.acmg_criteria).filter(([_,val]) => val).map(([k]) => (
                        <span key={k} className="bg-white border border-slate-300 rounded px-1 py-0.5 font-mono">{k}</span>
                      ))}
                    </div>
                    <button onClick={() => loadCriteria(v)} className="mt-1 text-teal-700 hover:underline">Load into classifier →</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right — live classifier */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Calculator className="w-5 h-5 text-teal-600" /> Live ACMG classifier</h2>
          <p className="text-xs text-slate-500 mb-3">Toggle criteria; score &amp; classification update on submit. {Object.keys(glossary?.criteria || {}).length} criteria defined.</p>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {CRITERIA_GROUPS.map(g => (
              <div key={g.label} className={`border-l-4 ${g.color} pl-3`}>
                <div className="text-xs font-semibold text-slate-700 mb-1">{g.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.codes.map(code => (
                    <button key={code} onClick={() => toggle(code)}
                      title={glossary?.criteria?.[code]}
                      className={`text-[11px] px-2 py-0.5 rounded border font-mono ${picked[code] ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}>
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button onClick={runClassifier} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Classify</button>
            <button onClick={() => { setPicked({}); setClassifyResult(null); }} className="text-slate-600 hover:text-slate-800 text-sm">Clear</button>
            <div className="text-xs text-slate-500 ml-2">{Object.values(picked).filter(Boolean).length} selected</div>
          </div>

          {classifyResult && (
            <div className="mt-4 border border-slate-200 rounded-lg p-3 bg-slate-50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm font-semibold text-slate-900">Score: <span className="text-teal-700 text-lg">{classifyResult.score}</span></div>
                <span className={`text-xs px-2 py-1 rounded border ${CLASS_BG[classifyResult.classification] || 'bg-slate-100'}`}>{classifyResult.classification}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Bayesian PP ≈ {classifyResult.bayesian_pp_proxy}</div>
              {classifyResult.applied.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-slate-600 mb-1">Applied criteria:</div>
                  <ul className="space-y-1">
                    {classifyResult.applied.map((a: any) => (
                      <li key={a.code} className="text-[11px] flex gap-2"><span className="font-mono w-12 shrink-0">{a.code}</span><span className="text-slate-500">{a.points >= 0 ? '+' : ''}{a.points}</span><span className="text-slate-700">{a.definition}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-[10px] text-slate-400 mt-2 italic">{classifyResult.framework} • {classifyResult.disclaimer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
