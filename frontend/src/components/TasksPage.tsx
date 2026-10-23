import React, { useEffect, useState } from 'react';
const BASE = '/api';
async function req(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
  const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error((data as any).error || 'Request failed'); return data;
}
export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]); const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [title, setTitle] = useState(''); const [insight, setInsight] = useState<any>(null); const [error, setError] = useState('');
  async function load() { try { const d = await req(`/tasks?q=${encodeURIComponent(q)}&status=${status}`); setTasks(d.tasks || []); } catch (e: any) { setError(e.message); } }
  useEffect(() => { load(); }, [q, status]);
  async function create(e: React.FormEvent) { e.preventDefault(); try { await req('/tasks', { method: 'POST', body: JSON.stringify({ title }) }); setTitle(''); load(); } catch (e: any) { setError(e.message); } }
  async function toggle(t: any) { try { await req(`/tasks/${t.id}`, { method: 'PATCH', body: JSON.stringify({ status: t.status === 'DONE' ? 'OPEN' : 'DONE' }) }); load(); } catch (e: any) { setError(e.message); } }
  async function runInsight() { try { const d = await req('/ai-fallback/insights', { method: 'POST', body: JSON.stringify({ kind: 'record-completeness', records: tasks }) }); setInsight(d.result); } catch (e: any) { setError(e.message); } }
  return <div style={{ padding: 16 }}><h1>Staff tasks & offline insights</h1><p>Operational only — not medical advice, no diagnosis. Authenticated tasks with search/filter, CSV/JSON export via Utility, and deterministic fallback (no provider call).</p>
    <label>Search tasks <input aria-label="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} /></label>
    <label> Status <select aria-label="Task status filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option>OPEN</option><option>DONE</option><option>CANCELLED</option></select></label>
    <form onSubmit={create}><label>New task <input aria-label="New task title" value={title} onChange={(e) => setTitle(e.target.value)} required /></label><button type="submit">Create task</button></form>
    {error && <p role="alert">{error}</p>}<p>{tasks.length} task(s) shown</p>
    <ul>{tasks.map((t) => <li key={t.id}><strong>{t.title}</strong> — Status: {t.status} · Priority: {t.priority} <button type="button" onClick={() => toggle(t)}>{t.status === 'DONE' ? 'Reopen' : 'Mark done'}</button></li>)}</ul>
    {!tasks.length && <p>No tasks found. Empty result preserved.</p>}
    <section><h2>Offline insights (deterministic fallback)</h2><button type="button" onClick={runInsight}>Run offline insight</button>
    {insight && <div><p>AI generated: {String(insight.aiGenerated)} · Source: {insight.source}</p><p>{insight.summary}</p><section><h3>Metrics</h3><ul>{insight.metrics.map((m: any) => <li key={m.label}>{m.label}: {String(m.value)}</li>)}</ul></section>{insight.sections.map((s: any) => <section key={s.title}><h3>{s.title}</h3><p>{s.detail}</p></section>)}<p>{insight.disclaimer}</p></div>}</section>
    <p>Export patients: <a href="/api/utility/export/patients.csv">CSV</a> · <a href="/api/utility/export/patients.json">JSON</a> (requires authenticated API; use Utility search for filtered extracts).</p></div>;
}
