import { scoreToPriority, priorityLabel } from '@/lib/api';

export function ScoreBadge({ score }: { score: number }) {
  const p = scoreToPriority(score);

  const styles: Record<number, { bg: string; color: string; border: string }> = {
    1: { bg: 'rgba(255,77,109,0.15)',   color: '#FF4D6D', border: 'rgba(255,77,109,0.30)' },
    2: { bg: 'rgba(104,46,199,0.15)',   color: '#9B6FE8', border: 'rgba(104,46,199,0.30)' },
    3: { bg: 'rgba(255,159,10,0.15)',   color: '#FF9F0A', border: 'rgba(255,159,10,0.30)' },
    4: { bg: 'rgba(255,255,255,0.06)',  color: '#74769A', border: 'rgba(255,255,255,0.08)' },
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
