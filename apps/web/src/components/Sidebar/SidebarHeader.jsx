import { motion } from "framer-motion";
import { IoPersonAddSharp } from "react-icons/io5";

export default function SidebarHeader({ onAddChat }) {
    return (
        <div className="p-5 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
            <h2 className="text-2xl font-black text-white tracking-tight italic opacity-90">ChatSync</h2>
            <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 1)' }}
                whileTap={{ scale: 0.95 }}
                title='Add friend'
                onClick={onAddChat}
                className='w-10 h-10 flex justify-center items-center cursor-pointer bg-blue-600 rounded-[14px] text-white shadow-lg shadow-blue-600/20'
            >
                <IoPersonAddSharp size={18} />
            </motion.button>
        </div>
    );
}
