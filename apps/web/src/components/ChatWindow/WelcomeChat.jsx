import { motion } from "framer-motion";

export default function WelcomeChat() {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-[#0b141a] relative overflow-hidden">
            <div className="absolute inset-0 to-transparent pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center text-center px-6 z-10 -mt-20"
            >
                <div className="w-24 h-24 mb-8 relative">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
                    />
                    <div className="relative w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
                        <img src="/img/logo192.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                </div>

                <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                    Welcome to <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">ChatterApp</span>
                </h1>
                <p className="text-gray-400 max-w-sm leading-relaxed text-lg font-medium opacity-80">
                    Send and receive messages in real-time with end-to-end synchronization. Select a friend to start chatting.
                </p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm"
                >
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Secure & Encrypted</span>
                </motion.div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
}
