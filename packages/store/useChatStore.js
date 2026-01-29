import { create } from "zustand";

export const useChatStore = create((set) => ({
    chats: [],
    activeChat: null,
    messages: [],

    setChats: (chats) =>
        set((state) => ({
            chats: typeof chats === "function" ? chats(state.chats) : chats,
        })),
    setActiveChat: (chat) => set({ activeChat: chat }),
    setMessages: (messages) => set({ messages }),
    addMessage: (msg) =>
        set((state) => {
            const exists = state.messages.find((m) => m.$id === msg.$id);
            if (exists) {
                return {
                    messages: state.messages.map((m) =>
                        m.$id === msg.$id ? { ...m, ...msg } : m
                    ),
                };
            }
            return { messages: [...state.messages, msg] };
        }),
    addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
}));