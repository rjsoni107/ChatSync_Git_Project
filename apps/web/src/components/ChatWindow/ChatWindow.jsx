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
        return <WelcomeChat />;
    }

    return (
        <div className="h-full flex flex-col bg-[#0b141a]">
            <ChatHeader key={otherUser?.$id || activeChat?.$id} otherUser={otherUser} activeChat={activeChat} />

            <ChatMessages messages={messages} user={user} bottomRef={bottomRef} />

            <TypingIndicator users={typingUsers} />

            <div className="p-4 backdrop-blur-sm">
                <MessageInput chatId={activeChat.$id} />
            </div>
        </div>
    );
}
