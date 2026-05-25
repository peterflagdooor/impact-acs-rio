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
        background: 'var(--white)',
        border: '1px solid var(--grey-card)',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}
    >
      {/* Icon */}
      {Icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'var(--grey-card)' }}
        >
          <Icon size={20} style={{ color: 'var(--blue-primary)' }} />
        </div>
      )}

      {/* Value */}
      <p className="text-4xl font-bold leading-none" style={{ color: 'var(--grey-dark)' }}>
        {value}
      </p>

      {/* Label */}
      <p className="text-sm mt-2 font-medium" style={{ color: 'var(--grey-text)' }}>
        {label}
      </p>

      {/* Hint */}
      {hint && (
        <p className="text-xs mt-1" style={{ color: 'var(--grey-text)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
