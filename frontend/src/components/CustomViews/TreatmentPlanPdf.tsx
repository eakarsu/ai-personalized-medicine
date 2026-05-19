import { useEffect, useState } from 'react';
import { FileDown, FileText } from 'lucide-react';

type Report = {
  patient: string; condition: string; generated_at: string;
  format: string; download_filename: string; html: string;
  summary: { variants: number; pgx_recommendations: number; risk_scores: number };
  disclaimer: string;
};

const PATIENTS = ['P-1042 Alvarez', 'P-1088 Becker', 'P-1153 Chen', 'P-1207 Dubois'];
const CONDITIONS = ['Stage II ER+ Breast Cancer', 'Atrial Fibrillation', 'Type 2 Diabetes', 'Major Depression'];

export default function TreatmentPlanPdf() {
  const [patient, setPatient] = useState(PATIENTS[0]);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true); setErr('');
    try {
      const res = await fetch(`/api/custom-views/genomic-report?patient=${encodeURIComponent(patient)}&condition=${encodeURIComponent(condition)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReport(await res.json());
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function download() {
    if (!report) return;
    const blob = new Blob([report.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = report.download_filename;
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  }

  function printPdf() {
    if (!report) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(report.html);
    w.document.close();
    setTimeout(() => w.print(), 250);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-teal-600" />
        <h2 className="font-semibold text-slate-900">Patient Genomic Report (PDF-ready)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <label className="text-xs text-slate-600">Patient
          <select value={patient} onChange={e => setPatient(e.target.value)}
                  className="mt-1 w-full text-sm border border-slate-300 rounded px-2 py-1">
            {PATIENTS.map(p => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-600">Indication
          <select value={condition} onChange={e => setCondition(e.target.value)}
                  className="mt-1 w-full text-sm border border-slate-300 rounded px-2 py-1">
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={load} disabled={loading}
                className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50">
          {loading ? 'Generating...' : 'Regenerate'}
        </button>
        <button onClick={download} disabled={!report}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-800 rounded hover:bg-slate-200 inline-flex items-center gap-1 disabled:opacity-50">
          <FileDown className="w-4 h-4" /> Download HTML
        </button>
        <button onClick={printPdf} disabled={!report}
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-800 rounded hover:bg-slate-200 disabled:opacity-50">
          Print to PDF
        </button>
      </div>

      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}

      {report && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-teal-50 border border-teal-200 rounded p-2">
            <div className="text-xs text-teal-700">Variants</div>
            <div className="text-lg font-bold text-teal-900">{report.summary.variants}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <div className="text-xs text-amber-700">PGx Guidance</div>
            <div className="text-lg font-bold text-amber-900">{report.summary.pgx_recommendations}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="text-xs text-blue-700">Risk Scores</div>
            <div className="text-lg font-bold text-blue-900">{report.summary.risk_scores}</div>
          </div>
        </div>
      )}

      {report && (
        <div className="border border-slate-200 rounded overflow-hidden">
          <iframe srcDoc={report.html} title="Genomic report preview"
                  data-testid="genomic-report-preview"
                  className="w-full" style={{ height: 360, background: 'white' }} />
        </div>
      )}

      {report && <p className="text-[11px] text-amber-700 mt-3">{report.disclaimer}</p>}
    </div>
  );
}
