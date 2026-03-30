import { create } from 'zustand';

interface ConversationsStore {
  hiddenConversationIds: Set<string>;
  addHiddenConversation: (conversationId: string) => void;
  removeHiddenConversation: (conversationId: string) => void;
  clearHiddenConversations: () => void;
}

export const useConversationsStore = create<ConversationsStore>((set) => ({
  hiddenConversationIds: new Set(),
  addHiddenConversation: (conversationId: string) =>
    set((state) => ({
      hiddenConversationIds: new Set([...state.hiddenConversationIds, conversationId]),
    })),
  removeHiddenConversation: (conversationId: string) =>
    set((state) => {
      const newSet = new Set(state.hiddenConversationIds);
      newSet.delete(conversationId);
      return { hiddenConversationIds: newSet };
    }),
  clearHiddenConversations: () => set({ hiddenConversationIds: new Set() }),
}));
