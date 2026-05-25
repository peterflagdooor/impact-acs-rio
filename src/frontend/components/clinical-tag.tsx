const TAG_STYLE: Record<string, { bg: string; color: string; emoji: string; label: string }> = {
  hipertenso: { bg: 'rgba(59,130,246,0.15)',  color: '#93C5FD', emoji: '🫀', label: 'Hipertenso' },
  diabetico:  { bg: 'rgba(249,115,22,0.15)',  color: '#FCA572', emoji: '🩺', label: 'Diabético' },
  gestante:   { bg: 'rgba(236,72,153,0.15)',  color: '#F9A8D4', emoji: '🤱', label: 'Gestante' },
  vulneravel: { bg: 'rgba(234,179,8,0.15)',   color: '#FDE047', emoji: '⚠️', label: 'Vulnerável' },
  emergencia: { bg: 'rgba(255,77,109,0.15)',  color: '#FF4D6D', emoji: '🚨', label: 'Emergência recente' },
  idoso:      { bg: 'rgba(167,139,250,0.15)', color: '#C4B5FD', emoji: '👴', label: 'Idoso 66+' },
  crianca:    { bg: 'rgba(125,226,96,0.15)',  color: '#7DE260', emoji: '👶', label: 'Criança 0-6' },
  'sem-visita': { bg: 'rgba(255,77,109,0.10)', color: '#FF4D6D', emoji: '⏰', label: 'Sem visita 180d+' },
  agendamento: { bg: 'rgba(104,46,199,0.15)', color: '#9B6FE8', emoji: '📅', label: 'Agendamento próximo' },
};

export function ClinicalTag({ kind }: { kind: string }) {
  const style = TAG_STYLE[kind];
  if (!style) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
      >
        {kind}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full"
      style={{ background: style.bg, color: style.color }}
    >
      {style.emoji} {style.label}
    </span>
  );
}

/* Mapeia fatores do scoring engine para tipos de tag */
export function factorToTagKind(factor: string): string {
  if (factor === 'gestante') return 'gestante';
  if (factor === 'crianca_0_6') return 'crianca';
  if (factor === 'idoso_66_mais') return 'idoso';
  if (factor.startsWith('hipertenso')) return 'hipertenso';
  if (factor.startsWith('diabetico') || factor === 'hipertenso_e_diabetico') return 'diabetico';
  if (factor === 'situacao_vulnerabilidade') return 'vulneravel';
  if (factor.startsWith('urgencia')) return 'emergencia';
  if (factor.startsWith('sem_visita')) return 'sem-visita';
  if (factor === 'agendamento_proximo_14d') return 'agendamento';
  if (factor === 'alerta_critico_aberto') return 'emergencia';
  return factor;
}
