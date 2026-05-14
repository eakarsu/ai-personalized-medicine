import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Pill, FlaskConical, ClipboardPlus, Dna,
  Sparkles, Database, AlertTriangle, Activity, Loader2,
} from 'lucide-react';
import { api } from '../api';

type Stats = {
  kpis: {
    patients: number;
    active_medications: number;
    lab_results_this_week: number;
    pending_recommendations: number;
    genome_markers: number;
  };
  recent_activity: Array<{
    id: number;
    user_email: string | null;
    action: string;
    target: string | null;
    meta: any;
    created_at: string;
  }>;
  synthetic_notice?: string;
  disclaimer?: string;
};

const KPI_CARDS = [
  { key: 'patients', label: 'Patients', icon: Users, color: 'text-teal-700', bg: 'bg-teal-50' },
  { key: 'active_medications', label: 'Active Medications', icon: Pill, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { key: 'lab_results_this_week', label: 'Lab Results (7d)', icon: FlaskConical, color: 'text-sky-700', bg: 'bg-sky-50' },
  { key: 'pending_recommendations', label: 'Pending Recommendations', icon: ClipboardPlus, color: 'text-amber-700', bg: 'bg-amber-50' },
  { key: 'genome_markers', label: 'Genome Markers', icon: Dna, color: 'text-purple-700', bg: 'bg-purple-50' },
] as const;

const QUICK_ACTIONS = [
  { path: '/ai-center', label: 'AI Center', icon: Sparkles, hint: 'Run AI tools (results are not medical advice).' },
  { path: '/patients', label: 'Patients', icon: Users, hint: 'Manage patient records.' },
  { path: '/recommendations', label: 'Recommendations', icon: ClipboardPlus, hint: 'Review treatment recommendations.' },
  { path: '/sample-data', label: 'Sample Data', icon: Database, hint: 'Seed synthetic demo data.' },
];

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch { return iso; }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.dashboardStats()
      .then((r) => { if (!cancelled) setStats(r as Stats); })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load dashboard'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-teal-600" /> Dashboard
        </h2>
        <p className="text-gray-500 text-sm mt-1">Overview of your MedInsight workspace.</p>
      </div>

      {/* Synthetic / disclaimer banner */}
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Synthetic data only — for demo use.</strong> All metrics, names, and clinical values are fabricated. Not medical advice — consult a clinician.
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {KPI_CARDS.map((c) => {
          const value = stats?.kpis?.[c.key as keyof Stats['kpis']];
          return (
            <div key={c.key} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center mb-2`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (value ?? 0)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-xl p-4 text-left transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <a.icon className="w-4 h-4 text-teal-600" />
                <div className="font-semibold text-gray-900 text-sm">{a.label}</div>
              </div>
              <div className="text-xs text-gray-500">{a.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" /> Recent activity
        </h3>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {error && (
            <div className="p-4 text-sm text-red-600">{error}</div>
          )}
          {!error && loading && (
            <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading activity...
            </div>
          )}
          {!error && !loading && (!stats?.recent_activity || stats.recent_activity.length === 0) && (
            <div className="p-4 text-sm text-gray-500">No audit activity yet. Use the AI Center or Sample Data to generate events.</div>
          )}
          {!error && !loading && stats?.recent_activity && stats.recent_activity.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {stats.recent_activity.map((row) => (
                <li key={row.id} className="px-4 py-3 text-sm flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-900 truncate">
                      <span className="font-medium">{row.action}</span>
                      {row.target && <span className="text-gray-500"> · {row.target}</span>}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {row.user_email || 'system'} · {fmtTime(row.created_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Recent activity is sourced from the <code>audit_log</code> table. Synthetic data only — for demo use.
        </div>
      </div>
    </div>
  );
}
