import { forwardRef } from "react";
import { motion } from "framer-motion";
import Avatar from "../Avatar";
import { IoCheckmarkDone } from "react-icons/io5";
import { useAuthStore } from "@chatsync/store/useAuthStore";

const ChatItem = forwardRef(({ chat, isActive, onClick }, ref) => {
    const user = useAuthStore(s => s.user);
    const hasUnread = (chat.unreadCount || 0) > 0;
    const isMe = chat.lastSenderId === user?.$id;

    return (
        <motion.div
            ref={ref}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={onClick}
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

                    {chat.lastMessageAt && (
                        <span className={` text-[9px] font-bold uppercase tracking-tight ${hasUnread ? "text-blue-400" : "text-gray-500"}`}>
                            {new Intl.DateTimeFormat([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            }).format(new Date(chat.lastMessageAt))}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {isMe && (
                            <IoCheckmarkDone
                                size={16}
                                className={chat.lastMessageSeen ? "text-green-400" : "text-gray-500"}
                            />
                        )}
                        <p className={`text-xs truncate leading-relaxed ${hasUnread ? "text-gray-100 font-semibold" : "text-gray-400 font-medium"}`}>
                            {chat.lastMessage || "Start a conversation..."}
                        </p>
                    </div>

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
            </div>
        </motion.div>
    );
});

ChatItem.displayName = "ChatItem";

export default ChatItem;
