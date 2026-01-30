import { motion } from "framer-motion";
import {
    IoChatbubbleEllipses,
    IoRadioButtonOff,
    IoPeopleOutline,
    IoSettingsOutline,
    IoDiscOutline
} from "react-icons/io5";
import Avatar from "../Avatar";

export default function MiniSidebar({ user, onEditProfile }) {
    const navItems = [
        { icon: IoChatbubbleEllipses, label: "Chats", active: true },
        { icon: IoDiscOutline, label: "Status" },
        { icon: IoPeopleOutline, label: "Groups" },
    ];

    return (
        <div className="w-[64px] h-full bg-[#202c33] flex flex-col items-center py-4 justify-between border-r border-white/5">
            <div className="flex flex-col items-center gap-4 w-full">
                {navItems.map((item, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                        className={`p-3 rounded-full cursor-pointer relative group ${item.active ? "text-white bg-blue-400/30" : "text-gray-400"}`}
                        title={item.label}
                    >
                        <item.icon size={24} />
                        <span className="absolute left-full ml-2 px-2 py-1 bg-[#2a3942] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            {item.label}
                        </span>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
                <motion.div
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="p-3 rounded-full cursor-pointer text-gray-400 group relative"
                    title="Settings"
                >
                    <IoSettingsOutline size={24} />
                </motion.div>

                <div
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={onEditProfile}
                >
                    <Avatar
                        width={32}
                        height={32}
                        imageUrl={user?.profile_pic}
                        name={user?.name}
                    />
                </div>
            </div>
        </div>
    );
}
