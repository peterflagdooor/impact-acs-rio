import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { ScoreBadge } from '@/components/score-badge';
import { ClinicalTag, factorToTagKind } from '@/components/clinical-tag';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Visita {
  id: number;
  profissional_id: string;
  registrados_em: string;
  paciente_id: string;
  origem: string;
}

interface EventoClinico {
  paciente_id: string;
  tipo: string;
  data_referencia: string;
}

interface Alerta {
  id: number;
  paciente_id: string;
  tipo: string;
  mensagem: string;
  prioridade: number;
  criado_em: string;
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await apiClient.patient(id);
  } catch {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--grey-dark)' }}>
          Paciente não encontrado
        </h1>
        <Link
          href="/pacientes"
          className="text-sm mt-4 inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--blue-light)' }}
        >
          <ChevronLeft size={14} />
          Voltar pra lista
        </Link>
      </div>
    );
  }

  const { paciente, visitas, eventos, alertas } = data as {
    paciente: typeof data.paciente;
    visitas: Visita[];
    eventos: EventoClinico[];
    alertas: Alerta[];
  };

  const tagKinds = Array.from(new Set(paciente.fatores.map(factorToTagKind)));

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity mb-4"
          style={{ color: 'var(--grey-text)' }}
        >
          <ChevronLeft size={14} />
          Voltar pra lista
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="t-section-label">Paciente</p>
            <h1 className="text-2xl font-bold font-mono mt-1" style={{ color: 'var(--grey-dark)' }}>
              #{paciente.paciente_id.slice(0, 16)}…
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--grey-text)' }}>
              {paciente.faixa_etaria} · {paciente.sexo} · {paciente.raca_cor} · equipe #{paciente.equipe_id.slice(0, 8)}
            </p>
          </div>
          <ScoreBadge score={paciente.score} />
        </div>
      </div>

      {/* Tags */}
      {tagKinds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tagKinds.map(k => <ClinicalTag key={k} kind={k} />)}
        </div>
      )}

      {/* Info cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Comorbidades */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
        >
          <p className="t-eyebrow mb-4">Comorbidades</p>
          <dl className="space-y-3 text-sm">
            <Row k="Gestante"    v={paciente.gestacao ? 'Sim' : 'Não'}                        highlight={!!paciente.gestacao} />
            <Row k="Hipertenso"  v={paciente.hipertenso ? 'Sim' : 'Não'}                     highlight={!!paciente.hipertenso} />
            <Row k="Diabético"   v={paciente.diabetico ? 'Sim' : 'Não'}                      highlight={!!paciente.diabetico} />
            <Row k="Vulnerável"  v={paciente.situacao_vulnerabilidade ? 'Sim' : 'Não'}       highlight={!!paciente.situacao_vulnerabilidade} />
          </dl>
        </div>

        {/* Fatores */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
        >
          <p className="t-eyebrow mb-4">Fatores do score</p>
          <div className="space-y-2">
            {paciente.fatores.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--grey-text)' }}>
                Nenhum fator de risco identificado.
              </p>
            ) : (
              paciente.fatores.map(f => (
                <div key={f} className="text-sm flex items-start gap-2">
                  <span style={{ color: 'var(--blue-primary)', marginTop: '2px' }}>•</span>
                  <span style={{ color: 'var(--grey-dark)' }}>{f.replace(/_/g, ' ')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Última visita */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
        >
          <p className="t-eyebrow mb-4">Última visita</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--grey-dark)' }}>
            {paciente.ultima_visita ?? 'Nunca'}
          </p>
          {(visitas as Visita[]).length > 0 && (
            <p className="text-sm mt-2" style={{ color: 'var(--grey-text)' }}>
              {(visitas as Visita[]).length} visita{(visitas as Visita[]).length !== 1 ? 's' : ''} registrada{(visitas as Visita[]).length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </section>

      {/* Alertas */}
      <section>
        <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--grey-dark)' }}>
          Alertas abertos ({(alertas as Alerta[]).length})
        </h2>
        <div className="space-y-3">
          {(alertas as Alerta[]).length === 0 ? (
            <div
              className="rounded-xl p-5 text-sm"
              style={{ background: 'var(--white)', border: '1px solid var(--grey-card)', color: 'var(--grey-text)' }}
            >
              Nenhum alerta aberto pra este paciente.
            </div>
          ) : (alertas as Alerta[]).map(a => (
            <div
              key={a.id}
              className="rounded-xl p-4"
              style={{
                background: 'var(--white)',
                border: '1px solid var(--grey-card)',
                borderLeft: '3px solid var(--orange)',
              }}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--orange)' }}>
                  {a.tipo}
                </p>
                <span className="text-xs" style={{ color: 'var(--grey-text)' }}>{a.criado_em}</span>
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--grey-dark)' }}>{a.mensagem}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Eventos + Visitas */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-base mb-3" style={{ color: 'var(--grey-dark)' }}>
            Eventos clínicos ({(eventos as EventoClinico[]).length})
          </h2>
          {(eventos as EventoClinico[]).length === 0 ? (
            <div
              className="rounded-xl p-5 text-sm"
              style={{ background: 'var(--white)', border: '1px solid var(--grey-card)', color: 'var(--grey-text)' }}
            >
              Sem eventos clínicos.
            </div>
          ) : (
            <ul
              className="rounded-xl p-4 space-y-1.5 text-xs max-h-64 overflow-y-auto"
              style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
            >
              {(eventos as EventoClinico[]).slice(0, 30).map((e, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span style={{ color: e.tipo === 'urgencia-emergencia-ou-internacao' ? 'var(--red)' : 'var(--grey-text)' }}>
                    {e.tipo}
                  </span>
                  <span className="font-mono shrink-0" style={{ color: 'var(--grey-text)' }}>
                    {e.data_referencia}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-base mb-3" style={{ color: 'var(--grey-dark)' }}>
            Visitas ({(visitas as Visita[]).length})
          </h2>
          {(visitas as Visita[]).length === 0 ? (
            <div
              className="rounded-xl p-5 text-sm"
              style={{ background: 'var(--white)', border: '1px solid var(--grey-card)', color: 'var(--grey-text)' }}
            >
              Sem visitas registradas.
            </div>
          ) : (
            <ul
              className="rounded-xl p-4 space-y-1.5 text-xs max-h-64 overflow-y-auto"
              style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
            >
              {(visitas as Visita[]).slice(0, 30).map(v => (
                <li key={v.id} className="flex justify-between gap-4">
                  <span style={{ color: v.origem === 'whatsapp' ? 'var(--green)' : 'var(--grey-text)' }}>
                    {v.origem === 'whatsapp' ? '💬 WhatsApp' : '📋 Sistema'}
                  </span>
                  <span className="font-mono shrink-0" style={{ color: 'var(--grey-text)' }}>
                    {v.registrados_em}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <dt style={{ color: 'var(--grey-text)' }}>{k}</dt>
      <dd
        className="font-semibold"
        style={{ color: highlight ? 'var(--blue-primary)' : 'var(--grey-dark)' }}
      >
        {v}
      </dd>
    </div>
  );
}
