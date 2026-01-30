import { useEffect, useState } from "react";
import { subscribeSingleUserPresence } from "@chatsync/services/realtime.service";
import { formatLastSeen } from "../../../../packages/utils/date";
import Avatar from "./Avatar";
import { motion, AnimatePresence } from "framer-motion";
import { IoEllipsisHorizontal, IoEllipsisVertical, IoExitOutline } from "react-icons/io5";
import { useChatStore } from "@chatsync/store/useChatStore";

export default function ChatHeader({ otherUser }) {
    const [userSnapshot, setUserSnapshot] = useState(otherUser);
    const [showMenu, setShowMenu] = useState(false);
    const clearActiveChat = useChatStore((s) => s.clearActiveChat);

    const isUserOnline = (user) => {
        if (!user) return false;
        if (user.isOnline === false) return false;
        if (!user.lastActiveAt) return false;
        const diff = Date.now() - new Date(user.lastActiveAt).getTime();
        return diff < 60000;
    };

    const [, setTick] = useState(0);

    useEffect(() => {
        if (!otherUser?.$id) return;

        const fetchFreshUser = async () => {
            try {
                const { getUserProfile } = await import("@chatsync/services/user.service");
                const freshUser = await getUserProfile(otherUser.$id);
                setUserSnapshot(freshUser);
            } catch (err) {
                console.error("Failed to fetch fresh user profile", err);
                setUserSnapshot(otherUser);
            }
        };

        fetchFreshUser();

        const unsub = subscribeSingleUserPresence(
            otherUser.$id,
            (updatedUser) => {
                setUserSnapshot(updatedUser);
            }
        );

        const interval = setInterval(() => setTick((t) => t + 1), 30000);

        return () => {
            unsub();
            clearInterval(interval);
        };
    }, [otherUser?.$id]);

    if (!userSnapshot && !otherUser) {
        return (
            <div className="py-2 px-4 flex items-center gap-4 bg-[#111b21]/80 backdrop-blur-xl border-b border-white/5 h-[64px]">
                <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
                <div className="space-y-2">
                    <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
                    <div className="w-16 h-3 bg-white/5 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    const online = isUserOnline(userSnapshot);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-2 px-4 flex items-center justify-between bg-[#111b21]/80 backdrop-blur-xl border-b border-white/5 z-20 shadow-lg relative"
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="relative">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-0.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/10"
                    >
                        <div className="bg-[#111b21] rounded-full p-0.5">
                            <Avatar
                                width={35}
                                height={35}
                                imageUrl={userSnapshot?.profile_pic || otherUser?.profile_pic}
                                name={userSnapshot?.name || otherUser?.name}
                            />
                        </div>
                    </motion.div>
                    {online && (
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-[3px] border-[#111b21] rounded-full shadow-sm" />
                    )}
                </div>

                <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-white tracking-tight truncate text-lg">
                        {userSnapshot?.name || otherUser?.name}
                    </h3>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={online ? 'online' : 'offline'}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 5 }}
                            className="flex items-center gap-1.5"
                        >
                            {online ? (
                                <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    <span className="text-[11px] font-black text-green-500/90 tracking-widest">Online</span>
                                </>
                            ) : (
                                <span className="text-[11px] font-bold text-gray-500 tracking-wider">
                                    {(userSnapshot?.lastActiveAt || otherUser?.lastActiveAt) ? `Last seen ${formatLastSeen(userSnapshot?.lastActiveAt || otherUser?.lastActiveAt)}` : "Offline"}
                                </span>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <motion.button
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-full text-gray-200 hover:text-white transition-colors"
                    >
                        <IoEllipsisVertical size={20} />
                    </motion.button>

                    <AnimatePresence>
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setShowMenu(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 bg-[#1f2c33] border border-white/5 rounded-xl shadow-2xl py-2 z-40 overflow-hidden backdrop-blur-xl"
                                >
                                    <button
                                        onClick={() => {
                                            clearActiveChat();
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-400 hover:bg-white/5 transition-colors font-semibold"
                                    >
                                        <IoExitOutline size={18} />
                                        Close Chat
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
