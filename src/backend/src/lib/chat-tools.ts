import { listPatients, getOpenAlerts, getKpis, queryGroupStats } from './db.js';

export interface ToolDef {
  name: string;
  description: string;
  input_schema: object;
}

export const CHAT_TOOLS: ToolDef[] = [
  {
    name: 'query_patients',
    description: 'Lista pacientes ordenados por score, com filtros opcionais. Use pra responder "quem precisa de visita", "top pacientes vulneráveis", etc.',
    input_schema: {
      type: 'object',
      properties: {
        equipe_id: { type: 'string', description: 'Filtrar por equipe (hash)' },
        score_min: { type: 'number', description: 'Score mínimo (0-100)' },
        limit: { type: 'number', description: 'Máximo de resultados (default 20)' },
      },
    },
  },
  {
    name: 'query_alerts',
    description: 'Lista alertas abertos (não resolvidos), ordenados por prioridade.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Máximo (default 20)' },
      },
    },
  },
  {
    name: 'query_kpis',
    description: 'Retorna KPIs gerais: cobertura, total de pacientes, alertas abertos, urgências recentes.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'query_group_stats',
    description: 'Estatísticas por grupo populacional: gestantes, idosos, hipertensos, diabéticos, vulneráveis. Retorna n_total, n_visitados, % cobertura.',
    input_schema: {
      type: 'object',
      properties: {
        equipe_id: { type: 'string', description: 'Opcional: filtrar por equipe' },
      },
    },
  },
];

export async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'query_patients':
      return listPatients({
        equipe_id: input.equipe_id as string | undefined,
        scoreMin: input.score_min as number | undefined,
        limit: (input.limit as number | undefined) ?? 20,
      });
    case 'query_alerts':
      return getOpenAlerts((input.limit as number | undefined) ?? 20);
    case 'query_kpis':
      return getKpis();
    case 'query_group_stats':
      return queryGroupStats(input.equipe_id as string | undefined);
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}
