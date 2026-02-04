import { useEffect, useState } from "react";
import { subscribeTyping } from "@chatterapp/services/realtime.service";
import { useAuthStore } from "@chatterapp/store/useAuthStore";

export const useTyping = (chatId) => {
    const user = useAuthStore((s) => s.user);
    const [typingUsers, setTypingUsers] = useState([]);

    useEffect(() => {
        if (!chatId) return;

        const unsub = subscribeTyping((event) => {
            const data = event.payload;
            if (data.chatId !== chatId) return;
            if (data.userId === user.$id) return;

            setTypingUsers((prev) => {
                if (data.isTyping) {
                    if (prev.find(u => u.userId === data.userId)) return prev;
                    return [...prev, data];
                }
                return prev.filter(u => u.userId !== data.userId);
            });
        });

        return () => unsub();
    }, [chatId]);

    return typingUsers;
};
