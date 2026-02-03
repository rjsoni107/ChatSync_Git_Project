import { create } from "zustand";

export const useChatStore = create((set) => ({
    chats: [],
    activeChat: (() => {
        if (typeof window !== "undefined" && window.localStorage) {
            try {
                return JSON.parse(localStorage.getItem("activeChat"));
            } catch (e) {
                return null;
            }
        }
        return null;
    })(),
    messages: [],

    setChats: (chats) =>
        set((state) => ({
            chats: typeof chats === "function" ? chats(state.chats) : chats,
        })),
    setActiveChat: (chat) => {
        if (typeof window !== "undefined" && window.localStorage) {
            if (chat) {
                localStorage.setItem("activeChat", JSON.stringify(chat));
            } else {
                localStorage.removeItem("activeChat");
            }
        }
        set({ activeChat: chat });
    },
    clearActiveChat: () => {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.removeItem("activeChat");
        }
        set({ activeChat: null, messages: [] });
    },
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
    addChat: (chat) =>
        set((state) => {
            const exists = state.chats.find((c) => c.$id === chat.$id);
            if (exists) {
                return {
                    chats: state.chats.map((c) =>
                        c.$id === chat.$id ? { ...c, ...chat } : c
                    ),
                };
            }
            return { chats: [chat, ...state.chats] };
        }),
}));