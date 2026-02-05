import { motion, AnimatePresence } from "framer-motion";
import { IoCheckmarkDone, IoCheckmark, IoDownloadOutline } from "react-icons/io5";
import { getMessageDateLabel } from "../../../../../packages/utils/date";
import { getFilePreview } from "@chatterapp/services/storage.service";

export default function ChatMessages({ messages, user, bottomRef }) {
    // Safety check: ensure messages is always an array
    const messageList = Array.isArray(messages) ? messages : [];

    return (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 custom-scrollbar overscroll-contain">
            <AnimatePresence>
                {messageList.map((msg, index) => {
                    const isMe = msg.senderId === user.$id;
                    const dateLabel = getMessageDateLabel(msg.createdAt);
                    const prevMsg = messageList[index - 1];
                    const prevDateLabel = prevMsg ? getMessageDateLabel(prevMsg.createdAt) : null;
                    const showDateSeparator = dateLabel !== prevDateLabel;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={msg.$id}
                            className="space-y-4"
                        >
                            {showDateSeparator && (
                                <div className="flex justify-center my-2">
                                    <span className="px-4 py-1.5 text-[11px] bg-white/5 text-gray-300 rounded-full border border-white/5 shadow-sm backdrop-blur-md">
                                        {dateLabel}
                                    </span>
                                </div>
                            )}

                            <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] min-w-[120px] rounded-[1rem] shadow-lg relative group transform-gpu overflow-hidden ${isMe
                                    ? "bg-indigo-600/20 border border-white/10 text-white rounded-br-sm"
                                    : "bg-white/5 border border-white/5 text-gray-200 rounded-bl-sm"
                                    }`}>

                                    {msg.type === "image" && msg.fileId && (
                                        <div className="relative group/img mb-1 overflow-hidden">
                                            <img
                                                src={getFilePreview(msg.fileId)}
                                                alt="Attached media"
                                                crossOrigin="anonymous"
                                                className="w-full max-h-[400px] object-contain rounded-lg cursor-pointer hover:opacity-95 transition-all bg-black/20"
                                                onClick={() => window.open(getFilePreview(msg.fileId), '_blank')}
                                                onError={(e) => {
                                                    console.error("Image failed to load:", getFilePreview(msg.fileId));
                                                    e.target.src = "https://placehold.co/400x300/111b21/white?text=Image+Load+Failed";
                                                }}
                                            />
                                            <div
                                                className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/50 p-1.5 rounded-full text-white cursor-pointer hover:bg-black/70"
                                                title="Open Original"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(getFilePreview(msg.fileId), '_blank');
                                                }}
                                            >
                                                <IoDownloadOutline size={16} />
                                            </div>
                                        </div>
                                    )}

                                    {msg.content && msg.content !== "[Image]" && (
                                        <p className="text-[15px] leading-relaxed font-medium px-3 py-2">{msg.content}</p>
                                    )}

                                    <div className="flex items-center justify-end gap-1 px-3 pb-1.5">
                                        <span className={`text-[9px] font-bold uppercase tracking-tight text-gray-500`}>
                                            {new Intl.DateTimeFormat([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }).format(new Date(msg.createdAt))}
                                        </span>

                                        {isMe && (
                                            <div className="flex items-center">
                                                {msg.isSeen ? (
                                                    <IoCheckmarkDone size={16} className="text-blue-400" title="Read" />
                                                ) : msg.isDelivered ? (
                                                    <IoCheckmarkDone size={16} className="text-gray-500" title="Delivered" />
                                                ) : (
                                                    <IoCheckmark size={16} className="text-gray-500/50" title="Sent" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            <div ref={bottomRef} />
        </div>
    );
}
