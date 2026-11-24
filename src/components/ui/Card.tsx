import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hoverable?: boolean;
}

export function Card({ padded = true, hoverable, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-card',
        padded && 'p-5',
        hoverable && 'transition duration-200 hover:-translate-y-0.5 hover:shadow-pop',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
