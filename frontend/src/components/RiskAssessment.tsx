type Severity = 'high' | 'medium' | 'low'

interface RiskFactor {
  id: number
  name: string
  severity: Severity
  category: string
  value: string
  explanation: string
  recommendedAction: string
}

const riskFactors: RiskFactor[] = [
  {
    id: 1,
    name: 'Cardiovascular Disease',
    severity: 'high',
    category: 'Cardiac',
    value: '18% 10-yr risk',
    explanation: 'Elevated LDL (148 mg/dL) combined with hypertension, APOE ε4 variant, and sedentary lifestyle pattern significantly increases 10-year ASCVD risk per Framingham model. Age and sex also factor into elevated baseline.',
    recommendedAction: 'Intensify statin therapy (consider 40mg atorvastatin), target BP <130/80, increase cardiovascular exercise to 150 min/week.',
  },
  {
    id: 2,
    name: 'Type 2 Diabetes Progression',
    severity: 'high',
    category: 'Metabolic',
    value: 'HbA1c 6.1% (pre-diabetic)',
    explanation: 'Pre-diabetes confirmed with HbA1c 6.1% and fasting glucose 108 mg/dL. TCF7L2 rs7903146 T/C variant adds ~20% additional susceptibility. BMI 27.4 and low physical activity accelerate progression risk to ~22% over 5 years.',
    recommendedAction: 'Structured dietary intervention, 30-min moderate exercise 5x/week, metformin prophylaxis consideration. HbA1c monitoring every 3 months.',
  },
  {
    id: 3,
    name: 'Hypertension Control',
    severity: 'medium',
    category: 'Cardiac',
    value: 'Avg 138/88 mmHg',
    explanation: 'Blood pressure trending above target despite Lisinopril 10mg therapy. Wearable data shows nocturnal dipping pattern is absent, which independently increases cardiovascular risk. Sodium intake estimated at 3,200 mg/day.',
    recommendedAction: 'Increase Lisinopril to 20mg or add amlodipine. DASH diet counseling. Sodium restriction below 2,300 mg/day. CPAP compliance check.',
  },
  {
    id: 4,
    name: 'Sleep Deficit',
    severity: 'medium',
    category: 'Lifestyle',
    value: '6.2 hrs avg (target 7–9)',
    explanation: 'Chronic sleep deficit below 7 hours is associated with increased cortisol, insulin resistance, and cardiovascular strain. CPAP compliance at 68% — suboptimal. Sleep architecture analysis shows reduced deep sleep phases.',
    recommendedAction: 'CPAP compliance coaching. Sleep hygiene program. Consider sleep specialist referral. Evaluate for anxiety contributing to sleep initiation difficulties.',
  },
  {
    id: 5,
    name: 'Cognitive Decline Risk',
    severity: 'medium',
    category: 'Neurological',
    value: 'APOE ε3/ε4 carrier',
    explanation: 'APOE ε4 heterozygous carrier status increases lifetime Alzheimer\'s disease risk by approximately 3–4x versus non-carriers. Combined with sleep deficit (amyloid clearance impairment), cardiovascular risk factors, and age 55, proactive monitoring is warranted.',
    recommendedAction: 'Annual cognitive screening (MoCA). Omega-3 supplementation (2g DHA/day). Mediterranean diet adherence. Consider FINGER protocol lifestyle program.',
  },
  {
    id: 6,
    name: 'Colorectal Cancer Screening',
    severity: 'low',
    category: 'Oncology',
    value: 'Age 55, no family history',
    explanation: 'Standard age-based screening window for colorectal cancer. Last colonoscopy was 8 years ago at age 47. While no elevated genetic risk detected, age-appropriate surveillance is essential for early detection, which has 90% 5-year survival rate.',
    recommendedAction: 'Schedule colonoscopy within 3 months. Consider Cologuard stool DNA test if colonoscopy is declined. Continue aspirin 81mg for CRC risk reduction.',
  },
]

const severityConfig: Record<Severity, { label: string; badge: string; border: string; dot: string }> = {
  high: { label: 'High Risk', badge: 'bg-red-100 text-red-800', border: 'border-red-200', dot: 'bg-red-500' },
  medium: { label: 'Medium Risk', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  low: { label: 'Low Risk', badge: 'bg-green-100 text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
}

export default function RiskAssessment() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Risk Assessment</h2>
          <p className="text-sm text-slate-500">Evidence-based risk analysis for James Thornton</p>
        </div>
        <div className="flex gap-2 text-xs">
          {(['high', 'medium', 'low'] as Severity[]).map((s) => (
            <span key={s} className={`px-2.5 py-1 rounded-full font-medium ${severityConfig[s].badge}`}>
              {riskFactors.filter((r) => r.severity === s).length} {severityConfig[s].label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {riskFactors.map((risk) => {
          const cfg = severityConfig[risk.severity]
          return (
            <div key={risk.id} className={`bg-white rounded-xl border-2 ${cfg.border} p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`}></span>
                    <h3 className="font-semibold text-slate-800 text-sm">{risk.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{risk.category}</span>
                    <span className="text-xs font-semibold text-slate-600">{risk.value}</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.badge}`}>{cfg.label}</span>
              </div>

              <div className="mb-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Evidence Basis</div>
                <p className="text-xs text-slate-600 leading-relaxed">{risk.explanation}</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Recommended Action</div>
                <p className="text-xs text-slate-700 leading-relaxed">{risk.recommendedAction}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
