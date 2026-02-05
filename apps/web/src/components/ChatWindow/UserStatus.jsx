import { motion, AnimatePresence } from "framer-motion";
import { formatLastSeen } from "../../../../../packages/utils/date";

export default function UserStatus({ online, lastActiveAt }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={online ? 'online' : 'offline'}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="flex items-center gap-1.5"
            >
                {online ? (
                    <>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        <span className="text-[11px] font-black text-blue-500/90 tracking-widest uppercase">Online</span>
                    </>
                ) : (
                    <span className="text-[11px] text-gray-300">
                        {lastActiveAt ? `Last seen ${formatLastSeen(lastActiveAt)}` : "Offline"}
                    </span>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
