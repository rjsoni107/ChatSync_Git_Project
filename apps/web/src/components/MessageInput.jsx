import { useState } from "react";
import { sendMessage } from "@chatsync/services/message.service";
import { useChatStore } from "@chatsync/store/useChatStore";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { setTyping } from "@chatsync/services/typing.service";
import { IoSend, IoAddOutline } from "react-icons/io5";
import { motion } from "framer-motion";

export default function MessageInput() {
    const [message, setMessage] = useState("");
    const activeChat = useChatStore((s) => s.activeChat);
    const user = useAuthStore((s) => s.user);

    const handleSend = async () => {
        const content = message.trim();
        if (!content || !activeChat || !user) return;

        const chatId = activeChat.$id || activeChat.chatId;
        if (!chatId) {
            console.error("No chatId found for active chat", activeChat);
            return;
        }

        setMessage("");

        try {
            await sendMessage({
                chatId,
                senderId: user.$id,
                content: content,
                createdAt: new Date().toISOString(),
                type: "text",
            });
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    let typingTimeout;

    const handleTyping = () => {
        if (!activeChat || !user) return;

        const chatId = activeChat.$id || activeChat.chatId;
        if (!chatId) return;

        setTyping({
            chatId,
            userId: user.$id,
            name: user.name,
            isTyping: true,
        });

        clearTimeout(typingTimeout);

        typingTimeout = setTimeout(() => {
            setTyping({
                chatId,
                userId: user.$id,
                isTyping: false,
            });
        }, 1500);
    };

    return (
        <div className="flex items-center gap-3 w-full">
            <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
                <IoAddOutline size={24} />
            </motion.button>

            <div className="flex-1 relative group">
                <input
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Message..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-[15px] shadow-sm"
                />
            </div>

            <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#3b82f6' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!message.trim()}
                className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-blue-500/20 flex-shrink-0 transition-colors"
            >
                <IoSend size={20} />
            </motion.button>
        </div>
    );
}
