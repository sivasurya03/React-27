import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel,
  tone = 'brand',
  label = 'Progress',
}: {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  tone?: 'brand' | 'success';
  label?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className={cn('w-full overflow-hidden rounded-full bg-subtle', size === 'sm' ? 'h-1.5' : 'h-2.5')}
      >
        <motion.div
          className={cn('h-full rounded-full', tone === 'success' ? 'bg-emerald-500' : 'bg-brand')}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {showLabel && <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-muted">{Math.round(percent)}%</span>}
    </div>
  );
}
