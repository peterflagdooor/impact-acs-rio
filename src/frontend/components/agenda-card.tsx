import type { AgendaItem } from '@/lib/api';

interface Props {
  item: AgendaItem;
}

const PRIOR_STYLE: Record<string, { accent: string; bg: string; text: string }> = {
  CRITICO: { accent: 'var(--priority-1)',   bg: 'rgba(220,53,69,0.08)',   text: '#9b1c28' },
  URGENTE: { accent: 'var(--priority-2)',   bg: 'rgba(253,126,20,0.08)',  text: '#8d4a0c' },
  ATENCAO: { accent: 'var(--priority-3)',   bg: 'rgba(255,193,7,0.10)',   text: '#856404' },
  ROTINA:  { accent: 'var(--priority-4)',   bg: 'rgba(40,167,69,0.08)',   text: '#1a6630' },
};

function tags(item: AgendaItem): { text: string; tone: 'red' | 'orange' | 'blue' | 'grey' }[] {
  const out: { text: string; tone: 'red' | 'orange' | 'blue' | 'grey' }[] = [];
  if (item.flag_crise_sem_vinculo) out.push({ text: 'Crise sem vínculo', tone: 'red' });
  if (item.flag_invisivel)         out.push({ text: '★ 1º contato',     tone: 'orange' });
  if (item.gestacao === 1)         out.push({ text: 'Gestante',         tone: 'orange' });
  if (item.hipertenso === 1)       out.push({ text: 'Hipertenso',       tone: 'blue' });
  if (item.diabetico === 1)        out.push({ text: 'Diabético',        tone: 'blue' });
  if (item.situacao_vulnerabilidade === 1) out.push({ text: 'Vulnerável', tone: 'grey' });
  if (item.faixa_etaria === '66+') out.push({ text: 'Idoso 66+',        tone: 'grey' });
  if (item.faixa_etaria === '0-6') out.push({ text: 'Criança 0-6',      tone: 'grey' });
  if (item.n_urg_30d > 0)          out.push({ text: `${item.n_urg_30d} urg < 30d`, tone: 'red' });
  if (item.tem_agendamento_futuro) out.push({ text: 'Consulta agendada', tone: 'blue' });
  return out;
}

function tagStyle(tone: 'red' | 'orange' | 'blue' | 'grey') {
  if (tone === 'red')    return { bg: '#fce4e6',                    color: '#9b1c28' };
  if (tone === 'orange') return { bg: 'rgba(253,126,20,0.12)',      color: '#8d4a0c' };
  if (tone === 'blue')   return { bg: 'rgba(0,74,128,0.10)',        color: '#004a80' };
  return                        { bg: 'var(--grey-card)',           color: 'var(--grey-text)' };
}

export function AgendaCard({ item }: Props) {
  const prior = PRIOR_STYLE[item.prioridade ?? 'ROTINA'] ?? PRIOR_STYLE.ROTINA;
  const ts = tags(item);

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--white)', border: '1px solid var(--grey-card)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b"
        style={{ background: prior.bg, borderColor: 'var(--grey-card)' }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-base shrink-0"
          style={{ background: 'var(--white)', color: prior.text, border: `1px solid ${prior.accent}` }}
        >
          {item.ordem_visita}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: prior.text }}>
            {item.prioridade ?? 'ROTINA'} · Score {Math.round(item.score)}
          </p>
          <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'var(--grey-text)' }}>
            {item.paciente_id.slice(0, 16)}…
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--grey-text)' }}>Trecho</p>
          <p className="text-sm font-bold" style={{ color: 'var(--grey-dark)' }}>{item.distancia_anterior_km.toFixed(2)} km</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-3 space-y-3">
        {ts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ts.map((t, i) => {
              const s = tagStyle(t.tone);
              return (
                <span key={i} className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
                  {t.text}
                </span>
              );
            })}
          </div>
        )}

        {item.justificativa && (
          <div
            className="rounded-xl p-3 text-sm leading-snug"
            style={{ background: 'var(--grey-card)', color: 'var(--grey-dark)' }}
          >
            {item.justificativa}
          </div>
        )}

        <div className="flex justify-between text-xs" style={{ color: 'var(--grey-text)' }}>
          <span>Última visita: {item.dias_sem_visita < 999 ? `há ${item.dias_sem_visita}d` : 'nunca'}</span>
          <span>Acumulado: {item.distancia_acumulada_km.toFixed(2)} km</span>
        </div>
      </div>
    </article>
  );
}
