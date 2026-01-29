import { useChatStore } from '@chatsync/store/chat.store';

export const useChat = () => {
    const { chats, setChats } = useChatStore();
    return { chats };
};
