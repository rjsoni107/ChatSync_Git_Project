import { useEffect, useState } from "react";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";
import { getUserChats } from "@chatsync/services/chat.service";
import { subscribeChatsRealtime } from "@chatsync/services/realtime.service";
import { logout } from "@chatsync/services/auth.service";
import { setUserOffline } from "@chatsync/services/presence.service";
import NewChatModal from "./NewChatModal";
import { IoPersonAddSharp, IoLogOutOutline } from "react-icons/io5";
import Avatar from "./Avatar";
import EditUserProfile from "./EditUserProfile";
import { motion, AnimatePresence } from "framer-motion";

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

            const sorted = data.sort(
                (a, b) =>
                    new Date(b.lastMessageAt || 0) -
                    new Date(a.lastMessageAt || 0)
            );

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
                                otherUser: c.otherUser || updatedChat.otherUser, // 🛡️ Preserve existing user data
                                unreadCount: (isNewMessage && isIncoming && !isActive)
                                    ? (c.unreadCount || 0) + 1
                                    : (isActive ? 0 : c.unreadCount)
                            };
                        }
                        return c;
                    });
                } else {
                    // Check if it's already in the store (manual add might have hit FIRST)
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

                return updated.sort((a, b) =>
                    new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
                );
            });
        });

        return () => unsubscribe();
    }, [user]);

    /* 3️⃣ RESET UNREAD ON CLICK */
    useEffect(() => {
        if (!activeChat?.$id) return;

        setChats((prev) =>
            prev.map((c) =>
                c.$id === activeChat.$id ? { ...c, unreadCount: 0 } : c
            )
        );
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
                {/* 🎒 HEADER */}
                <div className="p-5 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
                    <h2 className="text-2xl font-black text-white tracking-tight italic opacity-90">ChatSync</h2>
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 1)' }}
                        whileTap={{ scale: 0.95 }}
                        title='Add friend'
                        onClick={() => setOpenSearchUser(true)}
                        className='w-10 h-10 flex justify-center items-center cursor-pointer bg-blue-600 rounded-[14px] text-white shadow-lg shadow-blue-600/20'
                    >
                        <IoPersonAddSharp size={18} />
                    </motion.button>
                </div>

                {/* 💬 CHAT LIST */}
                <div className="flex-1 overflow-y-auto mt-2 px-3 space-y-1 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {chats.map((chat) => {
                            const isActive = activeChat?.$id === chat.$id;
                            const hasUnread = chat.unreadCount > 0;

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    key={chat.$id}
                                    onClick={() => setActiveChat(chat)}
                                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all duration-300 group flex items-center gap-3.5 ${isActive
                                        ? "bg-white/10 shadow-lg shadow-black/20"
                                        : "hover:bg-white/5"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute left-0 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
                                        />
                                    )}

                                    <div className="relative">
                                        <Avatar
                                            width={40}
                                            height={40}
                                            imageUrl={chat.otherUser?.profile_pic}
                                            name={chat.otherUser?.name}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className={`text-[15px] font-bold truncate ${hasUnread ? "text-white" : "text-gray-200"}`}>
                                                {chat.otherUser?.name || "Unknown User"}
                                            </p>

                                            {hasUnread && (
                                                <motion.div
                                                    initial={{ scale: 0.5 }}
                                                    animate={{ scale: 1 }}
                                                    className="bg-blue-600 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/40"
                                                >
                                                    {chat.unreadCount}
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-xs truncate flex-1 leading-relaxed ${hasUnread ? "text-gray-100 font-semibold" : "text-gray-400 font-medium"}`}>
                                                {chat.lastMessage || "Start a conversation..."}
                                            </p>

                                            {chat.lastMessageAt && (
                                                <span className={` text-[9px] font-bold uppercase tracking-tight ${hasUnread ? "text-blue-400" : "text-gray-500"}`}>
                                                    {new Intl.DateTimeFormat([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }).format(new Date(chat.lastMessageAt))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {openSearchUser && <NewChatModal onClose={() => setOpenSearchUser(false)} />}
                {editUserOpen && <EditUserProfile onClose={() => setEditUserOpen(false)} user={user} />}
            </AnimatePresence>

            {/* 👤 USER FOOTER */}
            <div className="p-5 border-t border-white/5 bg-[#111b21] flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden group">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditUserOpen(true)}
                        className='relative'
                    >
                        <Avatar
                            width={42}
                            height={42}
                            name={user?.name}
                            imageUrl={user?.profile_pic}
                        />
                        <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-blue-500/50 transition-colors" />
                    </motion.button>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate text-white tracking-tight">{user?.name}</p>
                        <p className="text-[10px] text-gray-500 truncate font-medium">@{user?.username}</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.1, color: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLogout}
                    className="p-2 text-gray-500 transition-colors"
                    title="Logout"
                >
                    <IoLogOutOutline size={24} />
                </motion.button>
            </div>
        </div>
    );
}
