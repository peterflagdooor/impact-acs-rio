import weights from '../config/scoring-weights.json' with { type: 'json' };
import {
  getPatient, getPatientVisits, getPatientEvents,
  upsertScore, countOpenAlertsP1,
} from './db.js';

const TODAY = new Date('2025-12-31');

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export async function computeScore(paciente_id: string): Promise<{ score: number; fatores: string[] }> {
  const p = await getPatient(paciente_id);
  if (!p) throw new Error(`paciente ${paciente_id} não existe`);

  const [visitas, eventos, n_alertas_p1] = await Promise.all([
    getPatientVisits(paciente_id),
    getPatientEvents(paciente_id),
    countOpenAlertsP1(paciente_id),
  ]);

  const f = weights.factors;
  const fatores: string[] = [];
  let total = 0;

  if (p.gestacao) { fatores.push('gestante'); total += f.clinical.gestante; }
  if (p.faixa_etaria === '0-6') { fatores.push('crianca_0_6'); total += f.clinical.crianca_0_6; }
  if (p.hipertenso && p.diabetico) {
    fatores.push('hipertenso_e_diabetico');
    total += f.clinical.hipertenso_e_diabetico;
  } else if (p.hipertenso || p.diabetico) {
    fatores.push('hipertenso_xor_diabetico');
    total += f.clinical.hipertenso_xor_diabetico;
  }
  if (p.faixa_etaria === '66+') { fatores.push('idoso_66_mais'); total += f.clinical.idoso_66_mais; }

  if (p.situacao_vulnerabilidade) {
    fatores.push('situacao_vulnerabilidade');
    total += f.social.situacao_vulnerabilidade;
  }

  const ultimaVisitaStr = visitas[0]?.registrados_em;
  if (!ultimaVisitaStr) {
    fatores.push('sem_visita_180_mais');
    total += f.temporal.sem_visita_180_mais;
  } else {
    const dias = daysBetween(new Date(ultimaVisitaStr), TODAY);
    if (dias > 180) { fatores.push('sem_visita_180_mais'); total += f.temporal.sem_visita_180_mais; }
    else if (dias > 90) { fatores.push('sem_visita_90_a_180'); total += f.temporal.sem_visita_90_a_180; }
    else if (dias > 30) { fatores.push('sem_visita_30_a_90'); total += f.temporal.sem_visita_30_a_90; }
  }

  const urgencias = eventos
    .filter(e => e.tipo === 'urgencia-emergencia-ou-internacao')
    .map(e => new Date(e.data_referencia));
  if (urgencias.length) {
    const ult = new Date(Math.max(...urgencias.map(d => d.getTime())));
    const dias = daysBetween(ult, TODAY);
    if (dias < 30) { fatores.push('urgencia_menor_30d'); total += f.gatilho.urgencia_menor_30d; }
    else if (dias < 90) { fatores.push('urgencia_30_a_90d'); total += f.gatilho.urgencia_30_a_90d; }
  }

  const proximos = eventos.filter(e =>
    e.tipo === 'agendamento'
    && daysBetween(TODAY, new Date(e.data_referencia)) >= 0
    && daysBetween(TODAY, new Date(e.data_referencia)) <= 14
  );
  if (proximos.length) {
    fatores.push('agendamento_proximo_14d');
    total += f.gatilho.agendamento_proximo_14d;
  }

  if (n_alertas_p1 > 0) {
    fatores.push('alerta_critico_aberto');
    total += f.gatilho.alerta_critico_aberto;
  }

  const score = Math.min(total, weights.max_score);
  return { score, fatores };
}

export async function recomputeAndSave(paciente_id: string): Promise<{ score: number; fatores: string[] }> {
  const { score, fatores } = await computeScore(paciente_id);
  await upsertScore(paciente_id, score, fatores, null);
  return { score, fatores };
}
