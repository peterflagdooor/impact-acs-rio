import type { PainelEquipe } from '@/lib/api';

interface Props {
  painel: PainelEquipe[];
  limit?: number;
}

function pressaoColor(score: number): string {
  if (score >= 45) return 'var(--priority-1)';
  if (score >= 38) return 'var(--priority-2)';
  if (score >= 30) return 'var(--blue-light)';
  return 'var(--green-accent)';
}

export function PressaoTable({ painel, limit = 10 }: Props) {
  const top = painel.slice(0, limit);

  if (top.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-sm"
        style={{ background: 'var(--white)', border: '1px solid var(--grey-card)', color: 'var(--grey-text)' }}
      >
        Sem dados de pressão por equipe ainda. Recalcular scores primeiro.
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-x-auto"
      style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-xs font-semibold uppercase tracking-wider border-b"
            style={{
              background: 'var(--grey-card)',
              color: 'var(--grey-text)',
              borderColor: 'var(--grey-card)',
            }}
          >
            <th className="px-4 py-3">Equipe</th>
            <th className="px-3 py-3 text-right">Pacientes</th>
            <th className="px-3 py-3 text-right">% Alto risco</th>
            <th className="px-3 py-3 text-right">% Sem visita</th>
            <th className="px-3 py-3 text-right">% Urgência</th>
            <th className="px-3 py-3 text-right">Pressão</th>
            <th className="px-3 py-3 text-right">Invisíveis</th>
          </tr>
        </thead>
        <tbody>
          {top.map(p => (
            <tr
              key={p.equipe_id}
              className="border-t transition-colors hover:bg-[#fafafa]"
              style={{ borderColor: 'var(--grey-card)' }}
            >
              <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--blue-light)' }}>
                {p.equipe_id.slice(0, 8)}…
              </td>
              <td className="px-3 py-3 text-right text-xs" style={{ color: 'var(--grey-text)' }}>
                {p.total_pacientes.toLocaleString('pt-BR')}
              </td>
              <td className="px-3 py-3 text-right text-xs" style={{ color: 'var(--grey-text)' }}>
                {p.pct_alto_risco.toFixed(1)}%
              </td>
              <td className="px-3 py-3 text-right text-xs" style={{ color: 'var(--grey-text)' }}>
                {p.pct_sem_visita.toFixed(1)}%
              </td>
              <td className="px-3 py-3 text-right text-xs" style={{ color: 'var(--grey-text)' }}>
                {p.pct_urgencia.toFixed(1)}%
              </td>
              <td className="px-3 py-3 text-right font-bold text-sm" style={{ color: pressaoColor(p.score_pressao) }}>
                {p.score_pressao.toFixed(1)}
              </td>
              <td className="px-3 py-3 text-right text-xs" style={{ color: 'var(--grey-text)' }}>
                <span title="Alto risco sem visita">{p.alto_risco_invisivel}</span>
                {p.crise_sem_vinculo > 0 && (
                  <span
                    className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#fce4e6', color: 'var(--priority-1)' }}
                    title="Crise sem vínculo"
                  >
                    {p.crise_sem_vinculo} crise
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
