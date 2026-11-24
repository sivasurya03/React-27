import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AccordionItemProps {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Provide both to control the item from outside (e.g. "expand all"). */
  open?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function AccordionItem({ title, meta, children, defaultOpen = false, open, onToggle, className }: AccordionItemProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const id = useId();
  const isOpen = open ?? internal;

  return (
    <div className={cn('border-b border-line last:border-b-0', className)}>
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={id}
          onClick={onToggle ?? (() => setInternal((v) => !v))}
          className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left transition hover:text-brand-text"
        >
          <span className="min-w-0 font-medium text-fg">{title}</span>
          <span className="flex shrink-0 items-center gap-3 text-sm text-muted">
            {meta}
            <ChevronDown className={cn('h-5 w-5 transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={id}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
