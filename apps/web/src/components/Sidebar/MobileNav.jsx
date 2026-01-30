import { motion } from "framer-motion";
import {
    IoChatbubbleEllipses,
    IoRadioButtonOff,
    IoPeopleOutline,
    IoSettingsOutline,
    IoDiscOutline
} from "react-icons/io5";
import Avatar from "../Avatar";

export default function MobileNav({ user, onEditProfile }) {
    const navItems = [
        { icon: IoChatbubbleEllipses, label: "Chats", active: true },
        { icon: IoRadioButtonOff, label: "Status" },
        { icon: IoDiscOutline, label: "Channels" },
        { icon: IoPeopleOutline, label: "Communities" },
        { icon: IoSettingsOutline, label: "Settings" }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[64px] bg-[#202c33] border-t border-white/5 flex items-center justify-around z-50 md:hidden pb-1">
            {navItems.map((item, i) => (
                <div
                    key={i}
                    className={`flex flex-col items-center justify-center w-full h-full cursor-pointer ${item.active ? "text-blue-400" : "text-gray-400"}`}
                >
                    <item.icon size={22} className="mb-0.5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                    {item.active && (
                        <motion.div
                            layoutId="mobile-nav-active"
                            className="absolute top-0 w-12 h-1 bg-blue-500 rounded-b-lg"
                        />
                    )}
                </div>
            ))}

            <div
                className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                onClick={onEditProfile}
            >
                <Avatar
                    width={24}
                    height={24}
                    imageUrl={user?.profile_pic}
                    name={user?.name}
                />
                <span className="text-[10px] font-medium text-gray-400 mt-0.5">Profile</span>
            </div>
        </div>
    );
}
