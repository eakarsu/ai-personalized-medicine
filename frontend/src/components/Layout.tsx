import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Users, FileText, Dna, Pill, FlaskConical, ClipboardPlus, Sparkles, LogOut, Wrench, Database, LayoutDashboard, Droplet, LineChart, Target, BookOpen, Activity, ShieldCheck } from 'lucide-react';

const navItems = [
  { path: '/clinical-workflow', label: 'Clinical Workflow', icon: ShieldCheck, governed: true },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/health-records', label: 'Health Records', icon: FileText },
  { path: '/genome-markers', label: 'Genome Markers', icon: Dna },
  { path: '/medications', label: 'Medications', icon: Pill },
  { path: '/lab-results', label: 'Lab Results', icon: FlaskConical },
  { path: '/recommendations', label: 'Treatment Plans', icon: ClipboardPlus },
  // Deep audit features (2026-05-14)
  { path: '/pgx-cpic', label: 'CPIC PGx', icon: Pill },
  { path: '/variant-acmg', label: 'ACMG Variants', icon: BookOpen },
  { path: '/prs', label: 'Polygenic Risk', icon: LineChart },
  { path: '/trial-matcher', label: 'Trial Matcher', icon: Target },
  { path: '/warfarin-iwpc', label: 'Warfarin IWPC', icon: Droplet },
  { path: '/custom-views', label: 'Patient Views', icon: Sparkles },
  // Pass 7: previously-scaffolded gap-ai pages now wired into nav
  { path: '/gap/lab-trend-detector', label: 'Lab Trend Detector', icon: LineChart },
  { path: '/gap/dose-personalizer', label: 'Dose Personalizer', icon: Pill },
  { path: '/gap/wearable-stream-analyzer', label: 'Wearable Stream', icon: Activity },
  { path: '/gap/genome-therapy-designer', label: 'Genome Therapy', icon: Dna },
  { path: '/gap/ehr-summarize', label: 'EHR Summarize', icon: FileText },
  // Pass 7: previously-scaffolded gap-nonai pages now wired into nav
  { path: '/gap/wearables-integration', label: 'Wearables Integration', icon: Activity },
  { path: '/gap/fhir-connector', label: 'FHIR Connector', icon: ShieldCheck },
  { path: '/gap/hipaa-audit', label: 'HIPAA Audit', icon: ShieldCheck },
  { path: '/gap/consent-management', label: 'Consent Mgmt', icon: ShieldCheck },
  { path: '/gap/clinician-roles', label: 'Clinician Roles', icon: Users },
  // Pass 7: custom-feature pages now wired into nav
  { path: '/cf/mrna-n-of-1', label: 'mRNA n-of-1', icon: Dna },
  { path: '/cf/wearable-fusion', label: 'Wearable Fusion', icon: Activity },
  { path: '/cf/trial-autofill', label: 'Trial Autofill', icon: Target },
  { path: '/cf/pharmacogenomics', label: 'PGx-Aware Rx', icon: Pill },
  { path: '/cf/longitudinal-twin', label: 'Digital Twin', icon: LineChart },
  // Pass 7: structured consent + HIPAA field-level access
  { path: '/consents', label: 'Consents', icon: ShieldCheck },
  { path: '/field-access-log', label: 'Field Access Log', icon: ShieldCheck },
  { path: '/adverse-event-signals', label: 'Adverse Events', icon: Activity },
  // Original AI/utility pages
  { path: '/ai-center', label: 'AI Center', icon: Sparkles },
  { path: '/tools', label: 'Tools', icon: Wrench },
  { path: '/sample-data', label: 'Sample Data', icon: Database },
];
const generatedFeatures = import.meta.env.DEV && import.meta.env.VITE_ENABLE_GENERATED_FEATURES === 'true';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white">MedInsight</div>
              <div className="text-xs text-gray-400">Governed clinical operations</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.governed || generatedFeatures).map(item => {
            const active = pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">{user.email?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{user.email || 'User'}</div>
                <div className="text-xs text-gray-500 truncate">{user.role || 'clinical identity'}</div>
              </div>
            </div>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
