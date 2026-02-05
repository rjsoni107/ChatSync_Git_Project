import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@chatterapp/store/useAuthStore";
import { useChatStore } from "@chatterapp/store/useChatStore";
import { getUserChats } from "@chatterapp/services/chat.service";
import { subscribeChatsRealtime, subscribeUserPresence } from "@chatterapp/services/realtime.service";
import { subscribeMessages, markMessagesAsDelivered } from "@chatterapp/services/message.service";
import NewChatModal from "./NewChatModal";
import { AnimatePresence } from "framer-motion";

import SidebarHeader from "./SidebarHeader";
import ChatList from "./ChatList";
import SidebarSearch from "./SidebarSearch";
import ChatListSkeleton from "./ChatListSkeleton";
import EmptyChatList from "./EmptyChatList";

export default function Sidebar() {
    const user = useAuthStore((s) => s.user);
    const chats = useChatStore((s) => s.chats);
    const setChats = useChatStore((s) => s.setChats);
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const activeChat = useChatStore((s) => s.activeChat);

    const [openSearchUser, setOpenSearchUser] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [presenceMap, setPresenceMap] = useState({});

    /* 1️⃣ INITIAL LOAD */
    useEffect(() => {
        if (!user) return;

        const loadChats = async () => {
            setLoading(true);
            try {
                const data = await getUserChats(user.$id);
                if (!data || data.length === 0) {
                    setActiveChat(null);
                }
                const sorted = data.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
                setChats(sorted);

                // Initialize presence map from fetched user data
                const initialPresence = {};
                data.forEach(c => {
                    if (c.otherUser) {
                        initialPresence[c.otherUser.$id] = c.otherUser.isOnline;
                    }
                });
                setPresenceMap(initialPresence);
            } catch (err) {
                console.error("Failed to load chats:", err);
            } finally {
                setLoading(false);
            }
        };
        loadChats();
    }, [user, setActiveChat, setChats]);

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
                                const { getOtherUserFromChat } = await import("@chatterapp/services/chat.service");
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
    }, [user, setChats]);

    /* 2.5️⃣ PRESENCE UPDATES */
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeUserPresence((event) => {
            if (event.payload) {
                setPresenceMap(prev => ({
                    ...prev,
                    [event.payload.$id]: event.payload.isOnline
                }));
            }
        });
        return () => unsubscribe();
    }, [user]);

    /* 3️⃣ RESET UNREAD ON CLICK */
    useEffect(() => {
        if (!activeChat?.$id) return;
        setChats((prev) => prev.map((c) => c.$id === activeChat.$id ? { ...c, unreadCount: 0 } : c));
    }, [activeChat?.$id, setChats]);

    /* 4️⃣ MESSAGE SEEN UPDATES */
    /* 4️⃣ MESSAGE UPDATES (Seen, Delete, etc) */
    useEffect(() => {
        if (!user) return;
        const unsub = subscribeMessages(async (event) => {
            // Check if it's a deletion event
            const isDelete = event.events && event.events.some(e => e.includes('.delete'));
            const msg = event.payload;

            if (isDelete) {
                // If a message was deleted, refresh everything to be safe
                const data = await getUserChats(user.$id);
                const sorted = data.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
                setChats(sorted);
            } else if (event.events.some(e => e.includes('.create'))) {
                // If a new message arrived from another user, mark as delivered
                if (msg.senderId !== user.$id && !msg.isDelivered) {
                    markMessagesAsDelivered(msg.chatId, user.$id);
                }
            } else if (msg.isSeen) {
                // When a message is marked as seen, we need to refresh unread counts
                const data = await getUserChats(user.$id);
                const sorted = data.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
                setChats(sorted);
            }
        });
        return () => unsub();
    }, [user, setChats]);

    /* 5️⃣ FILTERING LOGIC */
    const filteredChats = useMemo(() => {
        return chats.filter((chat) => {
            // Filter by search term
            const matchesSearch =
                chat.otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());

            // Filter by chips
            let matchesFilter = true;
            if (filter === "unread") {
                matchesFilter = (chat.unreadCount || 0) > 0;
            } else if (filter === "favourites") {
                // Placeholder: currently not implemented in backend
                matchesFilter = false;
            } else if (filter === "groups") {
                // Placeholder: currently not implemented in backend
                matchesFilter = chat.type === "group";
            }

            return matchesSearch && matchesFilter;
        });
    }, [chats, searchTerm, filter]);

    return (
        <div className="h-full flex flex-col bg-[#0f172a] relative overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <SidebarHeader onAddChat={() => setOpenSearchUser(true)} />

                {/* Search & Filter Section */}
                <SidebarSearch
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    activeFilter={filter}
                    onFilterChange={setFilter}
                />

                {loading ? (
                    <ChatListSkeleton />
                ) : chats.length === 0 ? (
                    <EmptyChatList onStartChat={() => setOpenSearchUser(true)} />
                ) : (
                    <ChatList
                        chats={filteredChats}
                        activeChat={activeChat}
                        presenceMap={presenceMap}
                        onChatSelect={(chat) => setActiveChat(chat)}
                    />
                )}
            </div>

            <AnimatePresence>
                {openSearchUser && <NewChatModal onClose={() => setOpenSearchUser(false)} />}
            </AnimatePresence>
        </div>
    );
}
