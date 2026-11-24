import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui';
import { slideUp } from '@/utils/motion';

/** Must be rendered inside a motion parent using `staggerChildren` (inherits the variants). */
export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string; icon: LucideIcon; hint?: string }) {
  return (
    <motion.div variants={slideUp}>
      <Card className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-fg">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-text">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
