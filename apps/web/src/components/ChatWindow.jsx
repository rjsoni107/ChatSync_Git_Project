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
import { getMessageDateLabel } from "../../../../packages/utils/date";

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

                // 🔥 Auto-mark as seen ONLY if the tab is visible
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
            <div className="h-full flex items-center justify-center text-gray-500">
                Select a chat
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <ChatHeader key={otherUser?.$id || activeChat?.$id} otherUser={otherUser} activeChat={activeChat} />

            <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === user.$id;
                    const dateLabel = getMessageDateLabel(msg.createdAt);
                    const prevMsg = messages[index - 1];
                    const prevDateLabel = prevMsg ? getMessageDateLabel(prevMsg.createdAt) : null;
                    const showDateSeparator = dateLabel !== prevDateLabel;

                    return (
                        <div key={msg.$id} className="space-y-2">
                            {showDateSeparator && (
                                <div className="flex justify-center my-4">
                                    <span className="px-3 py-1 text-xs font-medium bg-gray-800/80 text-gray-400 rounded-lg backdrop-blur-sm border border-white/5 shadow-sm">
                                        {dateLabel}
                                    </span>
                                </div>
                            )}

                            <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-xs min-w-[100px] px-2 py-1 rounded-xl text-sm ${isMe ? "bg-[#ad2144] text-white rounded-br-none" : "bg-gray-800 text-gray-200 rounded-bl-none"}`}>
                                    <p className="leading-relaxed">{msg.content}</p>

                                    <div className="flex items-center justify-end gap-1 border-white/10">
                                        <span className="text-[10px] text-gray-300 opacity-80">
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>

                                        {isMe && (
                                            <div className={`flex items-center ${msg.isSeen ? "text-green-500" : "text-gray-400"}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                    <path d="M7 13l3 3 7-7" />
                                                    <path d="M2 13l3 3 7-7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <TypingIndicator users={typingUsers} />

            <div className="p-4 border-t border-gray-800">
                <MessageInput chatId={activeChat.$id} />
            </div>
        </div>
    );
}
