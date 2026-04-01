import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',

  setMode: (mode) => {
    SecureStore.setItemAsync('themeMode', mode);
    set({ mode });
  },

  hydrate: async () => {
    const stored = (await SecureStore.getItemAsync('themeMode')) as ThemeMode | null;
    if (stored) set({ mode: stored });
  },
}));
