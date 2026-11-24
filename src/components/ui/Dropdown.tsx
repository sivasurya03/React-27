import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEscape } from '@/hooks/useOverlay';
import { cn } from '@/utils/cn';

interface DropdownProps {
  trigger: (state: { open: boolean }) => ReactNode;
  children: (close: () => void) => ReactNode;
  ariaLabel: string;
  align?: 'left' | 'right';
  widthClass?: string;
  triggerClassName?: string;
}

interface Position {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  maxHeight: number;
}

/**
 * Menu rendered in a portal with fixed positioning, so it is never clipped by scrolling table wrappers or
 * overflow-hidden cards. It opens upwards when there is little room below the trigger.
 */
export function Dropdown({ trigger, children, ariaLabel, align = 'right', widthClass = 'w-64', triggerClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useEscape(open, close);

  const place = useCallback((): void => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const up = below < 240 && above > below;
    setPosition({
      ...(up ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
      ...(align === 'right' ? { right: Math.max(8, window.innerWidth - rect.right) } : { left: Math.max(8, rect.left) }),
      maxHeight: Math.max(160, up ? above : below),
    });
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) close();
    };
    const onScroll = (event: Event): void => {
      if (!panelRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, close]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn('rounded-xl transition', triggerClassName)}
      >
        {trigger({ open })}
      </button>
      {createPortal(
        <AnimatePresence>
          {open && position && (
            <motion.div
              ref={panelRef}
              role="menu"
              style={{ position: 'fixed', ...position }}
              className={cn('z-[55] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl border border-line bg-surface shadow-pop', widthClass)}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {children(close)}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

export function DropdownItem({ icon, children, onClick, danger }: { icon?: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-subtle', danger ? 'text-rose-600 dark:text-rose-400' : 'text-fg')}
    >
      {icon}
      {children}
    </button>
  );
}
