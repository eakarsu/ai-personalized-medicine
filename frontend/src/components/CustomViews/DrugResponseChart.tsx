import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

type Series = { group: string; points: { day: number; value: number }[] };
type Data = {
  drug: string; metric: string; days: number[]; series: Series[];
  title: string; available_drugs: string[]; disclaimer: string;
};

const COLORS = ['#0d9488', '#f59e0b', '#dc2626', '#3b82f6'];

export default function DrugResponseChart() {
  const [drug, setDrug] = useState('clopidogrel');
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/custom-views/dose-response?drug=${encodeURIComponent(drug)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (e: any) { setErr(e.message); }
    })();
  }, [drug]);

  if (err) return <div className="p-4 text-red-600 text-sm">Chart error: {err}</div>;
  if (!data) return <div className="p-4 text-slate-500 text-sm">Loading chart...</div>;

  const w = 560, h = 240, pad = { l: 50, r: 16, t: 16, b: 32 };
  const allY = data.series.flatMap(s => s.points.map(p => p.value));
  const maxY = Math.max(...allY) * 1.1;
  const maxX = Math.max(...data.days);
  const x = (d: number) => pad.l + (d / maxX) * (w - pad.l - pad.r);
  const y = (v: number) => h - pad.b - (v / maxY) * (h - pad.t - pad.b);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-slate-900">{data.title}</h2>
        </div>
        <select value={drug} onChange={e => setDrug(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1">
          {data.available_drugs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <p className="text-xs text-slate-500 mb-3">Metric: {data.metric}</p>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" data-testid="drug-response-chart">
        {/* axes */}
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#cbd5e1" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#cbd5e1" />
        {/* y ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const v = t * maxY;
          return (
            <g key={t}>
              <line x1={pad.l - 4} y1={y(v)} x2={pad.l} y2={y(v)} stroke="#94a3b8" />
              <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#64748b">{v.toFixed(1)}</text>
            </g>
          );
        })}
        {/* x ticks */}
        {data.days.map(d => (
          <g key={d}>
            <line x1={x(d)} y1={h - pad.b} x2={x(d)} y2={h - pad.b + 4} stroke="#94a3b8" />
            <text x={x(d)} y={h - pad.b + 16} textAnchor="middle" fontSize="10" fill="#64748b">d{d}</text>
          </g>
        ))}
        {/* series */}
        {data.series.map((s, i) => {
          const path = s.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${x(p.day)},${y(p.value)}`).join(' ');
          return (
            <g key={s.group}>
              <path d={path} stroke={COLORS[i % COLORS.length]} strokeWidth={2} fill="none" />
              {s.points.map((p, idx) => (
                <circle key={idx} cx={x(p.day)} cy={y(p.value)} r={3} fill={COLORS[i % COLORS.length]} />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {data.series.map((s, i) => (
          <div key={s.group} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-slate-700">{s.group}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-amber-700 mt-3">{data.disclaimer}</p>
    </div>
  );
}
