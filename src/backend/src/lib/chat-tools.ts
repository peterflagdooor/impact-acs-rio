import { db, listPatients, getOpenAlerts, getKpis } from './db.js';

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

export function executeTool(name: string, input: Record<string, unknown>): unknown {
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
    case 'query_group_stats': {
      const equipeFilter = input.equipe_id
        ? `WHERE p.equipe_id = '${String(input.equipe_id).replace(/'/g, "''")}'`
        : '';
      const rows = db.prepare(`
        SELECT
          'gestantes' AS grupo,
          SUM(p.gestacao) AS n_total,
          SUM(CASE WHEN p.gestacao=1 AND v.paciente_id IS NOT NULL THEN 1 ELSE 0 END) AS n_visitados
        FROM pacientes p
        LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING(paciente_id)
        ${equipeFilter}
        UNION ALL
        SELECT 'hipertensos', SUM(p.hipertenso),
          SUM(CASE WHEN p.hipertenso=1 AND v.paciente_id IS NOT NULL THEN 1 ELSE 0 END)
        FROM pacientes p
        LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING(paciente_id)
        ${equipeFilter}
        UNION ALL
        SELECT 'diabeticos', SUM(p.diabetico),
          SUM(CASE WHEN p.diabetico=1 AND v.paciente_id IS NOT NULL THEN 1 ELSE 0 END)
        FROM pacientes p
        LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING(paciente_id)
        ${equipeFilter}
        UNION ALL
        SELECT 'idosos_66', SUM(CASE WHEN p.faixa_etaria='66+' THEN 1 ELSE 0 END),
          SUM(CASE WHEN p.faixa_etaria='66+' AND v.paciente_id IS NOT NULL THEN 1 ELSE 0 END)
        FROM pacientes p
        LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING(paciente_id)
        ${equipeFilter}
        UNION ALL
        SELECT 'vulneraveis', SUM(p.situacao_vulnerabilidade),
          SUM(CASE WHEN p.situacao_vulnerabilidade=1 AND v.paciente_id IS NOT NULL THEN 1 ELSE 0 END)
        FROM pacientes p
        LEFT JOIN (SELECT DISTINCT paciente_id FROM visitas) v USING(paciente_id)
        ${equipeFilter}
      `).all() as Array<{ grupo: string; n_total: number; n_visitados: number }>;
      return rows.map(r => ({
        ...r,
        pct_cobertura: r.n_total ? Math.round(100 * r.n_visitados / r.n_total) : 0,
      }));
    }
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}
