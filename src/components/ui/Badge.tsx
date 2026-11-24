import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const styles: Record<BadgeVariant, string> = {
  neutral: 'bg-subtle text-muted',
  brand: 'bg-brand/10 text-brand-text',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
};

export function Badge({ variant = 'neutral', children, className }: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', styles[variant], className)}>
      {children}
    </span>
  );
}
