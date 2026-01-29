import { useState } from "react";
import { sendMessage } from "@chatsync/services/message.service";
import { useChatStore } from "@chatsync/store/useChatStore";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { setTyping } from "@chatsync/services/typing.service";

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

        // 🚀 Clear immediately for better UX
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
            // Optional: Restore message if send fails
            // setMessage(content); 
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
        <div className="flex gap-2 p-2 bg-gray-900/50 backdrop-blur-sm border-t border-white/5">
            <input
                value={message}
                onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-full bg-gray-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
            />
            <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="p-2.5 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
            </button>
        </div>
    );
}
