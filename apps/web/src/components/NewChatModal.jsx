import { useState } from "react";
import { searchUsers } from "@chatsync/services/user.service";
import { findPrivateChat, createChat, addChatMember } from "@chatsync/services/chat.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";
import { IoClose, IoSearchOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";

export default function NewChatModal({ onClose }) {
    const user = useAuthStore((s) => s.user);
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const addChat = useChatStore((s) => s.addChat);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        const value = e.target.value;
        setQuery(value);
        if (value.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const users = await searchUsers(value, user.$id);
            setResults(users);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const startChat = async (targetUser) => {
        let chatId = await findPrivateChat(user.$id, targetUser.userId);

        if (!chatId) {
            const chat = await createChat();
            chatId = chat.$id;

            await addChatMember(chatId, user.$id);
            await addChatMember(chatId, targetUser.userId);
            addChat({ ...chat, otherUser: targetUser });
        }

        setActiveChat({ $id: chatId });
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/80 z-[60] backdrop-blur-md flex items-start justify-center p-4 pt-20'
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className='w-full max-w-lg relative'
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-14 right-0 text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
                >
                    <IoClose size={24} />
                </button>

                {/* Search Bar */}
                <div className='relative group'>
                    <input
                        type='text'
                        placeholder='Find friends by name or email...'
                        className='w-full bg-[#111b21] border border-white/10 rounded-2xl py-5 px-14 text-white text-lg outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-2xl'
                        onChange={handleSearch}
                        value={query}
                        autoFocus
                    />
                    <IoSearchOutline
                        size={24}
                        className='absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors'
                    />
                    {loading && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {/* Results List */}
                <AnimatePresence>
                    {(query.length >= 2 || results.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className='mt-4 bg-[#111b21] border border-white/10 rounded-[2rem] p-4 shadow-2xl max-h-[60vh] overflow-y-auto custom-scrollbar'
                        >
                            {results.length === 0 && !loading ? (
                                <div className="py-10 text-center">
                                    <p className='text-gray-500 font-medium'>No direct matches found</p>
                                    <p className='text-xs text-gray-600 mt-1'>Try a different name or email</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {results.map((u) => (
                                        <motion.div
                                            whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                            whileTap={{ scale: 0.98 }}
                                            key={u.$id}
                                            onClick={() => startChat(u)}
                                            className="p-3 rounded-2xl cursor-pointer flex items-center gap-4 transition-colors"
                                        >
                                            <Avatar
                                                width={44}
                                                height={44}
                                                imageUrl={u.profile_pic}
                                                name={u.name}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white truncate">{u.name}</p>
                                                <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <IoSearchOutline size={14} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
