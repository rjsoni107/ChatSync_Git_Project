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
    setMessages: (messages) =>
        set((state) => ({
            messages: typeof messages === "function" ? messages(state.messages || []) : messages,
        })),
    addMessage: (msg) =>
        set((state) => {
            const currentMessages = Array.isArray(state.messages) ? state.messages : [];
            const exists = currentMessages.find((m) => m?.$id === msg?.$id);
            if (exists) {
                return {
                    messages: currentMessages.map((m) =>
                        m?.$id === msg?.$id ? { ...m, ...msg } : m
                    ),
                };
            }
            return { messages: [...currentMessages, msg] };
        }),
    addChat: (chat) =>
        set((state) => {
            const currentChats = Array.isArray(state.chats) ? state.chats : [];
            const exists = currentChats.find((c) => c?.$id === chat?.$id);
            if (exists) {
                return {
                    chats: currentChats.map((c) =>
                        c?.$id === chat?.$id ? { ...c, ...chat } : c
                    ),
                };
            }
            return { chats: [chat, ...currentChats] };
        }),
}));