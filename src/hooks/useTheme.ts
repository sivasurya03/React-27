import { setTheme, toggleTheme, type ThemeMode } from '@/features/theme/themeSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function useTheme() {
  const mode = useAppSelector((state) => state.theme.mode);
  const dispatch = useAppDispatch();

  const animate = (): void => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 300);
  };
  const toggle = (): void => {
    animate();
    dispatch(toggleTheme());
  };
  const setMode = (next: ThemeMode): void => {
    animate();
    dispatch(setTheme(next));
  };

  return { mode, isDark: mode === 'dark', toggle, setMode };
}
