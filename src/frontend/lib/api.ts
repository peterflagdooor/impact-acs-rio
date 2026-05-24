const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Paciente {
  paciente_id: string;
  equipe_id: string;
  faixa_etaria: string;
  sexo: string;
  raca_cor: string;
  situacao_vulnerabilidade: number;
  hipertenso: number;
  diabetico: number;
  gestacao: number;
  score: number;
  fatores: string[];
  ultima_visita: string | null;
  endereco_latitude: number;
  endereco_longitude: number;
}

export interface Alerta {
  id: number;
  paciente_id: string;
  paciente_nome_proxy: string;
  tipo: string;
  mensagem: string;
  prioridade: number;
  origem: string;
  criado_em: string;
}

export interface KPIs {
  total_pacientes: number;
  pacientes_visitados: number;
  cobertura_pct: number;
  alertas_abertos: number;
  urgencias_30d: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  n_urgencias: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export const apiClient = {
  kpis: () => api<KPIs>('/api/kpis'),
  patients: (params: { equipe_id?: string; score_min?: number; limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.equipe_id) q.set('equipe_id', params.equipe_id);
    if (params.score_min !== undefined) q.set('score_min', String(params.score_min));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    return api<Paciente[]>(`/api/patients?${q.toString()}`);
  },
  patient: (id: string) => api<{ paciente: Paciente; visitas: unknown[]; eventos: unknown[]; alertas: Alerta[] }>(`/api/patients/${id}`),
  alerts: () => api<Alerta[]>('/api/alerts'),
  heatmap: () => api<HeatmapPoint[]>('/api/territory/heatmap'),
};

// Helper: priority level from score (1=urgente, 4=rotina)
export function scoreToPriority(score: number): 1 | 2 | 3 | 4 {
  if (score >= 70) return 1;
  if (score >= 50) return 2;
  if (score >= 30) return 3;
  return 4;
}

export function priorityLabel(p: 1 | 2 | 3 | 4): string {
  return { 1: 'Urgente', 2: 'Alto', 3: 'Médio', 4: 'Rotina' }[p];
}
