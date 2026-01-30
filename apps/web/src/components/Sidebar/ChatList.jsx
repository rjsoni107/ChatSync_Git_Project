import { AnimatePresence } from "framer-motion";
import ChatItem from "./ChatItem";

export default function ChatList({ chats, activeChat, onChatSelect }) {
    return (
        <div className="flex-1 overflow-y-auto mt-2 px-3 space-y-1 custom-scrollbar">
            <AnimatePresence mode="popLayout">
                {chats.map((chat) => (
                    <ChatItem
                        key={chat.$id}
                        chat={chat}
                        isActive={activeChat?.$id === chat.$id}
                        onClick={() => onChatSelect(chat)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
