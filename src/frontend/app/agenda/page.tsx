import { apiClient } from '@/lib/api';
import { EquipeSelector } from '@/components/equipe-selector';
import { AgendaSummary } from '@/components/agenda-summary';
import { AgendaCard } from '@/components/agenda-card';
import { AgendaMapSection } from '@/components/agenda-map-section';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ equipe_id?: string; capacidade?: string; com_justificativas?: string }>;
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const equipe_id = params.equipe_id;
  const capacidade = params.capacidade ? Number(params.capacidade) : 6;
  const com_justificativas = params.com_justificativas === 'true';

  const equipes = await apiClient.equipesSedes().catch(() => []);

  let agenda = null as Awaited<ReturnType<typeof apiClient.agendaEquipe>> | null;
  let erro: string | null = null;
  if (equipe_id) {
    try {
      agenda = await apiClient.agendaEquipe(equipe_id, { capacidade, com_justificativas });
    } catch (err) {
      erro = (err as Error).message;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="t-section-label">ACS</p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: 'var(--text)' }}>
          Agenda do Dia
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Sequência otimizada de visitas — geográfica + score composto
        </p>
      </div>

      <EquipeSelector equipes={equipes} initialEquipe={equipe_id} initialCapacidade={capacidade} />

      {!equipe_id && (
        <div
          className="rounded-2xl p-10 text-center text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          Selecione uma equipe acima para gerar a agenda do dia.
        </div>
      )}

      {erro && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: 'rgba(255,77,109,0.12)', color: 'var(--red)', border: '1px solid rgba(255,77,109,0.25)' }}
        >
          Erro: {erro}
        </div>
      )}

      {agenda && (
        <>
          <AgendaSummary agenda={agenda} />

          {agenda.total_itens > 0 && !com_justificativas && (
            <div
              className="rounded-xl p-3 text-sm flex items-center justify-between gap-3"
              style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              <span>
                Justificativas geradas por IA ocultas por padrão para acelerar o carregamento.
              </span>
              <a
                href={`/agenda?equipe_id=${equipe_id}&capacidade=${capacidade}&com_justificativas=true`}
                className="font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg text-xs transition-opacity hover:opacity-80"
                style={{ background: 'var(--purple)', color: '#fff' }}
              >
                Gerar com IA
              </a>
            </div>
          )}

          {agenda.total_itens === 0 ? (
            <div
              className="rounded-2xl p-10 text-center text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              Nenhum paciente prioritário encontrado pra essa equipe.
              <br />
              Os scores podem ainda não ter sido calculados — rodar o re-score completo.
            </div>
          ) : (
            <>
              <section>
                <h2 className="font-semibold text-base mb-3" style={{ color: 'var(--text)' }}>
                  Rota
                </h2>
                <AgendaMapSection agenda={agenda} />
              </section>

              <section>
                <h2 className="font-semibold text-base mb-3" style={{ color: 'var(--text)' }}>
                  Sequência de visitas
                </h2>
                <div className="space-y-3">
                  {agenda.agenda.map(it => <AgendaCard key={it.paciente_id} item={it} />)}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
