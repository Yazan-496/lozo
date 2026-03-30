import { create } from 'zustand';

interface PresenceState {
  onlineUserIds: Set<string>;
  lastSeenMap: Record<string, string>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string, lastSeenAt: string) => void;
  seedOnline: (userIds: string[]) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: new Set(),
  lastSeenMap: {},

  setOnline: (userId) =>
    set((s) => ({ onlineUserIds: new Set(s.onlineUserIds).add(userId) })),

  setOffline: (userId, lastSeenAt) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.delete(userId);
      return { onlineUserIds: next, lastSeenMap: { ...s.lastSeenMap, [userId]: lastSeenAt } };
    }),

  seedOnline: (userIds) =>
    set({ onlineUserIds: new Set(userIds) }),
}));
