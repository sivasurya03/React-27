import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn('animate-pulse rounded-lg bg-subtle', className)} />
);

export const Spinner = ({ className, label = 'Loading' }: { className?: string; label?: string }) => (
  <span role="status" className="inline-flex items-center">
    <Loader2 className={cn('h-5 w-5 animate-spin text-brand-text', className)} aria-hidden />
    <span className="sr-only">{label}</span>
  </span>
);

export function EmptyState({ icon: Icon = Inbox, title, description, action }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand-text">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {onRetry && (
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
