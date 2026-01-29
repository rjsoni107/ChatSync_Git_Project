import { useEffect, useState } from "react";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";
import { getUserChats } from "@chatsync/services/chat.service";
import { subscribeChatsRealtime } from "@chatsync/services/realtime.service";
import { logout } from "@chatsync/services/auth.service";
import { setUserOffline } from "@chatsync/services/presence.service";
import NewChatModal from "./NewChatModal";

export default function Sidebar() {
    const user = useAuthStore((s) => s.user);
    const chats = useChatStore((s) => s.chats);
    const setChats = useChatStore((s) => s.setChats);
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const activeChat = useChatStore((s) => s.activeChat);
    const clearUser = useAuthStore((s) => s.clearUser);
    const [open, setOpen] = useState(false);

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
                                ...updatedChat, // 🔥 Updates lastMessage, lastMessageAt, etc.
                                unreadCount: (isNewMessage && isIncoming && !isActive)
                                    ? (c.unreadCount || 0) + 1
                                    : (isActive ? 0 : c.unreadCount)
                            };
                        }
                        return c;
                    });
                } else {
                    // New chat detected! Add it immediately and we'll try to fetch otherUser profile
                    updated = [{ ...updatedChat, unreadCount: updatedChat.lastSenderId !== user.$id ? 1 : 0 }, ...prev];

                    // Trigger async profile fetch for this new chat specifically
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
            // 1️⃣ Mark offline
            await setUserOffline(user.$id);
            // 2️⃣ Kill Appwrite session
            await logout();
            // 3️⃣ Clear local store (triggers redirect)
            clearUser();
        } catch (err) {
            console.error("Logout failed:", err);
            // Even if it fails, clear the local store so the user isn't stuck
            clearUser();
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <div className="p-4 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Chats</h2>
                    <button
                        onClick={() => setOpen(true)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors group shadow-lg"
                        title="New Chat"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 text-white"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                            />
                        </svg>
                    </button>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                    {chats.map((chat) => (
                        <div
                            key={chat.$id}
                            onClick={() => setActiveChat(chat)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${activeChat?.$id === chat.$id
                                ? "bg-gray-800"
                                : "hover:bg-gray-800/50"
                                }`}
                        >
                            <div className="flex-1 overflow-hidden">
                                <p className={`font-medium ${chat.unreadCount > 0 ? "text-white" : "text-gray-200"}`}>
                                    {chat.otherUser?.name || "Unknown User"}
                                </p>

                                <p className={`text-xs truncate ${chat.unreadCount > 0 ? "text-white font-bold" : "text-gray-400"}`}>
                                    {chat.lastMessage || "No messages yet"}
                                </p>

                                {chat.lastMessageAt && (
                                    <span className="text-[10px] text-gray-500">
                                        {new Date(chat.lastMessageAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                )}
                            </div>

                            {chat.unreadCount > 0 && (
                                <div className="ml-2 bg-green-500 text-gray-950 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-300">
                                    {chat.unreadCount}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {open && <NewChatModal onClose={() => setOpen(false)} />}

            {/* 👤 USER FOOTER */}
            <div className="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold flex-shrink-0 text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate text-white">{user?.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
