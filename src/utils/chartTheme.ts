import type { ThemeMode } from '@/features/theme/themeSlice';

export function chartTheme(mode: ThemeMode) {
  const dark = mode === 'dark';
  return {
    brand: dark ? '#818cf8' : '#4f46e5',
    warn: dark ? '#fbbf24' : '#d97706',
    palette: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#f97316', '#14b8a6', '#ef4444', '#84cc16'],
    accent: dark ? '#34d399' : '#059669',
    grid: dark ? '#272f48' : '#e2e6f0',
    text: dark ? '#94a0b8' : '#64748b',
    tooltipBg: dark ? '#111626' : '#ffffff',
    tooltipBorder: dark ? '#272f48' : '#e2e6f0',
    tooltipText: dark ? '#e9edf7' : '#0f172a',
  };
}
