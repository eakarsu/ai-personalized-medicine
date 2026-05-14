const patient = {
  name: 'James Thornton',
  dob: '1971-03-14',
  age: 55,
  sex: 'Male',
  ethnicity: 'Caucasian',
  height: '5\'11"',
  weight: '196 lbs',
  bloodType: 'O+',
  genomeMarkers: [
    { gene: 'APOE', variant: 'ε3/ε4', significance: 'Elevated Alzheimer\'s risk' },
    { gene: 'MTHFR', variant: 'C677T heterozygous', significance: 'Moderate folate metabolism impact' },
    { gene: 'CYP2C19', variant: '*1/*2', significance: 'Intermediate clopidogrel metabolizer' },
    { gene: 'BRCA2', variant: 'Wild type', significance: 'No elevated cancer risk from this gene' },
    { gene: 'TCF7L2', variant: 'rs7903146 T/C', significance: 'Slightly elevated T2D susceptibility' },
  ],
  wearable: {
    stepsPerDay: 6420,
    sleepHrs: 6.2,
    restingHR: 72,
    hrv: 38,
    lastSync: '2026-05-05 07:02',
  },
  medicalHistory: [
    'Hypertension (diagnosed 2018, managed)',
    'Hyperlipidemia (diagnosed 2020)',
    'Appendectomy (2003)',
    'Mild sleep apnea (CPAP therapy since 2022)',
    'Pre-diabetes (2024, diet-controlled)',
  ],
  medications: [
    { name: 'Lisinopril', dose: '10mg', frequency: 'Once daily', since: '2018' },
    { name: 'Atorvastatin', dose: '20mg', frequency: 'Once daily (evening)', since: '2020' },
    { name: 'Aspirin', dose: '81mg', frequency: 'Once daily', since: '2021' },
    { name: 'Vitamin D3', dose: '2000 IU', frequency: 'Once daily', since: '2023' },
  ],
}

export default function HealthProfile() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-5">
        {/* Demographics */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Demographics</h3>
          <div className="space-y-2">
            {[
              { label: 'Full Name', val: patient.name },
              { label: 'Date of Birth', val: patient.dob },
              { label: 'Age', val: `${patient.age} years` },
              { label: 'Sex', val: patient.sex },
              { label: 'Ethnicity', val: patient.ethnicity },
              { label: 'Height', val: patient.height },
              { label: 'Weight', val: patient.weight },
              { label: 'Blood Type', val: patient.bloodType },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-slate-500">{f.label}</span>
                <span className="font-medium text-slate-800">{f.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wearable data */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Wearable Data</h3>
          <div className="space-y-3">
            {[
              { label: 'Steps/Day', val: patient.wearable.stepsPerDay.toLocaleString(), target: '10,000', pct: (patient.wearable.stepsPerDay / 10000) * 100 },
              { label: 'Sleep (hrs)', val: patient.wearable.sleepHrs.toString(), target: '8.0 hrs', pct: (patient.wearable.sleepHrs / 8) * 100 },
              { label: 'Resting HR', val: `${patient.wearable.restingHR} bpm`, target: '<70 bpm', pct: Math.min(100, (70 / patient.wearable.restingHR) * 100) },
              { label: 'HRV', val: `${patient.wearable.hrv} ms`, target: '>40 ms', pct: Math.min(100, (patient.wearable.hrv / 40) * 100) },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">{m.label}</span>
                  <span className="font-semibold text-slate-800">{m.val}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.pct >= 90 ? 'bg-green-500' : m.pct >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(100, m.pct)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Target: {m.target}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-400">Last sync: {patient.wearable.lastSync}</div>
        </div>

        {/* Genome markers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Genome Markers</h3>
          <div className="space-y-2">
            {patient.genomeMarkers.map((g) => (
              <div key={g.gene} className="bg-slate-50 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{g.gene}</span>
                  <span className="text-xs text-slate-600 font-medium">{g.variant}</span>
                </div>
                <div className="text-xs text-slate-500">{g.significance}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Medical history */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Medical History</h3>
          <ul className="space-y-2">
            {patient.medicalHistory.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Current medications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Current Medications</h3>
          <div className="space-y-2">
            {patient.medications.map((m) => (
              <div key={m.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-800">{m.name} <span className="text-slate-400 font-normal">{m.dose}</span></div>
                  <div className="text-xs text-slate-500">{m.frequency}</div>
                </div>
                <span className="text-xs text-slate-400">Since {m.since}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
