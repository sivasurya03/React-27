import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useDialogFocus, useEscape, useLockScroll } from '@/hooks/useOverlay';
import { cn } from '@/utils/cn';
import { fadeIn } from '@/utils/motion';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const closeButton = (onClose: () => void) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Close"
    className="rounded-lg p-1.5 text-muted transition hover:bg-subtle hover:text-fg"
  >
    <X className="h-5 w-5" />
  </button>
);

const Backdrop = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
    variants={fadeIn}
    initial="hidden"
    animate="visible"
    exit="hidden"
    onClick={onClose}
  />
);

const MODAL_SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' } as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: OverlayProps & { description?: string; footer?: ReactNode; size?: keyof typeof MODAL_SIZES }) {
  useLockScroll(open);
  useEscape(open, onClose);
  const dialog = useDialogFocus(open);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <Backdrop onClose={onClose} />
          <motion.div
            ref={dialog.ref}
            tabIndex={-1}
            onKeyDown={dialog.onKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn('relative flex max-h-[90vh] outline-none w-full flex-col rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl', MODAL_SIZES[size])}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div>
                <h2 className="text-lg font-semibold text-fg">{title}</h2>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              {closeButton(onClose)}
            </div>
            <div className="overflow-y-auto p-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, side = 'left' }: OverlayProps & { side?: 'left' | 'right' }) {
  useLockScroll(open);
  useEscape(open, onClose);
  const dialog = useDialogFocus(open);
  const offset = side === 'left' ? -320 : 320;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <Backdrop onClose={onClose} />
          <motion.aside
            ref={dialog.ref}
            tabIndex={-1}
            onKeyDown={dialog.onKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn('absolute inset-y-0 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-pop outline-none', side === 'left' ? 'left-0 border-r border-line' : 'right-0 border-l border-line')}
            initial={{ x: offset }}
            animate={{ x: 0 }}
            exit={{ x: offset }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-fg">{title}</span>
              {closeButton(onClose)}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
