import { motion } from "framer-motion";

export default function ChatListSkeleton() {
    const SkeletonItem = () => (
        <div className="p-3.5 flex items-center gap-3.5 animate-pulse">
            {/* Avatar Skeleton */}
            <div className="w-10 h-10 bg-[#2a3942] rounded-full flex-shrink-0" />

            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between items-center">
                    {/* Name Skeleton */}
                    <div className="h-4 w-24 bg-[#2a3942] rounded" />
                    {/* Time Skeleton */}
                    <div className="h-2 w-8 bg-[#2a3942] rounded" />
                </div>
                {/* Message Skeleton */}
                <div className="h-3 w-3/4 bg-[#2a3942] rounded opacity-50" />
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            {[...Array(8)].map((_, i) => (
                <SkeletonItem key={i} />
            ))}
        </div>
    );
}
