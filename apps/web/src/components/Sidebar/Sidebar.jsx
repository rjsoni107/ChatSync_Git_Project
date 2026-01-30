import { useEffect, useState } from "react";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";
import { getUserChats } from "@chatsync/services/chat.service";
import { subscribeChatsRealtime } from "@chatsync/services/realtime.service";
import { subscribeMessages } from "@chatsync/services/message.service";
import { logout } from "@chatsync/services/auth.service";
import { setUserOffline } from "@chatsync/services/presence.service";
import NewChatModal from "./NewChatModal";
import { AnimatePresence } from "framer-motion";
import { IoSearchOutline } from "react-icons/io5";

import SidebarHeader from "./SidebarHeader";
import ChatList from "./ChatList";

export default function Sidebar() {
    const user = useAuthStore((s) => s.user);
    const chats = useChatStore((s) => s.chats);
    const setChats = useChatStore((s) => s.setChats);
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const activeChat = useChatStore((s) => s.activeChat);
    const [openSearchUser, setOpenSearchUser] = useState(false);
    const [filter, setFilter] = useState("all");
    const filters = ["All", "Unread", "Favourites", "Groups"];

    /* 1️⃣ INITIAL LOAD */
    useEffect(() => {
        if (!user) return;

        const loadChats = async () => {
            const data = await getUserChats(user.$id);
            const sorted = data.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
            setChats(sorted);
        };
        loadChats();
    }, [user]);

    /* 2️⃣ REALTIME UPDATES */
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeChatsRealtime(async (event) => {
            const updatedChat = event.payload;

            setChats((prev) => {
                const state = useChatStore.getState();
                const currentActive = state.activeChat;
                const exists = prev.find((c) => c.$id === updatedChat.$id);

                let updated;
                if (exists) {
                    const isNewMessage = updatedChat.lastMessageAt !== exists.lastMessageAt;
                    const isIncoming = updatedChat.lastSenderId && updatedChat.lastSenderId !== user.$id;
                    const isActive = currentActive?.$id === updatedChat.$id;

                    updated = prev.map((c) => {
                        if (c.$id === updatedChat.$id) {
                            return {
                                ...c,
                                ...updatedChat,
                                otherUser: c.otherUser || updatedChat.otherUser,
                                lastMessageSeen: isNewMessage ? false : c.lastMessageSeen,
                                unreadCount: (isNewMessage && isIncoming && !isActive)
                                    ? (c.unreadCount || 0) + 1
                                    : (isActive ? 0 : c.unreadCount)
                            };
                        }
                        return c;
                    });
                } else {
                    const inStore = state.chats.find(c => c.$id === updatedChat.$id);
                    if (inStore && inStore.otherUser) {
                        updated = [{ ...inStore, ...updatedChat, lastMessageSeen: false }, ...prev];
                    } else {
                        updated = [{ ...updatedChat, unreadCount: updatedChat.lastSenderId !== user.$id ? 1 : 0, lastMessageSeen: false }, ...prev];
                        (async () => {
                            try {
                                const { getOtherUserFromChat } = await import("@chatsync/services/chat.service");
                                const freshOtherUser = await getOtherUserFromChat(updatedChat.$id, user.$id);
                                if (freshOtherUser) {
                                    setChats(currentChats => currentChats.map(c =>
                                        c.$id === updatedChat.$id ? { ...c, otherUser: freshOtherUser } : c
                                    ));
                                }
                            } catch (err) {
                                console.error("New chat user fetch failed:", err);
                            }
                        })();
                    }
                }

                return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
            });
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!activeChat?.$id) return;
        setChats((prev) => prev.map((c) => c.$id === activeChat.$id ? { ...c, unreadCount: 0 } : c));
    }, [activeChat?.$id, setChats]);

    /* 4️⃣ MESSAGE SEEN UPDATES */
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeMessages((msg) => {
            if (msg.isSeen) {
                setChats((prev) => prev.map((c) =>
                    c.$id === msg.chatId ? { ...c, lastMessageSeen: true } : c
                ));
            }
        });
        return () => unsub();
    }, [user]);

    return (
        <div className="h-full flex flex-col bg-[#111b21] relative overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <SidebarHeader onAddChat={() => setOpenSearchUser(true)} />

                {/* Search & Filter Section */}
                <div className="px-4 pb-2 space-y-3">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00a884] transition-colors">
                            <IoSearchOutline size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="w-full bg-[#202c33] border-none rounded-lg py-1.5 pl-12 pr-4 text-sm text-white placeholder-gray-400 focus:ring-0 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {filters.map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f.toLowerCase())}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filter === f.toLowerCase()
                                    ? "bg-[#00a884] text-[#111b21]"
                                    : "bg-[#202c33] text-gray-400 hover:bg-[#2a3942]"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <ChatList
                    chats={chats}
                    activeChat={activeChat}
                    onChatSelect={(chat) => setActiveChat(chat)}
                />
            </div>

            <AnimatePresence>
                {openSearchUser && <NewChatModal onClose={() => setOpenSearchUser(false)} />}
            </AnimatePresence>
        </div>
    );
}
