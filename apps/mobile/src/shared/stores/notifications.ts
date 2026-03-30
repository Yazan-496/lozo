import { create } from 'zustand';

interface NotificationsState {
  pendingRequestsCount: number;
  totalUnreadMessages: number;
  setPendingRequestsCount: (n: number) => void;
  setTotalUnreadMessages: (n: number) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  pendingRequestsCount: 0,
  totalUnreadMessages: 0,
  setPendingRequestsCount: (n) => set({ pendingRequestsCount: n }),
  setTotalUnreadMessages: (n) => set({ totalUnreadMessages: n }),
}));
