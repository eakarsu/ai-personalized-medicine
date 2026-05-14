import { useState } from 'react'

const patients = [
  {
    id: 1,
    name: 'James Thornton',
    dob: '1971-03-14',
    age: 55,
    healthScore: 72,
    bmi: 27.4,
    heartRisk: 18,
    cancerRisk: 9,
    diabetesRisk: 22,
    alerts: [
      { type: 'warning', text: 'LDL cholesterol elevated (148 mg/dL) — review statin therapy' },
      { type: 'info', text: 'Annual colonoscopy due in 3 months' },
      { type: 'critical', text: 'Blood pressure trending up (avg 138/88 over 30 days)' },
    ],
  },
  {
    id: 2,
    name: 'Maria Santos',
    dob: '1988-07-22',
    age: 37,
    healthScore: 91,
    bmi: 22.1,
    heartRisk: 4,
    cancerRisk: 6,
    diabetesRisk: 7,
    alerts: [
      { type: 'info', text: 'BRCA1 variant detected — schedule genetic counseling' },
      { type: 'info', text: 'Vitamin D levels low (18 ng/mL)' },
    ],
  },
  {
    id: 3,
    name: 'Robert Chen',
    dob: '1958-11-05',
    age: 67,
    healthScore: 58,
    bmi: 31.2,
    heartRisk: 34,
    cancerRisk: 14,
    diabetesRisk: 41,
    alerts: [
      { type: 'critical', text: 'HbA1c at 7.2% — diabetes management review needed' },
      { type: 'critical', text: 'Cardiac stress test overdue by 6 months' },
      { type: 'warning', text: 'Metformin dosage may need adjustment based on eGFR decline' },
      { type: 'info', text: 'Annual eye exam scheduled for next week' },
    ],
  },
]

const alertColors: Record<string, string> = {
  critical: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

const alertDot: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

function HealthScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-800">{score}</span>
        <span className="text-xs text-slate-500 font-medium">Health Score</span>
      </div>
    </div>
  )
}

export default function PatientDashboard() {
  const [selectedId, setSelectedId] = useState(1)
  const patient = patients.find((p) => p.id === selectedId)!

  return (
    <div className="space-y-6">
      {/* Patient selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">Active Patient</label>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name} (Age {p.age})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Health score ring */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
          <HealthScoreRing score={patient.healthScore} />
          <div className="mt-3 text-center">
            <div className="font-bold text-slate-900">{patient.name}</div>
            <div className="text-sm text-slate-500">DOB: {patient.dob} · Age {patient.age}</div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Key Health Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'BMI', value: patient.bmi.toString(), unit: 'kg/m²', status: patient.bmi > 30 ? 'high' : patient.bmi > 25 ? 'moderate' : 'normal' },
              { label: 'Heart Disease Risk', value: `${patient.heartRisk}%`, unit: '10-yr risk', status: patient.heartRisk > 20 ? 'high' : patient.heartRisk > 10 ? 'moderate' : 'normal' },
              { label: 'Cancer Risk', value: `${patient.cancerRisk}%`, unit: 'composite', status: patient.cancerRisk > 15 ? 'high' : patient.cancerRisk > 8 ? 'moderate' : 'normal' },
              { label: 'Diabetes Risk', value: `${patient.diabetesRisk}%`, unit: '5-yr risk', status: patient.diabetesRisk > 30 ? 'high' : patient.diabetesRisk > 15 ? 'moderate' : 'normal' },
            ].map((m) => {
              const colors: Record<string, string> = {
                high: 'text-red-600 bg-red-50 border-red-200',
                moderate: 'text-amber-600 bg-amber-50 border-amber-200',
                normal: 'text-green-600 bg-green-50 border-green-200',
              }
              return (
                <div key={m.label} className={`rounded-xl border p-4 ${colors[m.status]}`}>
                  <div className="text-xs font-medium opacity-70 mb-1">{m.label}</div>
                  <div className="text-2xl font-bold">{m.value}</div>
                  <div className="text-xs opacity-60 mt-0.5">{m.unit}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Alerts & Notifications</h3>
        <div className="space-y-2">
          {patient.alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${alertColors[alert.type]}`}>
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${alertDot[alert.type]}`}></span>
              <span className="text-sm">{alert.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
