import { useRef, useEffect, useState } from "react";
import { useChatStore } from "@chatsync/store/useChatStore";
import { getMessagesByChat } from "@chatsync/services/message.service";
import { subscribeMessages } from "@chatsync/services/message.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import MessageInput from "./MessageInput";
import { markMessagesAsSeen } from "@chatsync/services/message.service";
import { useTyping } from "../hooks/useTyping";
import TypingIndicator from "./TypingIndicator";
import ChatHeader from "./ChatHeader";
import { getOtherUserFromChat } from "@chatsync/services/chat.service";
import { getFilePreview } from "@chatsync/services/storage.service";
import { getMessageDateLabel } from "../../../../packages/utils/date";
import { motion, AnimatePresence } from "framer-motion";
import { IoChatbubblesOutline, IoCheckmarkDone, IoDownloadOutline } from "react-icons/io5";

export default function ChatWindow() {
    const activeChat = useChatStore((s) => s.activeChat);
    const messages = useChatStore((s) => s.messages);
    const setMessages = useChatStore((s) => s.setMessages);
    const addMessage = useChatStore((s) => s.addMessage);
    const user = useAuthStore((s) => s.user);
    const typingUsers = useTyping(activeChat?.$id);
    const [otherUser, setOtherUser] = useState(null);

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!activeChat || !user) return;

        markMessagesAsSeen(activeChat.$id || activeChat.chatId, user.$id);
    }, [activeChat]);

    useEffect(() => {
        if (!activeChat) return;
        const chatId = activeChat.$id || activeChat.chatId;

        const loadMessages = async () => {
            const data = await getMessagesByChat(chatId);
            setMessages(data);
        };

        loadMessages();

        const unsub = subscribeMessages((msg) => {
            if (msg.chatId === chatId) {
                addMessage(msg);

                if (msg.senderId !== user.$id && !msg.isSeen && !document.hidden) {
                    markMessagesAsSeen(chatId, user.$id);
                }
            }
        });

        const handleVisibilityMark = () => {
            if (!document.hidden && activeChat) {
                markMessagesAsSeen(chatId, user.$id);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityMark);

        return () => {
            unsub();
            document.removeEventListener("visibilitychange", handleVisibilityMark);
        };
    }, [activeChat]);

    useEffect(() => {
        if (!activeChat || !user) {
            setOtherUser(null);
            return;
        }

        const loadOtherUser = async () => {
            const u = await getOtherUserFromChat(
                activeChat.chatId || activeChat.$id,
                user.$id
            );
            setOtherUser(u);
        };

        loadOtherUser();
    }, [activeChat, user]);

    if (!activeChat) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#0b141a] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center text-center px-6 z-10"
                >
                    <div className="w-24 h-24 mb-8 relative">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
                        />
                        <div className="relative w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
                            <IoChatbubblesOutline size={48} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                        Welcome to <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">ChatSync</span>
                    </h1>
                    <p className="text-gray-400 max-w-sm leading-relaxed text-lg font-medium opacity-80">
                        Send and receive messages in real-time with end-to-end synchronization. Select a friend to start chatting.
                    </p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12 flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm"
                    >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Secure & Encrypted</span>
                    </motion.div>
                </motion.div>

                {/* Decorative Elements */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0b141a]">
            <ChatHeader key={otherUser?.$id || activeChat?.$id} otherUser={otherUser} activeChat={activeChat} />

            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {messages.map((msg, index) => {
                        const isMe = msg.senderId === user.$id;
                        const dateLabel = getMessageDateLabel(msg.createdAt);
                        const prevMsg = messages[index - 1];
                        const prevDateLabel = prevMsg ? getMessageDateLabel(prevMsg.createdAt) : null;
                        const showDateSeparator = dateLabel !== prevDateLabel;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                key={msg.$id}
                                className="space-y-4"
                            >
                                {showDateSeparator && (
                                    <div className="flex justify-center my-6">
                                        <span className="px-4 py-1.5 text-[10px] font-black tracking-widest bg-white/5 text-gray-500 rounded-full border border-white/5 shadow-sm backdrop-blur-md">
                                            {dateLabel}
                                        </span>
                                    </div>
                                )}

                                <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] min-w-[120px] rounded-[1rem] shadow-lg relative group transform-gpu overflow-hidden ${isMe
                                        ? "bg-indigo-600/20 border border-white/10 text-white rounded-br-sm"
                                        : "bg-white/5 border border-white/5 text-gray-200 rounded-bl-sm"
                                        }`}>

                                        {msg.type === "image" && msg.fileId && (
                                            <div className="relative group/img mb-1 overflow-hidden">
                                                <img
                                                    src={getFilePreview(msg.fileId)}
                                                    alt="Attached media"
                                                    crossOrigin="anonymous"
                                                    className="w-full max-h-[400px] object-contain rounded-lg cursor-pointer hover:opacity-95 transition-all bg-black/20"
                                                    onClick={() => window.open(getFilePreview(msg.fileId), '_blank')}
                                                    onError={(e) => {
                                                        console.error("Image failed to load:", getFilePreview(msg.fileId));
                                                        e.target.src = "https://placehold.co/400x300/111b21/white?text=Image+Load+Failed";
                                                    }}
                                                />
                                                <div
                                                    className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/50 p-1.5 rounded-full text-white cursor-pointer hover:bg-black/70"
                                                    title="Open Original"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(getFilePreview(msg.fileId), '_blank');
                                                    }}
                                                >
                                                    <IoDownloadOutline size={16} />
                                                </div>
                                            </div>
                                        )}

                                        {msg.content && msg.content !== "[Image]" && (
                                            <p className="text-[15px] leading-relaxed font-medium px-3 py-2">{msg.content}</p>
                                        )}

                                        <div className="flex items-center justify-end gap-1 px-3 pb-1.5">
                                            <span className={`text-[9px] font-bold uppercase tracking-tight text-gray-500`}>
                                                {new Intl.DateTimeFormat([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }).format(new Date(msg.createdAt))}
                                            </span>

                                            {isMe && (
                                                <div className={`flex items-center ${msg.isSeen ? "text-green-400" : "text-white/60"}`}>
                                                    <IoCheckmarkDone size={14} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            <TypingIndicator users={typingUsers} />

            <div className="p-4 backdrop-blur-sm">
                <MessageInput chatId={activeChat.$id} />
            </div>
        </div>
    );
}
