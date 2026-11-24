import { GraduationCap } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  const name = useAppSelector((state) => state.admin.settings.platformName);
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-fg shadow-sm">
        <GraduationCap className="h-5 w-5" aria-hidden />
      </span>
      {!collapsed && <span className="text-lg font-bold tracking-tight text-fg">{name}</span>}
    </span>
  );
}
