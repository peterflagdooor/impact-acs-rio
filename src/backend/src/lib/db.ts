import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import type {
  Paciente, PacienteComScore, Visita, EventoClinico,
  RegistroWhatsapp, Alerta,
} from '../types.js';

// Resolve DB path: env var OR repo root db.sqlite
const DB_PATH = process.env.DATABASE_PATH ?? resolve(process.cwd(), '../../db.sqlite');

export const db = new Database(DB_PATH, { readonly: false });
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function listPatients(filters: {
  equipe_id?: string;
  scoreMin?: number;
  scoreMax?: number;
  limit?: number;
  offset?: number;
} = {}): PacienteComScore[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (filters.equipe_id) { where.push('p.equipe_id = @equipe_id'); params.equipe_id = filters.equipe_id; }
  if (filters.scoreMin !== undefined) { where.push('s.score >= @scoreMin'); params.scoreMin = filters.scoreMin; }
  if (filters.scoreMax !== undefined) { where.push('s.score <= @scoreMax'); params.scoreMax = filters.scoreMax; }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const sql = `
    SELECT p.*, s.score, s.fatores, s.justificativa,
           (SELECT MAX(registrados_em) FROM visitas WHERE paciente_id = p.paciente_id) AS ultima_visita
    FROM pacientes p
    LEFT JOIN pacientes_scores s ON s.paciente_id = p.paciente_id
    ${whereSql}
    ORDER BY s.score DESC
    LIMIT @limit OFFSET @offset
  `;
  const rows = db.prepare(sql).all({
    ...params,
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  }) as Array<PacienteComScore & { fatores: string }>;

  return rows.map(r => ({ ...r, fatores: JSON.parse(r.fatores ?? '[]') }));
}

export function getPatient(id: string): PacienteComScore | null {
  const row = db.prepare(`
    SELECT p.*, s.score, s.fatores, s.justificativa,
           (SELECT MAX(registrados_em) FROM visitas WHERE paciente_id = p.paciente_id) AS ultima_visita
    FROM pacientes p
    LEFT JOIN pacientes_scores s ON s.paciente_id = p.paciente_id
    WHERE p.paciente_id = ?
  `).get(id) as (PacienteComScore & { fatores: string }) | undefined;
  if (!row) return null;
  return { ...row, fatores: JSON.parse(row.fatores ?? '[]') };
}

export function getPatientVisits(id: string): Visita[] {
  return db.prepare('SELECT * FROM visitas WHERE paciente_id = ? ORDER BY registrados_em DESC').all(id) as Visita[];
}

export function getPatientEvents(id: string): EventoClinico[] {
  return db.prepare('SELECT * FROM eventos_clinicos WHERE paciente_id = ? ORDER BY data_referencia DESC').all(id) as EventoClinico[];
}

export function getPatientAlerts(id: string): Alerta[] {
  return db.prepare('SELECT * FROM alertas WHERE paciente_id = ? AND resolvido_em IS NULL ORDER BY criado_em DESC').all(id) as Alerta[];
}

export function getOpenAlerts(limit = 50): (Alerta & { paciente_nome_proxy: string })[] {
  return db.prepare(`
    SELECT a.*, substr(a.paciente_id, 1, 12) AS paciente_nome_proxy
    FROM alertas a
    WHERE a.resolvido_em IS NULL
    ORDER BY a.prioridade ASC, a.criado_em DESC
    LIMIT ?
  `).all(limit) as (Alerta & { paciente_nome_proxy: string })[];
}

export function getKpis() {
  const total = (db.prepare('SELECT COUNT(*) AS n FROM pacientes').get() as { n: number }).n;
  const visitados = (db.prepare('SELECT COUNT(DISTINCT paciente_id) AS n FROM visitas').get() as { n: number }).n;
  const alertas_abertos = (db.prepare('SELECT COUNT(*) AS n FROM alertas WHERE resolvido_em IS NULL').get() as { n: number }).n;
  const urgencias_30d = (db.prepare(`
    SELECT COUNT(DISTINCT paciente_id) AS n FROM eventos_clinicos
    WHERE tipo = 'urgencia-emergencia-ou-internacao'
      AND date(data_referencia) >= date('2025-12-31', '-30 days')
  `).get() as { n: number }).n;
  return {
    total_pacientes: total,
    pacientes_visitados: visitados,
    cobertura_pct: Math.round((100 * visitados) / total),
    alertas_abertos,
    urgencias_30d,
  };
}

export function getTerritoryHeatmap() {
  const sql = `
    SELECT
      ROUND(p.endereco_latitude, 3)  AS lat,
      ROUND(p.endereco_longitude, 3) AS lng,
      COUNT(*) AS n_urgencias
    FROM eventos_clinicos e
    JOIN pacientes p ON p.paciente_id = e.paciente_id
    WHERE e.tipo = 'urgencia-emergencia-ou-internacao'
    GROUP BY lat, lng
    HAVING n_urgencias >= 3
    ORDER BY n_urgencias DESC
    LIMIT 200
  `;
  return db.prepare(sql).all() as Array<{ lat: number; lng: number; n_urgencias: number }>;
}

export function insertVisita(v: Omit<Visita, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO visitas (profissional_id, registrados_em, ordem_visita_dia, paciente_id, origem)
    VALUES (@profissional_id, @registrados_em, @ordem_visita_dia, @paciente_id, @origem)
  `);
  return Number(stmt.run(v).lastInsertRowid);
}

export function insertAlerta(a: Omit<Alerta, 'id' | 'criado_em' | 'resolvido_em'>): number {
  const stmt = db.prepare(`
    INSERT INTO alertas (paciente_id, tipo, mensagem, prioridade, origem)
    VALUES (@paciente_id, @tipo, @mensagem, @prioridade, @origem)
  `);
  return Number(stmt.run(a).lastInsertRowid);
}

export function upsertScore(paciente_id: string, score: number, fatores: string[], justificativa: string | null): void {
  db.prepare(`
    INSERT INTO pacientes_scores (paciente_id, score, fatores, justificativa, calculado_em)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(paciente_id) DO UPDATE SET
      score = excluded.score,
      fatores = excluded.fatores,
      justificativa = excluded.justificativa,
      calculado_em = excluded.calculado_em
  `).run(paciente_id, score, JSON.stringify(fatores), justificativa);
}

export function insertRegistroWhatsapp(r: Omit<RegistroWhatsapp, 'id' | 'recebido_em' | 'processado_em'>): number {
  const stmt = db.prepare(`
    INSERT INTO registros_whatsapp
      (whatsapp_msg_id, from_number, profissional_id, mensagem_texto, dados_extraidos, paciente_id, status)
    VALUES (@whatsapp_msg_id, @from_number, @profissional_id, @mensagem_texto, @dados_extraidos, @paciente_id, @status)
  `);
  return Number(stmt.run(r).lastInsertRowid);
}

export function updateRegistroWhatsapp(id: number, fields: Partial<RegistroWhatsapp>): void {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = @${k}`);
    params[k] = v;
  }
  if (sets.length === 0) return;
  db.prepare(`UPDATE registros_whatsapp SET ${sets.join(', ')}, processado_em = datetime('now') WHERE id = @id`).run(params);
}
