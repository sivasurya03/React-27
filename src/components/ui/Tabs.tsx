import { useId, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({ tabs, value, onChange, className }: { tabs: TabItem[]; value: string; onChange: (id: string) => void; className?: string }) {
  const group = useId();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const index = tabs.findIndex((tab) => tab.id === value);
    if (event.key === 'ArrowRight') onChange(tabs[(index + 1) % tabs.length].id);
    if (event.key === 'ArrowLeft') onChange(tabs[(index - 1 + tabs.length) % tabs.length].id);
  };

  return (
    <div role="tablist" onKeyDown={onKeyDown} className={cn('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn('relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition', active ? 'text-brand-text' : 'text-muted hover:text-fg')}
          >
            {tab.label}
            {tab.count !== undefined && <span className="ml-1.5 rounded-full bg-subtle px-1.5 py-0.5 text-xs">{tab.count}</span>}
            {active && <motion.span layoutId={`tab-underline-${group}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        );
      })}
    </div>
  );
}
