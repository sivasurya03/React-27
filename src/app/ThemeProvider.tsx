import { useEffect, type ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';

/** Keeps the <html> element in sync with the persisted theme (Tailwind `dark` class strategy). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppSelector((state) => state.theme.mode);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;
  }, [mode]);
  return <>{children}</>;
}
