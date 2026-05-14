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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
