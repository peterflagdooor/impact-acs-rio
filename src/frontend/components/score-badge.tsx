import { scoreToPriority, priorityLabel } from '@/lib/api';

export function ScoreBadge({ score }: { score: number }) {
  const p = scoreToPriority(score);

  // Light tint badges — SMS Rio priority scale
  const styles: Record<number, { bg: string; color: string; border: string }> = {
    1: { bg: '#fce4e6',                      color: '#9b1c28', border: 'rgba(220,53,69,0.30)'  },
    2: { bg: 'rgba(253,126,20,0.12)',         color: '#8d4a0c', border: 'rgba(253,126,20,0.30)' },
    3: { bg: '#fff8dc',                      color: '#856404', border: 'rgba(255,193,7,0.40)'  },
    4: { bg: '#e6f4ea',                      color: '#1a6630', border: 'rgba(40,167,69,0.30)'  },
  };

  const s = styles[p];

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-full border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      <span className="font-mono font-bold">{Math.round(score)}</span>
      <span>{priorityLabel(p)}</span>
    </div>
  );
}
