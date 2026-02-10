import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
    unreadMessagesCount: 0,
    pendingRequestsCount: 0,

    setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),
    setPendingRequestsCount: (count) => set({ pendingRequestsCount: count }),

    incrementUnreadMessages: () => set((state) => ({ unreadMessagesCount: state.unreadMessagesCount + 1 })),
    decrementUnreadMessages: () => set((state) => ({ unreadMessagesCount: Math.max(0, state.unreadMessagesCount - 1) })),

    incrementPendingRequests: () => set((state) => ({ pendingRequestsCount: state.pendingRequestsCount + 1 })),
    decrementPendingRequests: () => set((state) => ({ pendingRequestsCount: Math.max(0, state.pendingRequestsCount - 1) })),
}));
