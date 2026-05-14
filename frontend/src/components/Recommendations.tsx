type Category = 'lifestyle' | 'medication' | 'screening' | 'genetic'
type Urgency = 'urgent' | 'soon' | 'routine'

interface Recommendation {
  id: number
  title: string
  category: Category
  description: string
  urgency: Urgency
  priority: number
}

const recommendations: Recommendation[] = [
  {
    id: 1,
    title: 'Intensify Statin Therapy',
    category: 'medication',
    description: 'Increase atorvastatin from 20mg to 40mg daily to achieve LDL target below 100 mg/dL. Current LDL of 148 mg/dL is above guideline targets given your cardiovascular risk profile. Monitor liver enzymes at 12-week follow-up.',
    urgency: 'urgent',
    priority: 1,
  },
  {
    id: 2,
    title: 'Blood Pressure Optimization',
    category: 'medication',
    description: 'Add amlodipine 5mg once daily to your current lisinopril regimen. Wearable data shows persistent BP above 135/85 despite current therapy. Target systolic below 130 mmHg per ACC/AHA guidelines for your risk level.',
    urgency: 'urgent',
    priority: 2,
  },
  {
    id: 3,
    title: 'Structured Exercise Program',
    category: 'lifestyle',
    description: 'Begin supervised cardiovascular exercise: 150 minutes moderate-intensity aerobic activity per week (e.g., brisk walking 30 min/day, 5 days/week). This addresses prediabetes, hypertension, BMI, and cognitive risk simultaneously.',
    urgency: 'urgent',
    priority: 3,
  },
  {
    id: 4,
    title: 'Colonoscopy Scheduling',
    category: 'screening',
    description: 'Schedule colonoscopy within 3 months. Last procedure was 8 years ago (age 47). Current guidelines recommend repeat every 10 years for average-risk patients; due to your elevated ASCVD risk profile, earlier repeat is appropriate.',
    urgency: 'soon',
    priority: 4,
  },
  {
    id: 5,
    title: 'Mediterranean Diet Adoption',
    category: 'lifestyle',
    description: 'Transition to Mediterranean dietary pattern: emphasize olive oil, fish (3x/week), legumes, vegetables, nuts, and whole grains. Reduce red meat to <1x/week and sodium to <2,300 mg/day. Evidence shows 30% reduction in MACE events.',
    urgency: 'soon',
    priority: 5,
  },
  {
    id: 6,
    title: 'CPAP Compliance Optimization',
    category: 'lifestyle',
    description: 'Increase CPAP compliance from current 68% to >85% of nights. Sleep apnea treatment improves BP control, reduces insulin resistance, and addresses the absent nocturnal dipping pattern seen in your wearable data.',
    urgency: 'soon',
    priority: 6,
  },
  {
    id: 7,
    title: 'Genetic Counseling — APOE ε4',
    category: 'genetic',
    description: 'Schedule genetic counseling session to discuss APOE ε4 heterozygous carrier status. Counselor will review cognitive monitoring options, lifestyle modifications with strongest evidence for risk reduction (FINGER protocol), and family screening recommendations.',
    urgency: 'routine',
    priority: 7,
  },
  {
    id: 8,
    title: 'Annual Cognitive Screening',
    category: 'screening',
    description: 'Establish baseline MoCA (Montreal Cognitive Assessment) this year and repeat annually. Given APOE ε4 status and sleep deficit, early detection of subtle cognitive changes enables timely intervention.',
    urgency: 'routine',
    priority: 8,
  },
]

const categoryConfig: Record<Category, { label: string; classes: string }> = {
  lifestyle: { label: 'Lifestyle', classes: 'bg-green-100 text-green-800' },
  medication: { label: 'Medication', classes: 'bg-blue-100 text-blue-800' },
  screening: { label: 'Screening', classes: 'bg-purple-100 text-purple-800' },
  genetic: { label: 'Genetic', classes: 'bg-rose-100 text-rose-800' },
}

const urgencyConfig: Record<Urgency, { label: string; classes: string; border: string }> = {
  urgent: { label: 'Urgent', classes: 'bg-red-100 text-red-800', border: 'border-l-red-500' },
  soon: { label: 'Soon', classes: 'bg-amber-100 text-amber-800', border: 'border-l-amber-500' },
  routine: { label: 'Routine', classes: 'bg-slate-100 text-slate-700', border: 'border-l-slate-400' },
}

export default function Recommendations() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Treatment Recommendations</h2>
          <p className="text-sm text-slate-500">Sorted by priority for James Thornton</p>
        </div>
        <div className="flex gap-2 text-xs">
          {(['urgent', 'soon', 'routine'] as Urgency[]).map((u) => (
            <span key={u} className={`px-2.5 py-1 rounded-full font-medium ${urgencyConfig[u].classes}`}>
              {recommendations.filter((r) => r.urgency === u).length} {urgencyConfig[u].label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const cat = categoryConfig[rec.category]
          const urg = urgencyConfig[rec.urgency]
          return (
            <div key={rec.id} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${urg.border} p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-xs font-bold text-slate-400">#{rec.priority}</span>
                    <h3 className="font-semibold text-slate-900 text-sm">{rec.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.classes}`}>{cat.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urg.classes}`}>{urg.label}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{rec.description}</p>
                </div>
                <button className="ml-5 shrink-0 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
