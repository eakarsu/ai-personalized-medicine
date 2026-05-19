import { useEffect, useState } from 'react';
import { Dna } from 'lucide-react';

type Cell = { patient: string; biomarker?: string; gene?: string; score: number };
type Data = {
  title: string; subtitle: string;
  patients: string[]; biomarkers?: string[]; genes?: string[]; cells: Cell[];
  stats: { min: number; max: number; patient_count: number; biomarker_count?: number; gene_count?: number };
  disclaimer: string;
};

function colorFor(score: number) {
  // teal gradient: lighter -> darker
  const s = Math.max(0, Math.min(1, score));
  const r = Math.round(240 - s * 200);
  const g = Math.round(253 - s * 100);
  const b = Math.round(250 - s * 80);
  return `rgb(${r},${g},${b})`;
}

export default function GenomeHeatmap() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/custom-views/biomarker-heatmap', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (e: any) { setErr(e.message); }
    })();
  }, []);

  if (err) return <div className="p-4 text-red-600 text-sm">Heatmap error: {err}</div>;
  if (!data) return <div className="p-4 text-slate-500 text-sm">Loading heatmap...</div>;

  const columns = data.biomarkers || data.genes || [];
  const cellMap: Record<string, number> = {};
  for (const c of data.cells) {
    const key = c.biomarker || c.gene || '';
    cellMap[`${c.patient}|${key}`] = c.score;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Dna className="w-5 h-5 text-teal-600" />
        <h2 className="font-semibold text-slate-900">{data.title}</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">{data.subtitle} &middot; min {data.stats.min} / max {data.stats.max}</p>

      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 2 }} data-testid="biomarker-heatmap-table">
          <thead>
            <tr>
              <th className="text-xs text-slate-500 px-2 sticky left-0 bg-white"></th>
              {columns.map(g => (
                <th key={g} className="text-[11px] text-slate-600 px-2 py-1 font-medium">{g}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.patients.map(p => (
              <tr key={p}>
                <td className="text-[11px] text-slate-700 px-2 py-1 sticky left-0 bg-white whitespace-nowrap">{p}</td>
                {columns.map(g => {
                  const s = cellMap[`${p}|${g}`] ?? 0;
                  return (
                    <td key={g}
                        title={`${p} / ${g} = ${s}`}
                        style={{ background: colorFor(s), width: 44, height: 28 }}
                        className="text-[10px] text-center text-slate-800 rounded">
                      {s.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
        <span>Low</span>
        <div className="h-3 flex-1 rounded" style={{ background: 'linear-gradient(to right, rgb(240,253,250), rgb(40,153,170))' }} />
        <span>High</span>
      </div>
      <p className="text-[11px] text-amber-700 mt-3">{data.disclaimer}</p>
    </div>
  );
}
