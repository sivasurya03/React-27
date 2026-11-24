import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { loadFromStorage, STORAGE_KEYS } from '@/utils/storage';

export type ThemeMode = 'light' | 'dark';

const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const stored = loadFromStorage<ThemeMode>(STORAGE_KEYS.theme);
const initialState: { mode: ThemeMode } = { mode: stored ?? (systemPrefersDark() ? 'dark' : 'light') };

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
