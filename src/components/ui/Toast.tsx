import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ToastVariant = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const TONES: Record<ToastVariant, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-rose-600 dark:text-rose-400',
  info: 'text-sky-600 dark:text-sky-400',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (variant: ToastVariant) => (title: string, description?: string) => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-3), { id, title, description, variant }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ success: push('success'), error: push('error'), info: push('info') }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
        <AnimatePresence>
          {items.map((item) => {
            const Icon = ICONS[item.variant];
            return (
              <motion.div
                key={item.id}
                layout
                role="status"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-pop"
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONES[item.variant])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fg">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
                </div>
                <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(item.id)} className="rounded-md p-1 text-muted hover:bg-subtle hover:text-fg">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
