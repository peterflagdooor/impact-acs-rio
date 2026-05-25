import type { InvisivelResponse } from '@/lib/api';

interface Props {
  data: InvisivelResponse;
}

const LABELS: Record<1 | 2 | 3, { titulo: string; descricao: string; accent: string; bg: string }> = {
  1: {
    titulo: 'Crise sem vínculo',
    descricao: '3+ urgências e zero visita do ACS no ano',
    accent: 'var(--priority-1)',
    bg: 'rgba(220,53,69,0.08)',
  },
  2: {
    titulo: 'Alto risco sem contato',
    descricao: 'Gestante, criança, hipertenso, diabético, idoso ou vulnerável sem visita',
    accent: 'var(--priority-2)',
    bg: 'rgba(253,126,20,0.08)',
  },
  3: {
    titulo: 'Sem contato',
    descricao: 'Sem condição especial, mas zero visita',
    accent: 'var(--blue-light)',
    bg: 'rgba(24,99,220,0.08)',
  },
};

export function InvisivelCounters({ data }: Props) {
  if (data.total === 0) {
    return (
      <div
        className="rounded-xl p-5 text-sm"
        style={{ background: 'var(--white)', border: '1px solid var(--grey-card)', color: 'var(--grey-text)' }}
      >
        Sem invisíveis detectados. Recalcular scores primeiro.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {([1, 2, 3] as const).map(cat => {
        const meta = LABELS[cat];
        const n = data.por_categoria[cat];
        return (
          <div
            key={cat}
            className="rounded-xl p-4"
            style={{ background: meta.bg, borderLeft: `3px solid ${meta.accent}` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.accent }}>
              Categoria {cat}
            </p>
            <p className="text-3xl font-bold mt-1.5" style={{ color: meta.accent }}>
              {n.toLocaleString('pt-BR')}
            </p>
            <p className="text-sm font-semibold mt-2" style={{ color: 'var(--grey-dark)' }}>
              {meta.titulo}
            </p>
            <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--grey-text)' }}>
              {meta.descricao}
            </p>
          </div>
        );
      })}
    </div>
  );
}
