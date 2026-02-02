import { useRef, useEffect, useState } from "react";
import { useChatStore } from "@chatsync/store/useChatStore";
import { getMessagesByChat } from "@chatsync/services/message.service";
import { subscribeMessages } from "@chatsync/services/message.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import MessageInput from "./MessageInput";
import { markMessagesAsSeen } from "@chatsync/services/message.service";
import { useTyping } from "../../hooks/useTyping";
import TypingIndicator from "./TypingIndicator";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import WelcomeChat from "./WelcomeChat";
import { getOtherUserFromChat } from "@chatsync/services/chat.service";

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
        if (!activeChat?.$id) return;

        const chatId = activeChat.$id || activeChat.chatId;

        const loadMessages = async () => {
            const data = await getMessagesByChat(chatId);
            setMessages(data);
        };

        loadMessages();

        const unsub = subscribeMessages((event) => {
            const msg = event.payload; // Extract payload from new event structure

            // Check if this is a create/update event relevant to this chat
            const isDelete = event.events && event.events.some(e => e.includes('.delete'));

            if (isDelete && msg.chatId === activeChat.$id) {
                // Remove deleted message from list
                setMessages((prev) => prev.filter(m => m.$id !== msg.$id));
                return;
            }

            if (msg.chatId === activeChat.$id) {
                // If message already exists (e.g. update), replace it vs add it
                setMessages((prev) => {
                    const exists = prev.find(m => m.$id === msg.$id);
                    if (exists) {
                        return prev.map(m => m.$id === msg.$id ? msg : m);
                    }
                    return [msg, ...prev];
                });

                // Mark seen if it's not mine
                if (msg.senderId !== user.$id && !msg.isSeen) {
                    markMessagesAsSeen(activeChat.$id, user.$id);
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
        return <WelcomeChat />;
    }

    return (
        <div className="w-full h-[100dvh] md:h-full flex flex-col bg-[#0b141a]">
            <ChatHeader key={otherUser?.$id || activeChat?.$id} otherUser={otherUser} activeChat={activeChat} />

            <ChatMessages messages={messages} user={user} bottomRef={bottomRef} />

            <TypingIndicator users={typingUsers} />

            <div className="p-2 md:p-4 backdrop-blur-sm bg-[#0b141a]/90 md:bg-transparent">
                <MessageInput chatId={activeChat.$id} />
            </div>
        </div>
    );
}
