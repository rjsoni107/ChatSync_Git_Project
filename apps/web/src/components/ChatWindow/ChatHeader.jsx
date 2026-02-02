import { useEffect, useState } from "react";
import { subscribeSingleUserPresence } from "@chatsync/services/realtime.service";
import Avatar from "../Avatar";
import { motion } from "framer-motion";
import UserStatus from "./UserStatus";
import HeaderMenu from "./HeaderMenu";
import { useChatStore } from "@chatsync/store/useChatStore";
import { IoArrowBack } from "react-icons/io5";

export default function ChatHeader({ otherUser }) {
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const [userSnapshot, setUserSnapshot] = useState(otherUser);
    const [, setTick] = useState(0);

    const isUserOnline = (user) => {
        if (!user) return false;
        if (user.isOnline === false) return false;
        if (!user.lastActiveAt) return false;
        const diff = Date.now() - new Date(user.lastActiveAt).getTime();
        return diff < 60000;
    };

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
                <button
                    onClick={() => {
                        if (window.history.state?.chatOpen) {
                            window.history.back();
                        } else {
                            setActiveChat(null);
                        }
                    }}
                    className="md:hidden -mr-1 text-gray-400 hover:text-white"
                >
                    <IoArrowBack size={24} />
                </button>

                <div className="relative">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-0.5 rounded-full shadow-lg shadow-blue-500/10"
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
                    <UserStatus online={online} lastActiveAt={userSnapshot?.lastActiveAt || otherUser?.lastActiveAt} />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <HeaderMenu />
            </div>
        </motion.div>
    );
}
