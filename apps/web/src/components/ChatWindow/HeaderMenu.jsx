import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    IoEllipsisVertical,
    IoExitOutline,
    IoInformationCircleOutline,
    IoNotificationsOffOutline,
    IoHourglassOutline,
    IoTrashOutline,
    IoBanOutline,
    IoAlertCircleOutline,
    IoCheckboxOutline,
    IoHeartOutline
} from "react-icons/io5";
import { useChatStore } from "@chatterapp/store/useChatStore";

export default function HeaderMenu() {
    const [showMenu, setShowMenu] = useState(false);
    const clearActiveChat = useChatStore((s) => s.clearActiveChat);

    const menuItems = [
        { icon: IoInformationCircleOutline, label: "Contact info" },
        { icon: IoCheckboxOutline, label: "Select messages" },
        { icon: IoNotificationsOffOutline, label: "Mute notifications" },
        { icon: IoHourglassOutline, label: "Disappearing messages" },
        { icon: IoHeartOutline, label: "Add to favourites" },
    ];

    const dangerItems = [
        { icon: IoAlertCircleOutline, label: "Report", color: "text-red-400", hover: "hover:bg-red-400/10" },
        { icon: IoBanOutline, label: "Block", color: "text-red-400", hover: "hover:bg-red-400/10" },
        { icon: IoTrashOutline, label: "Clear chat", color: "text-red-500", hover: "hover:bg-red-500/10" },
        { icon: IoTrashOutline, label: "Delete chat", color: "text-red-500", hover: "hover:bg-red-500/10" },
    ];

    return (
        <div className="relative">
            <motion.button
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full text-gray-200 hover:text-white transition-colors"
            >
                <IoEllipsisVertical size={20} />
            </motion.button>

            {createPortal(
                <AnimatePresence>
                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-[100] bg-transparent"
                                onClick={() => setShowMenu(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="fixed top-16 right-4 w-64 bg-[#1f2c33] border border-white/5 rounded-2xl shadow-2xl py-2 z-[101] overflow-hidden backdrop-blur-2xl"
                            >
                                <div className="flex flex-col">
                                    {menuItems.map((item, i) => (
                                        <button
                                            key={i}
                                            className="w-full px-4 py-3 flex items-center gap-3 text-[14px] text-gray-200 hover:bg-white/5 transition-colors font-medium group"
                                        >
                                            <item.icon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                            {item.label}
                                        </button>
                                    ))}

                                    <div className="h-[1px] bg-white/5 my-1 mx-2" />

                                    <button
                                        onClick={() => {
                                            clearActiveChat();
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-[14px] text-gray-200 hover:bg-white/5 transition-colors font-medium group"
                                    >
                                        <IoExitOutline size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                        Close chat
                                    </button>

                                    <div className="h-[1px] bg-white/5 my-1 mx-2" />

                                    {dangerItems.map((item, i) => (
                                        <button
                                            key={i}
                                            className={`w-full px-4 py-3 flex items-center gap-3 text-[14px] ${item.color} ${item.hover} transition-colors font-medium`}
                                        >
                                            <item.icon size={20} />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
