import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    SecureStore.setItemAsync('accessToken', accessToken);
    SecureStore.setItemAsync('refreshToken', refreshToken);
    SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  setTokens: (accessToken, refreshToken) => {
    SecureStore.setItemAsync('accessToken', accessToken);
    SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => {
    SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    SecureStore.deleteItemAsync('accessToken');
    SecureStore.deleteItemAsync('refreshToken');
    SecureStore.deleteItemAsync('user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    const userStr = await SecureStore.getItemAsync('user');
    const user = userStr ? JSON.parse(userStr) : null;

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,
      isLoading: false,
    });
  },
}));
