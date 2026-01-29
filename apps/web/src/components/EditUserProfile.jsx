import React, { useEffect, useState, useRef } from 'react'
import Avatar from './Avatar'
import { FaCamera, FaPen, FaTimes } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadFile, getFileView } from '@chatsync/services/file.service'
import { updateUserProfile } from '@chatsync/services/user.service'

export default function EditUserProfile({ onClose, user }) {
    const [name, setName] = useState(user?.name || "");
    const [about, setAbout] = useState(user?.about || "");
    const [profilePic, setProfilePic] = useState(user?.profile_pic || "");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const uploadedFile = await uploadFile(file);
            const fileUrl = getFileView(uploadedFile.$id).toString();
            setProfilePic(fileUrl);

            await updateUserProfile(user.$id || user.userId, {
                profile_pic: fileUrl
            });
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            await updateUserProfile(user.$id || user.userId, {
                name,
                about,
                profile_pic: profilePic
            });
            onClose();
            window.location.reload();
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-[#111b21] rounded-[2.5rem] shadow-2xl border border-white/5 w-full max-w-sm relative overflow-hidden"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10 z-10"
                >
                    <FaTimes size={14} />
                </button>

                <div className="p-7">
                    <header className="mb-5">
                        <h2 className="text-xl font-bold text-white tracking-tight">Profile</h2>
                        <p className="text-[12px] text-gray-400">Update your identity and info</p>
                    </header>

                    <div className="flex flex-col items-center mb-6">
                        <div className="relative cursor-pointer group" onClick={() => fileInputRef.current.click()}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative p-1 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/10"
                            >
                                <div className="bg-[#111b21] rounded-full p-1">
                                    <Avatar
                                        width={110}
                                        height={110}
                                        imageUrl={profilePic}
                                        name={name}
                                    />
                                </div>
                            </motion.div>

                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                <FaCamera size={18} className="text-white mb-0.5" />
                                <span className="text-[7px] font-black text-white uppercase tracking-widest">Update</span>
                            </div>

                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-sm">
                                    <div className="w-7 h-7 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Name Input */}
                        <div className="group">
                            <label className="text-blue-400 text-[9px] font-bold uppercase tracking-[0.1em] ml-1">Your Name</label>
                            <div className="relative mt-1.5">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
                                    placeholder="Jane Doe"
                                />
                                <FaPen className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <p className="text-[9px] text-gray-500 mt-1.5 px-1">This name will be visible to your contacts.</p>
                        </div>

                        {/* About Input */}
                        <div className="group">
                            <label className="text-blue-400 text-[9px] font-bold uppercase tracking-[0.1em] ml-1">About</label>
                            <div className="relative mt-1.5">
                                <input
                                    type="text"
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
                                    placeholder="Available"
                                />
                                <FaPen className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <motion.button
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-white/5 text-gray-500 font-semibold text-[11px] transition-colors"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: '#3b82f6' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={uploading}
                            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-[11px] shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {uploading ? 'Updating...' : 'Save Profile'}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}