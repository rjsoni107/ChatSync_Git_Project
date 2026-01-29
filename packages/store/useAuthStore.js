//useAuthStore.js
import { create } from "zustand";

export const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    isProfileSynced: false,
    isSyncing: false,

    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null, isProfileSynced: false, isSyncing: false }),
    setLoading: (loading) => set({ loading }),
    setProfileSynced: (isProfileSynced) => set({ isProfileSynced }),
    setSyncing: (isSyncing) => set({ isSyncing }),
}));
