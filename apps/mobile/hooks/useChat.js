import { useChatStore } from '@chatterapp/store/chat.store';

export const useChat = () => {
    const { chats, setChats } = useChatStore();
    return { chats };
};
