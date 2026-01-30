import { motion } from "framer-motion";
import Avatar from "../Avatar";
import { IoLogOutOutline } from "react-icons/io5";

export default function SidebarFooter({ user, onEditProfile, onLogout }) {
    return (
        <div className="p-5 border-t border-white/5 bg-[#111b21] flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden group">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onEditProfile}
                    className='relative'
                >
                    <Avatar
                        width={42}
                        height={42}
                        name={user?.name}
                        imageUrl={user?.profile_pic}
                    />
                    <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-blue-500/50 transition-colors" />
                </motion.button>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate text-white tracking-tight">{user?.name}</p>
                    <p className="text-[10px] text-gray-500 truncate font-medium">@{user?.username}</p>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.1, color: '#ef4444' }}
                whileTap={{ scale: 0.9 }}
                onClick={onLogout}
                className="p-2 text-gray-500 transition-colors"
                title="Logout"
            >
                <IoLogOutOutline size={24} />
            </motion.button>
        </div>
    );
}
