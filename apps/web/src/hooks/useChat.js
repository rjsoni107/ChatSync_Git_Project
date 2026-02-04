import { useState, useEffect } from 'react';
import { chatService } from '@chatterapp/services/chat.service';
import { useChatStore } from '@chatterapp/store/chat.store';

export const useChat = (userId) => {
    const { chats, setChats } = useChatStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChats = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const userChats = await chatService.getChats(userId);
                setChats(userChats);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, [userId, setChats]);

    return { chats, loading };
};
