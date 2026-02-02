import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/Sidebar/Sidebar";
import MiniSidebar from "../components/Sidebar/MiniSidebar";
import MobileNav from "../components/Sidebar/MobileNav";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";
import { useEffect, useState } from "react";
import EditUserProfile from "../components/Sidebar/EditUserProfile";
import { AnimatePresence } from "framer-motion";

export default function Chats() {
    const user = useAuthStore((s) => s.user);
    const activeChat = useChatStore((s) => s.activeChat);
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const clearActiveChat = useChatStore((s) => s.clearActiveChat);
    const [editUserOpen, setEditUserOpen] = useState(false);

    // Initial check: If no chats exist, ensure no active chat is selected (fixes mobile view bug)
    // However, we need to wait for chats to load. For now, rely on auth logout clearing it.

    // Handle Mobile Back Button & History
    useEffect(() => {
        const handlePopState = (event) => {
            // If back button is pressed while chat is open, close it
            if (activeChat) {
                setActiveChat(null);
            }
        };

        // If we have an active chat, allow back button handling
        if (activeChat) {
            // Push a history state so back button doesn't exit the app
            // Only push if we haven't already (simple check: state object)
            if (!window.history.state?.chatOpen) {
                window.history.pushState({ chatOpen: true }, "");
            }
        }

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [activeChat, setActiveChat]);

    return (
        <div className="h-[100dvh] md:h-screen flex bg-[#0b141a] text-white overflow-hidden">
            {/* 1. Mini Sidebar (Vertical Nav) */}
            {/* Sidebars Container - Hidden on mobile if chat is active */}
            <div className={`flex flex-shrink-0 ${activeChat ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
                <div className="hidden md:block h-full">
                    <MiniSidebar user={user} onEditProfile={() => setEditUserOpen(true)} />
                </div>
                <div className="w-full md:w-[400px] flex-shrink-0 border-r border-white/5">
                    <Sidebar />
                </div>
            </div>

            {/* 3. Chat Window - Hidden on mobile if no chat is active */}
            <div className={`flex-1 relative justify-center ${!activeChat ? 'hidden md:flex' : 'flex w-full'}`}>
                <ChatWindow />
            </div>

            {/* 4. Mobile Bottom Nav - Visible only on mobile when no chat is active */}
            {!activeChat && (
                <MobileNav user={user} onEditProfile={() => setEditUserOpen(true)} />
            )}

            <AnimatePresence>
                {editUserOpen && (
                    <EditUserProfile
                        onClose={() => setEditUserOpen(false)}
                        user={user}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
