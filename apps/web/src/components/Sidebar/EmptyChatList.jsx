import { motion } from "framer-motion";
import { IoChatbubbleEllipsesOutline, IoAdd } from "react-icons/io5";

export default function EmptyChatList({ onStartChat }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6"
            >
                <IoChatbubbleEllipsesOutline size={40} className="text-gray-500" />
            </motion.div>

            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold text-white mb-2"
            >
                No chats yet
            </motion.h3>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-sm mb-8 max-w-[200px]"
            >
                Start a new conversation with friends and family using ChatSync.
            </motion.p>

            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.3 }}
                onClick={onStartChat}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-full text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-colors"
            >
                <IoAdd size={20} />
                Start New Chat
            </motion.button>
        </div>
    );
}
