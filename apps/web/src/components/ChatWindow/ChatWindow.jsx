import { useRef, useEffect, useState } from "react";
import { useChatStore } from "@chatsync/store/useChatStore";
import { getMessagesByChat, markMessagesAsSeen, markMessagesAsDelivered, subscribeMessages } from "@chatsync/services/message.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import MessageInput from "./MessageInput";
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

    const prevChatIdRef = useRef(null);

    useEffect(() => {
        const currentChatId = activeChat?.$id;

        // Only reload messages if chat ID actually changed
        if (currentChatId !== prevChatIdRef.current) {
            prevChatIdRef.current = currentChatId;

            if (!currentChatId) {
                setMessages([]);
                return;
            }

            const loadMessages = async () => {
                const data = await getMessagesByChat(currentChatId);
                setMessages(Array.isArray(data) ? data : []);
            };

            loadMessages();

            // Mark as seen when opening chat
            if (user?.$id) {
                markMessagesAsSeen(currentChatId, user.$id);
                markMessagesAsDelivered(currentChatId, user.$id);
            }
        }
    }, [activeChat?.$id, user?.$id, setMessages]);

    // Realtime subscription - runs once and uses store to get current chat
    useEffect(() => {
        const unsub = subscribeMessages((event) => {
            const msg = event.payload;

            // Get current active chat ID from store to avoid stale closure
            const currentChatId = useChatStore.getState().activeChat?.$id;
            if (!currentChatId) {
                return;
            }

            const isDelete = event.events && event.events.some(e => e.includes('.delete'));

            if (isDelete && msg.chatId === currentChatId) {
                setMessages((prev) => {
                    const prevArray = Array.isArray(prev) ? prev : [];
                    return prevArray.filter(m => m.$id !== msg.$id);
                });
                return;
            }

            if (msg.chatId === currentChatId) {
                addMessage(msg);

                // Mark seen if it's not mine
                const currentUser = useAuthStore.getState().user;
                if (currentUser && msg.senderId !== currentUser.$id && !msg.isSeen) {
                    markMessagesAsSeen(currentChatId, currentUser.$id);
                    markMessagesAsDelivered(currentChatId, currentUser.$id);
                } else if (currentUser && msg.senderId !== currentUser.$id && !msg.isDelivered) {
                    markMessagesAsDelivered(currentChatId, currentUser.$id);
                }
            }
        });

        return () => {
            unsub();
        };
    }, []); // Empty dependency - subscription runs once

    // Visibility change handler
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && activeChat?.$id && user?.$id) {
                markMessagesAsSeen(activeChat.$id, user.$id);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [activeChat?.$id, user?.$id]);

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
