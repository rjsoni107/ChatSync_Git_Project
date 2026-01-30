import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/Sidebar/Sidebar";
import MiniSidebar from "../components/Sidebar/MiniSidebar";
import MobileNav from "../components/Sidebar/MobileNav";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";
import { useState } from "react";
import EditUserProfile from "../components/Sidebar/EditUserProfile";
import { AnimatePresence } from "framer-motion";

export default function Chats() {
    const user = useAuthStore((s) => s.user);
    const activeChat = useChatStore((s) => s.activeChat);
    const [editUserOpen, setEditUserOpen] = useState(false);

    return (
        <div className="h-screen flex bg-[#0b141a] text-white overflow-hidden">
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
            <div className={`flex-1 relative ${!activeChat ? 'hidden md:flex' : 'flex w-full'}`}>
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
