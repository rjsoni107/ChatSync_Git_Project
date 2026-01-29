import { useState } from "react";
import { searchUsers } from "@chatsync/services/user.service";
import { findPrivateChat, createChat, addChatMember } from "@chatsync/services/chat.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { useChatStore } from "@chatsync/store/useChatStore";
import { IoClose, IoSearchOutline } from "react-icons/io5";

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
        <>
            <div className='fixed top-0 bottom-0 left-0 right-0 bg-black bg-opacity-40 p-2 z-10 backdrop-blur-sm'>
                <div className='w-full max-w-lg mx-auto mt-10'>

                    {/**input search user */}
                    <div className='bg-gray-800 rounded h-14 overflow-hidden flex '>
                        <input
                            type='text'
                            placeholder='Search friends by name, mobile....'
                            className='w-full outline-none py-1 h-full px-4 bg-gray-800'
                            onChange={handleSearch}
                            value={query}
                        />
                        <div className='h-14 w-14 flex justify-center items-center'>
                            <IoSearchOutline size={25} />
                        </div>
                    </div>

                    <div className='bg-gray-800 mt-2 w-full p-4 rounded max-h-[500px] overflow-y-auto'>
                        {/**no user found */}
                        {results.length === 0 && <p className='text-center text-slate-500'>No user found!</p>}

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
                </div>

                <div className='absolute top-0 right-0 text-2xl p-2 lg:text-4xl hover:text-white' onClick={onClose}>
                    <button>
                        <IoClose />
                    </button>
                </div>
            </div>


        </>
    );
}
