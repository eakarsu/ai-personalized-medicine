import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Users, FileText, Dna, Pill, FlaskConical, ClipboardPlus, Sparkles, LogOut, Wrench, Database, LayoutDashboard, Droplet, LineChart, Target, BookOpen } from 'lucide-react';

const navItems = [
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
  // Original AI/utility pages
  { path: '/ai-center', label: 'AI Center', icon: Sparkles },
  { path: '/tools', label: 'Tools', icon: Wrench },
  { path: '/sample-data', label: 'Sample Data', icon: Database },
];

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
              <div className="text-xs text-gray-400">Personalized Medicine AI</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
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
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">{user.name?.charAt(0) || 'U'}</div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{user.name || 'User'}</div>
                <div className="text-xs text-gray-500 truncate">{user.role || 'physician'}</div>
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
