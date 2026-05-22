const BASE = '/api';
function getToken() { return localStorage.getItem('token') || ''; }
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...authHeaders(), ...(options?.headers || {}) } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Request failed' })); throw new Error(err.error || 'Request failed'); }
  return res.json();
}
export const api = {
  login: (email: string, password: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<any>('/auth/me'),
  getPatients: () => request<any[]>('/patients'),
  getPatient: (id: number) => request<any>(`/patients/${id}`),
  createPatient: (d: any) => request<any>('/patients', { method: 'POST', body: JSON.stringify(d) }),
  updatePatient: (id: number, d: any) => request<any>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deletePatient: (id: number) => request<any>(`/patients/${id}`, { method: 'DELETE' }),
  getHealthRecords: () => request<any[]>('/health-records'),
  getHealthRecord: (id: number) => request<any>(`/health-records/${id}`),
  createHealthRecord: (d: any) => request<any>('/health-records', { method: 'POST', body: JSON.stringify(d) }),
  updateHealthRecord: (id: number, d: any) => request<any>(`/health-records/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteHealthRecord: (id: number) => request<any>(`/health-records/${id}`, { method: 'DELETE' }),
  getGenomeMarkers: () => request<any[]>('/genome-markers'),
  getGenomeMarker: (id: number) => request<any>(`/genome-markers/${id}`),
  createGenomeMarker: (d: any) => request<any>('/genome-markers', { method: 'POST', body: JSON.stringify(d) }),
  updateGenomeMarker: (id: number, d: any) => request<any>(`/genome-markers/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteGenomeMarker: (id: number) => request<any>(`/genome-markers/${id}`, { method: 'DELETE' }),
  getMedications: () => request<any[]>('/medications'),
  getMedication: (id: number) => request<any>(`/medications/${id}`),
  createMedication: (d: any) => request<any>('/medications', { method: 'POST', body: JSON.stringify(d) }),
  updateMedication: (id: number, d: any) => request<any>(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteMedication: (id: number) => request<any>(`/medications/${id}`, { method: 'DELETE' }),
  getLabResults: () => request<any[]>('/lab-results'),
  getLabResult: (id: number) => request<any>(`/lab-results/${id}`),
  createLabResult: (d: any) => request<any>('/lab-results', { method: 'POST', body: JSON.stringify(d) }),
  updateLabResult: (id: number, d: any) => request<any>(`/lab-results/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteLabResult: (id: number) => request<any>(`/lab-results/${id}`, { method: 'DELETE' }),
  getRecommendations: () => request<any[]>('/recommendations'),
  getRecommendation: (id: number) => request<any>(`/recommendations/${id}`),
  createRecommendation: (d: any) => request<any>('/recommendations', { method: 'POST', body: JSON.stringify(d) }),
  updateRecommendation: (id: number, d: any) => request<any>(`/recommendations/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteRecommendation: (id: number) => request<any>(`/recommendations/${id}`, { method: 'DELETE' }),
  patientRisk: (d: any) => request<any>('/ai/patient-risk', { method: 'POST', body: JSON.stringify(d) }),
  genomicInsights: (d: any) => request<any>('/ai/genomic-insights', { method: 'POST', body: JSON.stringify(d) }),
  medicationAnalysis: (d: any) => request<any>('/ai/medication-analysis', { method: 'POST', body: JSON.stringify(d) }),
  treatmentPlan: (d: any) => request<any>('/ai/treatment-plan', { method: 'POST', body: JSON.stringify(d) }),
  // New AI features
  drugInteraction: (d: any) => request<any>('/ai/drug-interaction', { method: 'POST', body: JSON.stringify(d) }),
  treatmentResponse: (d: any) => request<any>('/ai/treatment-response', { method: 'POST', body: JSON.stringify(d) }),
  biomarkerPattern: (d: any) => request<any>('/ai/biomarker-pattern', { method: 'POST', body: JSON.stringify(d) }),
  clinicalTrialMatch: (d: any) => request<any>('/ai/clinical-trial-match', { method: 'POST', body: JSON.stringify(d) }),
  adverseEventWarning: (d: any) => request<any>('/ai/adverse-event-warning', { method: 'POST', body: JSON.stringify(d) }),
  // Utility features
  utilityResources: () => request<any>('/utility/resources'),
  utilitySearch: (resource: string, q: string, filters: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    for (const [k, v] of Object.entries(filters)) if (v) params.set(`filter[${k}]`, v);
    return request<any>(`/utility/search/${resource}?${params.toString()}`);
  },
  utilityExportCsvUrl: (resource: string) => `/api/utility/export/${resource}.csv`,
  utilityAuditLog: (params: Record<string, string> = {}) => {
    const sp = new URLSearchParams(params);
    return request<any>(`/utility/audit-log?${sp.toString()}`);
  },
  utilityCreateAudit: (d: { action: string; target?: string; meta?: any }) => request<any>('/utility/audit-log', { method: 'POST', body: JSON.stringify(d) }),
  // Sample data (admin)
  sampleDataEntities: () => request<{ entities: { key: string; label: string }[] }>('/admin/sample-data/entities'),
  insertSampleData: (entity: string) => request<{ inserted: number; entity: string }>(`/admin/sample-data/${entity}`, { method: 'POST' }),
  // Dashboard
  dashboardStats: () => request<any>('/dashboard/stats'),

  // ---- Audit features (2026-05-14) ----
  // PGx CPIC
  pgxDiplotypes: () => request<any[]>('/pgx-cpic/diplotypes'),
  pgxDiplotypesByPatient: (id: number) => request<any[]>(`/pgx-cpic/diplotypes/${id}`),
  pgxRules: () => request<any[]>('/pgx-cpic/rules'),
  pgxCheck: (patient_id: number, drug: string) => request<any>(`/pgx-cpic/check?patient_id=${patient_id}&drug=${encodeURIComponent(drug)}`),
  pgxCoverage: (id: number) => request<any>(`/pgx-cpic/coverage/${id}`),
  // ACMG
  acmgList: (params: Record<string,string> = {}) => {
    const sp = new URLSearchParams(params); return request<any[]>(`/variant-acmg?${sp.toString()}`);
  },
  acmgGlossary: () => request<any>('/variant-acmg/criteria/glossary'),
  acmgStats: () => request<any>('/variant-acmg/stats'),
  acmgClassify: (criteria: Record<string, boolean>) => request<any>('/variant-acmg/classify', { method: 'POST', body: JSON.stringify({ criteria }) }),
  // PRS
  prsAll: () => request<any[]>('/prs'),
  prsPatient: (id: number) => request<any>(`/prs/patient/${id}`),
  prsTrait: (trait: string) => request<any>(`/prs/trait/${encodeURIComponent(trait)}`),
  prsLeaderboard: (n = 5) => request<any>(`/prs/leaderboard?n=${n}`),
  prsScreening: (id: number) => request<any>(`/prs/screening/${id}`),
  // Trials
  trialsList: (params: Record<string,string> = {}) => {
    const sp = new URLSearchParams(params); return request<any[]>(`/trial-matcher/trials?${sp.toString()}`);
  },
  trialMatch: (id: number) => request<any>(`/trial-matcher/match/${id}`),
  trialStats: () => request<any>('/trial-matcher/stats'),
  // Warfarin
  warfarinPredict: (input: any) => request<any>('/warfarin-iwpc/predict', { method: 'POST', body: JSON.stringify(input) }),
  warfarinPredictPatient: (id: number, input: any) => request<any>(`/warfarin-iwpc/predict/${id}`, { method: 'POST', body: JSON.stringify(input) }),
  warfarinHistory: () => request<any[]>('/warfarin-iwpc/history'),

  // Pass 7 (2026-05-21): structured consents + HIPAA field-level access tracking
  consentScopes: () => request<any>('/consents/scopes'),
  consentsList: (params: Record<string, string> = {}) => {
    const sp = new URLSearchParams(params);
    return request<any>(`/consents?${sp.toString()}`);
  },
  consentCreate: (d: any) => request<any>('/consents', { method: 'POST', body: JSON.stringify(d) }),
  consentUpdateStatus: (id: number, d: { status: string; notes?: string }) =>
    request<any>(`/consents/${id}/status`, { method: 'PUT', body: JSON.stringify(d) }),
  consentActive: (patientId: number) => request<any>(`/consents/patient/${patientId}/active`),
  fieldAccessLog: (d: { patient_id?: number; resource: string; field: string; action: string; reason?: string }) =>
    request<any>('/field-access-log', { method: 'POST', body: JSON.stringify(d) }),
  fieldAccessList: (params: Record<string, string> = {}) => {
    const sp = new URLSearchParams(params);
    return request<any>(`/field-access-log?${sp.toString()}`);
  },
  fieldAccessSummary: (patientId: number) => request<any>(`/field-access-log/summary/${patientId}`),
};
