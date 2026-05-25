import type { AgendaItem } from '@/lib/api';

interface Props {
  item: AgendaItem;
}

const PRIOR_STYLE: Record<string, { accent: string; bg: string; text: string }> = {
  CRITICO: { accent: 'var(--red)',          bg: 'rgba(255,77,109,0.12)',   text: '#FF4D6D' },
  URGENTE: { accent: 'var(--purple-light)', bg: 'rgba(104,46,199,0.12)',   text: '#9B6FE8' },
  ATENCAO: { accent: 'var(--orange)',       bg: 'rgba(255,159,10,0.12)',   text: '#FF9F0A' },
  ROTINA:  { accent: 'var(--green)',        bg: 'rgba(125,226,96,0.08)',   text: '#7DE260' },
};

function tags(item: AgendaItem): { text: string; tone: 'red' | 'orange' | 'purple' | 'grey' }[] {
  const out: { text: string; tone: 'red' | 'orange' | 'purple' | 'grey' }[] = [];
  if (item.flag_crise_sem_vinculo) out.push({ text: 'Crise sem vínculo', tone: 'red' });
  if (item.flag_invisivel)         out.push({ text: '★ 1º contato',     tone: 'orange' });
  if (item.gestacao === 1)         out.push({ text: 'Gestante',         tone: 'orange' });
  if (item.hipertenso === 1)       out.push({ text: 'Hipertenso',       tone: 'purple' });
  if (item.diabetico === 1)        out.push({ text: 'Diabético',        tone: 'purple' });
  if (item.situacao_vulnerabilidade === 1) out.push({ text: 'Vulnerável', tone: 'grey' });
  if (item.faixa_etaria === '66+') out.push({ text: 'Idoso 66+',        tone: 'grey' });
  if (item.faixa_etaria === '0-6') out.push({ text: 'Criança 0-6',      tone: 'grey' });
  if (item.n_urg_30d > 0)          out.push({ text: `${item.n_urg_30d} urg < 30d`, tone: 'red' });
  if (item.tem_agendamento_futuro) out.push({ text: 'Consulta agendada', tone: 'purple' });
  return out;
}

function tagStyle(tone: 'red' | 'orange' | 'purple' | 'grey') {
  if (tone === 'red')    return { bg: 'rgba(255,77,109,0.15)',   color: '#FF4D6D' };
  if (tone === 'orange') return { bg: 'rgba(255,159,10,0.15)',   color: '#FF9F0A' };
  if (tone === 'purple') return { bg: 'rgba(104,46,199,0.15)',   color: '#9B6FE8' };
  return                        { bg: 'rgba(255,255,255,0.06)',  color: '#74769A' };
}

export function AgendaCard({ item }: Props) {
  const prior = PRIOR_STYLE[item.prioridade ?? 'ROTINA'] ?? PRIOR_STYLE.ROTINA;
  const ts = tags(item);

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b"
        style={{ background: prior.bg, borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-base shrink-0"
          style={{ background: 'var(--bg-card)', color: prior.text, border: `1px solid ${prior.accent}` }}
        >
          {item.ordem_visita}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: prior.text }}>
            {item.prioridade ?? 'ROTINA'} · Score {Math.round(item.score)}
          </p>
          <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {item.paciente_id.slice(0, 16)}…
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Trecho</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{item.distancia_anterior_km.toFixed(2)} km</p>
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
            style={{ background: 'var(--bg-card-2)', color: 'var(--text)' }}
          >
            {item.justificativa}
          </div>
        )}

        <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Última visita: {item.dias_sem_visita < 999 ? `há ${item.dias_sem_visita}d` : 'nunca'}</span>
          <span>Acumulado: {item.distancia_acumulada_km.toFixed(2)} km</span>
        </div>
      </div>
    </article>
  );
}
