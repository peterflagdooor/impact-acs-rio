import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  /** Legacy compat — ignored in new design */
  accent?: 'blue' | 'green' | 'cyan' | 'red';
}

export function KpiCard({ label, value, hint, icon: Icon }: Props) {
  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 0 0 1px var(--border-subtle)',
      }}
    >
      {/* Subtle glow gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 0% 100%, rgba(104,46,199,0.10) 0%, transparent 60%)',
        }}
      />

      {/* Icon */}
      {Icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border-subtle)' }}
        >
          <Icon size={20} style={{ color: 'var(--purple-light)' }} />
        </div>
      )}

      {/* Value */}
      <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text)' }}>
        {value}
      </p>

      {/* Label */}
      <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>

      {/* Hint */}
      {hint && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
