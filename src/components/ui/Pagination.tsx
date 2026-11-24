import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const base = 'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm transition disabled:opacity-40';
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)} className={cn(base, 'text-muted hover:bg-subtle')}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
          className={cn(base, p === page ? 'bg-brand text-brand-fg' : 'text-fg hover:bg-subtle')}
        >
          {p}
        </button>
      ))}
      <button type="button" aria-label="Next page" disabled={page === totalPages} onClick={() => onChange(page + 1)} className={cn(base, 'text-muted hover:bg-subtle')}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
