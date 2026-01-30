import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/Sidebar/Sidebar";
import MiniSidebar from "../components/Sidebar/MiniSidebar";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useState } from "react";
import EditUserProfile from "../components/Sidebar/EditUserProfile";
import { AnimatePresence } from "framer-motion";

export default function Chats() {
    const user = useAuthStore((s) => s.user);
    const [editUserOpen, setEditUserOpen] = useState(false);

    return (
        <div className="h-screen flex bg-[#0b141a] text-white overflow-hidden">
            {/* 1. Mini Sidebar (Vertical Nav) */}
            <MiniSidebar user={user} onEditProfile={() => setEditUserOpen(true)} />

            {/* 2. Main Sidebar (Chat List) */}
            <div className="w-[400px] flex-shrink-0 border-r border-white/5">
                <Sidebar />
            </div>

            {/* 3. Chat Window */}
            <div className="flex-1 relative">
                <ChatWindow />
            </div>

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
