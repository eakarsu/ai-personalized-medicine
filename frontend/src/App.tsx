import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import PatientsPage from './components/Patients/PatientsPage';
import HealthRecordsPage from './components/HealthRecords/HealthRecordsPage';
import GenomeMarkersPage from './components/GenomeMarkers/GenomeMarkersPage';
import MedicationsPage from './components/Medications/MedicationsPage';
import LabResultsPage from './components/LabResults/LabResultsPage';
import RecommendationsPage from './components/Recommendations/RecommendationsPage';
import AICenter from './components/AICenter';
import ToolsPage from './components/Tools/ToolsPage';
import SampleDataPage from './components/SampleData/SampleDataPage';
import Dashboard from './components/Dashboard';
// Deep audit features (2026-05-14)
import PgxCpic from './pages/PgxCpic';
import VariantAcmg from './pages/VariantAcmg';
import PrsDashboard from './pages/PrsDashboard';
import TrialMatcher from './pages/TrialMatcher';
import WarfarinIwpc from './pages/WarfarinIwpc';
import CustomViewsPage from './components/CustomViews/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

// Pass 7: gap-ai pages
import GapLabTrendDetector from './pages/GapLabTrendDetector';
import GapDosePersonalizer from './pages/GapDosePersonalizer';
import GapWearableStreamAnalyzer from './pages/GapWearableStreamAnalyzer';
import GapGenomeTherapyDesigner from './pages/GapGenomeTherapyDesigner';
import GapEhrSummarize from './pages/GapEhrSummarize';
// Pass 7: gap-nonai pages
import GapWearablesIntegration from './pages/GapWearablesIntegration';
import GapFhirConnector from './pages/GapFhirConnector';
import GapHipaaAudit from './pages/GapHipaaAudit';
import GapConsentManagement from './pages/GapConsentManagement';
import GapClinicianRoles from './pages/GapClinicianRoles';
// Pass 7: cf (custom feature) pages
import CfMrnaNOf1 from './pages/CfMrnaNOf1';
import CfWearableFusion from './pages/CfWearableFusion';
import CfTrialAutofill from './pages/CfTrialAutofill';
import CfPharmacogenomics from './pages/CfPharmacogenomics';
import CfLongitudinalTwin from './pages/CfLongitudinalTwin';
// Pass 7: new structured pages
import ConsentsPage from './pages/ConsentsPage';
import FieldAccessLogPage from './pages/FieldAccessLogPage';
import AdverseEventSignals from './pages/AdverseEventSignals';
import GovernedClinicalPage from './pages/GovernedClinicalPage';

const generatedFeatures = import.meta.env.DEV && import.meta.env.VITE_ENABLE_GENERATED_FEATURES === 'true';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {generatedFeatures && <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />}
        {generatedFeatures && <Route path="/codex/operations" element={<CodexOperationsFeature />} />}

        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/clinical-workflow" replace />} />
                <Route path="/clinical-workflow" element={<GovernedClinicalPage />} />
                {generatedFeatures && <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/health-records" element={<HealthRecordsPage />} />
                <Route path="/genome-markers" element={<GenomeMarkersPage />} />
                <Route path="/medications" element={<MedicationsPage />} />
                <Route path="/lab-results" element={<LabResultsPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/ai-center" element={<AICenter />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/sample-data" element={<SampleDataPage />} />
                {/* Deep audit features (2026-05-14) */}
                <Route path="/pgx-cpic" element={<PgxCpic />} />
                <Route path="/variant-acmg" element={<VariantAcmg />} />
                <Route path="/prs" element={<PrsDashboard />} />
                <Route path="/trial-matcher" element={<TrialMatcher />} />
                <Route path="/warfarin-iwpc" element={<WarfarinIwpc />} />
                <Route path="/custom-views" element={<CustomViewsPage />} />
                {/* Pass 7: wire previously-scaffolded gap-ai pages */}
                <Route path="/gap/lab-trend-detector" element={<GapLabTrendDetector />} />
                <Route path="/gap/dose-personalizer" element={<GapDosePersonalizer />} />
                <Route path="/gap/wearable-stream-analyzer" element={<GapWearableStreamAnalyzer />} />
                <Route path="/gap/genome-therapy-designer" element={<GapGenomeTherapyDesigner />} />
                <Route path="/gap/ehr-summarize" element={<GapEhrSummarize />} />
                {/* Pass 7: wire previously-scaffolded gap-nonai pages */}
                <Route path="/gap/wearables-integration" element={<GapWearablesIntegration />} />
                <Route path="/gap/fhir-connector" element={<GapFhirConnector />} />
                <Route path="/gap/hipaa-audit" element={<GapHipaaAudit />} />
                <Route path="/gap/consent-management" element={<GapConsentManagement />} />
                <Route path="/gap/clinician-roles" element={<GapClinicianRoles />} />
                {/* Pass 7: wire previously-scaffolded custom-feature pages */}
                <Route path="/cf/mrna-n-of-1" element={<CfMrnaNOf1 />} />
                <Route path="/cf/wearable-fusion" element={<CfWearableFusion />} />
                <Route path="/cf/trial-autofill" element={<CfTrialAutofill />} />
                <Route path="/cf/pharmacogenomics" element={<CfPharmacogenomics />} />
                <Route path="/cf/longitudinal-twin" element={<CfLongitudinalTwin />} />
                {/* Pass 7: structured consent + HIPAA field-level access */}
                <Route path="/consents" element={<ConsentsPage />} />
                <Route path="/field-access-log" element={<FieldAccessLogPage />} />
                <Route path="/adverse-event-signals" element={<AdverseEventSignals />} />
                </>}
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
