import { useState } from 'react';
import { cn } from '@/utils/cn';

const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' } as const;
const TONES = [
  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
];

const initials = (name: string): string =>
  name.replace(/^dr\.\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

export interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const tone = TONES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length];

  if (src && !failed) {
    return <img src={src} alt={name} onError={() => setFailed(true)} className={cn('shrink-0 rounded-full object-cover', SIZES[size], className)} />;
  }
  return (
    <span role="img" aria-label={name} className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', SIZES[size], tone, className)}>
      {initials(name)}
    </span>
  );
}
