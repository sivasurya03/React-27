import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Tooltip({ content, children, className }: { content: string; children: ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? id : undefined}
    >
      {children}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={cn('pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-pop dark:bg-slate-100 dark:text-slate-900', className)}
        >
          {content}
        </span>
      )}
    </span>
  );
}
