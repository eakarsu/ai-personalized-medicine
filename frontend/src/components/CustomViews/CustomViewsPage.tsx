import { Sparkles } from 'lucide-react';
import GenomeHeatmap from './GenomeHeatmap';
import DrugResponseChart from './DrugResponseChart';
import TreatmentPlanPdf from './TreatmentPlanPdf';
import TreatmentProtocolEditor from './TreatmentProtocolEditor';

export default function CustomViewsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="custom-views-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-600" /> Patient Views
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Four precision-medicine views — biomarker heatmap, genotype-stratified dose-response curves,
          a printable patient genomic report, and a treatment protocol editor.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-900">
        All data on this page is synthetic. Not medical advice — verify with clinical sources before use.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenomeHeatmap />
        <DrugResponseChart />
        <TreatmentPlanPdf />
        <TreatmentProtocolEditor />
      </div>
    </div>
  );
}
