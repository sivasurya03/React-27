import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Five stars plus the numeric value; `count` renders the review count in brackets. */
export function Rating({ value, count, size = 'sm', className }: { value: number; count?: number; size?: 'sm' | 'md'; className?: string }) {
  const icon = size === 'md' ? 'h-[18px] w-[18px]' : 'h-3.5 w-3.5';
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} role="img" aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? ` from ${count} reviews` : ''}`}>
      <span className={cn('font-semibold text-amber-600 dark:text-amber-400', size === 'md' ? 'text-base' : 'text-sm')}>{value.toFixed(1)}</span>
      <span className="flex" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn(icon, i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-line')} />
        ))}
      </span>
      {count !== undefined && <span className="text-sm text-muted">({count})</span>}
    </span>
  );
}
