'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  Settings,
  HelpCircle,
  Search,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',           icon: LayoutDashboard, label: 'Overview' },
  { href: '/pacientes',  icon: Users,           label: 'Pacientes' },
  { href: '/agenda',     icon: CalendarDays,    label: 'Agenda' },
  { href: '/chat',       icon: MessageSquare,   label: 'Chat IA' },
];

const SUPPORT_ITEMS = [
  { icon: Settings,   label: 'Configurações' },
  { icon: HelpCircle, label: 'Ajuda' },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50"
      style={{
        width: '240px',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--purple)' }}
          >
            A
          </span>
          <div>
            <p className="font-semibold text-sm leading-none" style={{ color: 'var(--text)' }}>ACS</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Inteligente</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-4">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--bg-card-2)', color: 'var(--text-muted)' }}
        >
          <Search size={14} />
          <span>Buscar…</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p
          className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Menu
        </p>

        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = path === href || (href !== '/' && path.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group"
                  style={{
                    background: isActive ? 'rgba(104,46,199,0.15)' : 'transparent',
                    color: isActive ? 'var(--purple-light)' : 'var(--text-muted)',
                  }}
                >
                  {/* Active bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r"
                      style={{ background: 'var(--purple)' }}
                    />
                  )}
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Support section */}
        <p
          className="px-3 mt-6 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Suporte
        </p>

        <ul className="space-y-0.5">
          {SUPPORT_ITEMS.map(({ icon: Icon, label }) => (
            <li key={label}>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                style={{ color: 'var(--text-muted)' }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Premium promo */}
      <div className="p-4">
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(104,46,199,0.25) 0%, rgba(104,46,199,0.08) 100%)',
            border: '1px solid rgba(104,46,199,0.25)',
          }}
        >
          <div className="text-2xl mb-2">🚀</div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>ACS Premium</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Próxima fase do produto
          </p>
          <button
            className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--purple)', color: '#fff' }}
          >
            Saiba mais
          </button>
        </div>
      </div>
    </aside>
  );
}
