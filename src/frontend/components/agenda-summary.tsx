import type { Agenda } from '@/lib/api';

interface Props {
  agenda: Agenda;
}

export function AgendaSummary({ agenda }: Props) {
  const criticos = agenda.agenda.filter(a => a.prioridade === 'CRITICO').length;
  const urgentes = agenda.agenda.filter(a => a.prioridade === 'URGENTE').length;
  const invisiveis = agenda.agenda.filter(a => a.flag_invisivel || a.flag_crise_sem_vinculo).length;

  const items = [
    { label: 'Visitas',    value: agenda.total_itens,                      color: 'var(--text)' },
    { label: 'Distância',  value: `${agenda.distancia_total_km.toFixed(1)} km`, color: 'var(--text)' },
    { label: 'Críticos',   value: criticos,                                color: 'var(--red)' },
    { label: 'Urgentes',   value: urgentes,                                color: 'var(--purple-light)' },
    { label: 'Invisíveis', value: invisiveis,                              color: 'var(--orange)' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map(it => (
        <div
          key={it.label}
          className="rounded-2xl p-4 text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-2xl font-bold" style={{ color: it.color }}>{it.value}</p>
          <p className="text-xs font-medium uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
            {it.label}
          </p>
        </div>
      ))}
    </div>
  );
}
