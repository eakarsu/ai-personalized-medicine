import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Dna, Pill, ClipboardPlus, ShieldAlert, TrendingUp, Activity, FlaskConical, BellRing } from 'lucide-react';
import { api } from '../api';
import AIResponse from './AIResponse';

// Synthetic-only realistic clinical scenarios. No real PII.
// Real drug names with synthetic doses, real biomarkers with synthetic values, real PGx alleles.
const SAMPLES: { label: string; data: { treatment: string; symptoms: string; scenario: string } }[] = [
  {
    label: 'T2DM + CYP2C19 *2/*2',
    data: {
      treatment: 'Metformin 500mg BID; consider clopidogrel alternative due to CYP2C19 poor metabolizer',
      symptoms: 'Polyuria, fatigue x2 weeks; HbA1c 7.8%, LDL 142 mg/dL, eGFR 58, fasting glucose 168 mg/dL',
      scenario: 'Synthetic 62yo with T2DM, hyperlipidemia, recent stent; PGx CYP2C19 *2/*2 (poor metabolizer).'
    }
  },
  {
    label: 'AFib + VKORC1/CYP2C9',
    data: {
      treatment: 'Apixaban 5mg BID (preferred over warfarin given VKORC1 -1639G>A and CYP2C9 *1/*3)',
      symptoms: 'Palpitations, mild dyspnea on exertion; INR 1.1, eGFR 62, BNP 180 pg/mL',
      scenario: 'Synthetic 71yo with non-valvular AFib, CHA2DS2-VASc 3; PGx VKORC1 -1639G>A, CYP2C9 *1/*3.'
    }
  },
  {
    label: 'HLA-B*57:01 abacavir',
    data: {
      treatment: 'Avoid abacavir; substitute tenofovir-based regimen due to HLA-B*57:01 positive',
      symptoms: 'Routine HIV management; CD4 412, viral load undetectable, ALT 28, AST 24',
      scenario: 'Synthetic 38yo on ART; PGx HLA-B*57:01 positive — abacavir hypersensitivity risk.'
    }
  }
];

const tools = [
  { key: 'risk', icon: AlertTriangle, label: 'Patient Risk Assessment', desc: 'Comprehensive risk profile based on genetics, conditions, and history', color: 'from-red-500 to-rose-600' },
  { key: 'genomic', icon: Dna, label: 'Genomic Insights', desc: 'Interpret genetic variants and their clinical implications', color: 'from-emerald-500 to-teal-600' },
  { key: 'medication', icon: Pill, label: 'Medication Analysis', desc: 'Pharmacogenomics review and drug interaction analysis', color: 'from-purple-500 to-violet-600' },
  { key: 'treatment', icon: ClipboardPlus, label: 'Treatment Plan', desc: 'Generate personalized precision medicine treatment plans', color: 'from-blue-500 to-cyan-600' },
  { key: 'drug-interaction', icon: ShieldAlert, label: 'Drug Interaction Risk', desc: 'Score pairwise medication interactions and contraindications', color: 'from-orange-500 to-amber-600' },
  { key: 'treatment-response', icon: TrendingUp, label: 'Treatment Response Predictor', desc: 'Predict likelihood of response to a proposed therapy', color: 'from-sky-500 to-indigo-600' },
  { key: 'biomarker', icon: Activity, label: 'Biomarker Pattern Detector', desc: 'Cluster lab biomarkers and surface meaningful patterns', color: 'from-fuchsia-500 to-pink-600' },
  { key: 'trial-match', icon: FlaskConical, label: 'Clinical Trial Matcher', desc: 'Suggest trial categories that may fit the patient profile', color: 'from-lime-500 to-green-600' },
  { key: 'adverse-event', icon: BellRing, label: 'Adverse Event Early Warning', desc: 'Flag possible ADRs and red-flag findings for prompt action', color: 'from-rose-500 to-red-700' },
];

export default function AICenter() {
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [markers, setMarkers] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, any>>({});

  useEffect(() => {
    api.getPatients().then(setPatients).catch(() => {});
    api.getGenomeMarkers().then(setMarkers).catch(() => {});
    api.getMedications().then(setMeds).catch(() => {});
    api.getLabResults().then(setLabs).catch(() => {});
  }, []);

  const run = async (key: string) => {
    if (loading) return;
    setActive(key); setLoading(true); setResult(''); setDisclaimer('');
    try {
      const patient = patients.find(p => p.id === parseInt(selected.patient)) || patients[0];
      const age = patient?.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31536000000) : null;
      const marker = markers.find(m => m.id === parseInt(selected.marker)) || markers[0];
      const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown';
      const patientMeds = meds.filter(m => m.patient_id === patient?.id).map(m => `${m.name} ${m.dosage || ''} ${m.frequency || ''}`.trim()).join('; ') || 'None';
      const patientLabs = labs.filter(l => l.patient_id === patient?.id).slice(0, 10).map(l => `${l.test_name}: ${l.value} ${l.unit || ''} (${l.status || 'n/a'})`).join('; ') || 'None';
      const patientGenomics = markers.filter(m => m.patient_id === patient?.id).map(m => `${m.gene_name} ${m.variant || ''} (${m.significance || 'unknown'})`).join('; ') || 'None';
      let r: any;
      if (key === 'risk') r = await api.patientRisk({ patientName, age, conditions: patient?.conditions, bloodType: patient?.blood_type, allergies: patient?.allergies, genomicMarkers: patientGenomics });
      else if (key === 'genomic') r = await api.genomicInsights({ patientName: marker?.patient_name, geneName: marker?.gene_name, variant: marker?.variant, significance: marker?.significance, conditionAssociation: marker?.condition_association, confidenceScore: marker?.confidence_score });
      else if (key === 'medication') r = await api.medicationAnalysis({ patientName, conditions: patient?.conditions, medications: patientMeds, genomicMarkers: patientGenomics });
      else if (key === 'treatment') r = await api.treatmentPlan({ patientName, age, conditions: patient?.conditions, labResults: patientLabs, genomicMarkers: patientGenomics, currentMedications: patientMeds });
      else if (key === 'drug-interaction') r = await api.drugInteraction({ patientName, medications: patientMeds, allergies: patient?.allergies, conditions: patient?.conditions });
      else if (key === 'treatment-response') r = await api.treatmentResponse({ patientName, age, conditions: patient?.conditions, proposedTreatment: selected.treatment || 'Standard first-line therapy', genomicMarkers: patientGenomics, labResults: patientLabs });
      else if (key === 'biomarker') r = await api.biomarkerPattern({ patientName, labResults: patientLabs, conditions: patient?.conditions });
      else if (key === 'trial-match') r = await api.clinicalTrialMatch({ patientName, age, gender: patient?.gender, conditions: patient?.conditions, genomicMarkers: patientGenomics, location: selected.location || 'Any' });
      else if (key === 'adverse-event') r = await api.adverseEventWarning({ patientName, medications: patientMeds, recentSymptoms: selected.symptoms || patient?.conditions || 'None reported', vitals: 'See latest health record', labResults: patientLabs });
      setResult(r?.result || 'No response received.');
      if (r?.disclaimer) setDisclaimer(r.disclaimer);
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('not configured') || msg.includes('upstream')) setResult('AI service is currently unavailable (503). Please try again later.');
      else setResult('AI request failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2"><Sparkles className="w-7 h-7 text-teal-600" /><h2 className="text-2xl font-bold text-gray-900">AI Center</h2></div>
        <p className="text-gray-500">Precision medicine AI tools powered by genomics and clinical data</p>
      </div>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <strong>Disclaimer:</strong> Not medical advice — consult a clinician. AI outputs are illustrative and must be reviewed by a qualified healthcare professional before any clinical action.
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {tools.map(tool => (
          <button key={tool.key} onClick={() => run(tool.key)} className={`relative overflow-hidden rounded-xl p-5 text-left bg-gradient-to-br ${tool.color} text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
            <tool.icon className="w-7 h-7 mb-3 opacity-90" />
            <div className="font-semibold text-base mb-1">{tool.label}</div>
            <div className="text-sm opacity-80">{tool.desc}</div>
            {active === tool.key && loading && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
          <select value={selected.patient || ''} onChange={e => setSelected(p => ({ ...p, patient: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            <option value="">— First patient —</option>{patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Genome Marker</label>
          <select value={selected.marker || ''} onChange={e => setSelected(p => ({ ...p, marker: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
            <option value="">— First marker —</option>{markers.map(m => <option key={m.id} value={m.id}>{m.gene_name} — {m.patient_name}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-teal-100 bg-teal-50/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-teal-700" />
            <div className="text-sm font-semibold text-teal-900">Sample scenarios</div>
          </div>
          <div className="text-[11px] italic text-teal-700">Synthetic data only — no real PII</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map(s => (
            <button
              key={s.label}
              type="button"
              onClick={() => setSelected(p => ({ ...p, treatment: s.data.treatment, symptoms: s.data.symptoms }))}
              className="px-3 py-1.5 rounded-md bg-white border border-teal-200 text-xs font-medium text-teal-800 hover:bg-teal-100 hover:border-teal-300 transition"
              title={s.data.scenario}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Treatment (response predictor)</label>
          <input value={selected.treatment || ''} onChange={e => setSelected(p => ({ ...p, treatment: e.target.value }))} placeholder="e.g. metformin 500mg BID" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recent Symptoms (adverse event)</label>
          <input value={selected.symptoms || ''} onChange={e => setSelected(p => ({ ...p, symptoms: e.target.value }))} placeholder="e.g. nausea, fatigue x3 days" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
        </div>
      </div>

      {(loading || result) && (
        <>
          <AIResponse
            content={result}
            title={tools.find(t => t.key === active)?.label || 'AI Analysis'}
            isLoading={loading}
            onRegenerate={() => active && run(active)}
          />
          {disclaimer && <div className="mt-3 text-xs text-amber-700 italic">{disclaimer}</div>}
        </>
      )}
    </div>
  );
}
