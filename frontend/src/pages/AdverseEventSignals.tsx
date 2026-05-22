import { useEffect, useState } from 'react';

export default function AdverseEventSignals() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/adverse-event-signals', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ error: 'Unable to load adverse event signals.' }));
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Adverse Event Signals</h1>
        <p className="text-gray-600">Medication, lab, and genotype-linked safety signal triage.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Metric label="Active Signals" value={data.summary?.activeSignals} />
        <Metric label="Serious Flags" value={data.summary?.seriousFlags} />
        <Metric label="Medications Reviewed" value={data.summary?.medicationsReviewed} />
        <Metric label="Priority" value={data.summary?.reviewPriority} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {data.signals?.map((signal: any) => (
          <div key={signal.medication} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-gray-100">
            <strong>{signal.medication}</strong><span>{signal.signal}</span><span>{signal.severity}</span><span>{signal.action}</span>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-semibold mb-3">Safeguards</h2>
        <ul className="list-disc pl-5 text-gray-700">{data.safeguards?.map((item: string) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return <div className="bg-white border border-gray-200 rounded-xl p-4"><div className="text-sm text-gray-500">{label}</div><div className="text-xl font-semibold text-gray-900">{value}</div></div>;
}
