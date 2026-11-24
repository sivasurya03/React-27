import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/utils/cn';
import type { NavItem } from './navConfig';

export function SidebarNav({ items, collapsed, onNavigate, badges }: { items: NavItem[]; collapsed?: boolean; onNavigate?: () => void; badges?: Record<string, number> }) {
  return (
    <nav aria-label="Primary" className="space-y-1 p-3">
      {items.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              collapsed && 'justify-center',
              isActive ? 'bg-brand/10 text-brand-text' : 'text-muted hover:bg-subtle hover:text-fg',
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {collapsed ? <span className="sr-only">{label}</span> : <span className="flex-1 truncate">{label}</span>}
          {(badges?.[to] ?? 0) > 0 && (
            <span className={cn('flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-fg', collapsed && 'absolute right-2 top-1.5 h-4 min-w-4 px-1 text-[10px]')}>
              {badges?.[to]}
              <span className="sr-only"> new</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar({ items, collapsed, badges, label }: { items: NavItem[]; collapsed: boolean; badges?: Record<string, number>; label?: string }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface lg:flex"
    >
      <div className={cn('flex h-16 items-center border-b border-line px-5', collapsed && 'justify-center px-0')}>
        <Logo collapsed={collapsed} />
        {label && !collapsed && <span className="ml-2 rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-text">{label}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav items={items} collapsed={collapsed} badges={badges} />
      </div>
    </motion.aside>
  );
}
