import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/Sidebar/Sidebar";

export default function Chats() {
    return (
        <div className="h-screen flex bg-gray-950 text-white">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-800">
                <Sidebar />
            </div>

            {/* Chat Window */}
            <div className="flex-1">
                <ChatWindow />
            </div>
        </div>
    );
}
