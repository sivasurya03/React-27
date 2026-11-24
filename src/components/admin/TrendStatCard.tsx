import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn } from '@/utils/cn';
import { slideUp } from '@/utils/motion';

/** KPI card with a trend line. Must sit inside a motion parent that staggers children. */
export function TrendStatCard({ label, value, change, icon: Icon, hint = 'vs last month' }: { label: string; value: string; change: number; icon: LucideIcon; hint?: string }) {
  const up = change > 0;
  const flat = change === 0;
  const TrendIcon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <motion.div variants={slideUp}>
      <Card className="h-full transition duration-200 hover:-translate-y-0.5 hover:shadow-pop">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-fg">{value}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-text"><Icon className="h-5 w-5" aria-hidden /></span>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={cn('inline-flex items-center gap-0.5 font-semibold', flat ? 'text-muted' : up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            <TrendIcon className="h-3.5 w-3.5" aria-hidden />{flat ? '0%' : `${up ? '+' : ''}${change}%`}
          </span>
          <span className="text-muted">{hint}</span>
        </p>
      </Card>
    </motion.div>
  );
}
