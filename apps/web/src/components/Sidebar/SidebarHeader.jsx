import { motion, AnimatePresence } from "framer-motion";
import {
    IoPersonAddSharp,
    IoEllipsisVertical,
    IoPeopleOutline,
    IoStarOutline,
    IoCheckmarkDoneOutline,
    IoLockClosedOutline,
    IoLogOutOutline,
    IoListOutline
} from "react-icons/io5";
import { useState } from "react";
import { logout } from "@chatterapp/services/auth.service";
import { useAuthStore } from "@chatterapp/store/useAuthStore";
import { setUserOffline } from "@chatterapp/services/presence.service";

export default function SidebarHeader({ onAddChat }) {
    const [showMenu, setShowMenu] = useState(false);
    const user = useAuthStore(s => s.user);
    const clearUser = useAuthStore(s => s.clearUser);

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

    const menuItems = [
        { icon: IoPeopleOutline, label: "New group" },
        { icon: IoStarOutline, label: "Starred messages" },
        { icon: IoListOutline, label: "Select chats" },
        { icon: IoCheckmarkDoneOutline, label: "Mark all as read" },
        { icon: IoLockClosedOutline, label: "App lock" },
        { icon: IoLogOutOutline, label: "Log out", onClick: handleLogout, color: "text-red-400" },
    ];

    return (
        <div className="p-4 flex items-center justify-between bg-[#0f172a] z-30">
            <h2 className="text-xl font-bold text-white tracking-tight">ChatterApp</h2>

            <div className="flex items-center gap-1">
                <motion.button
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddChat}
                    className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                    <IoPersonAddSharp size={20} />
                </motion.button>

                <div className="relative">
                    <motion.button
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-2 rounded-full transition-colors ${showMenu ? "text-blue-500 bg-white/5" : "text-gray-400"}`}
                    >
                        <IoEllipsisVertical size={20} />
                    </motion.button>

                    <AnimatePresence>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-56 bg-[#233138] rounded-lg shadow-2xl py-2 z-50 border border-white/5"
                                >
                                    {menuItems.map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                item.onClick?.();
                                                setShowMenu(false);
                                            }}
                                            className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-200 hover:bg-[#182229] transition-colors ${item.color || ""}`}
                                        >
                                            <item.icon size={18} className="opacity-70" />
                                            {item.label}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
