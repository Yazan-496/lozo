import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  setOnline: (v: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true, // optimistic default; corrected in App.tsx on mount
  setOnline: (v) => set({ isOnline: v }),
}));
