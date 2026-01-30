import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { sendMessage } from "@chatsync/services/message.service";
import { uploadFile } from "@chatsync/services/storage.service";
import { useChatStore } from "@chatsync/store/useChatStore";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { setTyping } from "@chatsync/services/typing.service";
import { IoSend, IoCloseCircle, IoImagesOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

export default function MessageInput() {
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);
    const activeChat = useChatStore((s) => s.activeChat);
    const user = useAuthStore((s) => s.user);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = async () => {
        const content = message.trim();
        const chatId = activeChat?.$id || activeChat?.chatId;

        if ((!content && !selectedFile) || !chatId || !user) return;

        setUploading(true);
        setMessage("");
        clearSelection();

        try {
            let fileId = null;
            let type = "text";

            if (selectedFile) {
                // Compress image before upload
                let fileToUpload = selectedFile;
                if (selectedFile.type.startsWith("image/")) {
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1280, // Slightly higher for better quality
                        useWebWorker: true
                    };
                    try {
                        fileToUpload = await imageCompression(selectedFile, options);
                    } catch (compressionError) {
                        console.error("Compression failed, using original:", compressionError);
                    }
                }

                const uploaded = await uploadFile(fileToUpload);
                fileId = uploaded.$id;
                type = "image";
            }

            await sendMessage({
                chatId,
                senderId: user.$id,
                content: type === "image" ? "" : content,
                type,
                fileId,
            });
        } catch (err) {
            console.error("Failed to send message:", err);
            // Optionally restore message if it failed
        } finally {
            setUploading(false);
        }
    };

    let typingTimeout;
    const handleTyping = () => {
        const chatId = activeChat?.$id || activeChat?.chatId;
        if (!chatId || !user) return;

        setTyping({
            chatId,
            userId: user.$id,
            name: user.name,
            isTyping: true,
        });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            setTyping({
                chatId,
                userId: user.$id,
                isTyping: false,
            });
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-xl"
                    >
                        <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                        <button
                            onClick={clearSelection}
                            className="absolute top-1 right-1 text-gray-200 hover:text-red-400 bg-black/50 rounded-full"
                        >
                            <IoCloseCircle size={24} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-3 w-full">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*"
                />

                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
                >
                    <IoImagesOutline size={24} />
                </motion.button>

                <div className="flex-1 relative group">
                    <input
                        value={message}
                        onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={uploading}
                        placeholder={uploading ? "Uploading..." : "Message..."}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-[15px] shadow-sm disabled:opacity-50"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#3b82f6' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={(!message.trim() && !selectedFile) || uploading}
                    className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-blue-500/20 flex-shrink-0 transition-colors"
                >
                    {uploading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <IoSend size={20} />
                    )}
                </motion.button>
            </div>
        </div>
    );
}
