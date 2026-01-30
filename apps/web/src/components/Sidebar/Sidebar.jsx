import { useEffect, useState } from "react";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";
import { getUserChats } from "@chatsync/services/chat.service";
import { subscribeChatsRealtime } from "@chatsync/services/realtime.service";
import { logout } from "@chatsync/services/auth.service";
import { setUserOffline } from "@chatsync/services/presence.service";
import NewChatModal from "./NewChatModal";
import EditUserProfile from "./EditUserProfile";
import { AnimatePresence } from "framer-motion";

import SidebarHeader from "./SidebarHeader";
import ChatList from "./ChatList";
import SidebarFooter from "./SidebarFooter";

export default function Sidebar() {
    const user = useAuthStore((s) => s.user);
    const chats = useChatStore((s) => s.chats);
    const setChats = useChatStore((s) => s.setChats);
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const activeChat = useChatStore((s) => s.activeChat);
    const clearUser = useAuthStore((s) => s.clearUser);
    const [openSearchUser, setOpenSearchUser] = useState(false);
    const [editUserOpen, setEditUserOpen] = useState(false);

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
                        updated = [{ ...inStore, ...updatedChat }, ...prev];
                    } else {
                        updated = [{ ...updatedChat, unreadCount: updatedChat.lastSenderId !== user.$id ? 1 : 0 }, ...prev];
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

    /* 3️⃣ RESET UNREAD ON CLICK */
    useEffect(() => {
        if (!activeChat?.$id) return;
        setChats((prev) => prev.map((c) => c.$id === activeChat.$id ? { ...c, unreadCount: 0 } : c));
    }, [activeChat?.$id, setChats]);

    const handleLogout = async () => {
        if (!user) return;
        try {
            await setUserOffline(user.$id);
            await logout();
            clearUser();
        } catch (err) {
            console.error("Logout failed:", err);
            clearUser();
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0b141a] border-r border-white/5 shadow-2xl relative overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
                <SidebarHeader onAddChat={() => setOpenSearchUser(true)} />
                <ChatList
                    chats={chats}
                    activeChat={activeChat}
                    onChatSelect={(chat) => setActiveChat(chat)}
                />
            </div>

            <SidebarFooter
                user={user}
                onEditProfile={() => setEditUserOpen(true)}
                onLogout={handleLogout}
            />

            <AnimatePresence>
                {openSearchUser && <NewChatModal onClose={() => setOpenSearchUser(false)} />}
                {editUserOpen && <EditUserProfile onClose={() => setEditUserOpen(false)} user={user} />}
            </AnimatePresence>
        </div>
    );
}
