import { useState } from "react";
import { searchUsers } from "@chatsync/services/user.service";
import { findPrivateChat, createChat, addChatMember } from "@chatsync/services/chat.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";

export default function NewChatModal({ onClose }) {
    const user = useAuthStore((s) => s.user);
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const addChat = useChatStore((s) => s.addChat);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        const value = e.target.value;
        setQuery(value);
        if (value.length < 2) return;
        const users = await searchUsers(value, user.$id);
        setResults(users);
    };

    const startChat = async (targetUser) => {
        let chatId = await findPrivateChat(user.$id, targetUser.userId);

        if (!chatId) {
            const chat = await createChat();
            chatId = chat.$id;

            await addChatMember(chatId, user.$id);
            await addChatMember(chatId, targetUser.userId);
            addChat({ ...chat, otherUser: targetUser });
        }

        setActiveChat({ $id: chatId });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-gray-900 w-96 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">New Chat</h2>

                <input
                    value={query}
                    onChange={handleSearch}
                    placeholder="Search users..."
                    className="w-full px-3 py-2 bg-gray-800 rounded mb-3"
                />

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {results.map((u) => (
                        <div
                            key={u.$id}
                            onClick={() => startChat(u)}
                            className="p-2 rounded bg-gray-800 hover:bg-gray-700 cursor-pointer"
                        >
                            {u.name}
                        </div>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 text-sm text-gray-400 hover:text-white"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
