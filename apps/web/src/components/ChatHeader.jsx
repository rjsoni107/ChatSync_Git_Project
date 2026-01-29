import { useEffect, useState } from "react";
import { subscribeSingleUserPresence } from "@chatsync/services/realtime.service";
import { formatLastSeen } from "../../../../packages/utils/date";
import Avatar from "./Avatar";

export default function ChatHeader({ otherUser }) {
    const [userSnapshot, setUserSnapshot] = useState(otherUser);

    const isUserOnline = (user) => {
        if (!user) return false;

        // If the user is explicitly set to offline, believe it immediately
        if (user.isOnline === false) return false;

        if (!user.lastActiveAt) return false;

        const diff = Date.now() - new Date(user.lastActiveAt).getTime();

        // 60 seconds buffer (heartbeat is 10s) to account for clock drift & lag
        return diff < 60000;
    };

    const [, setTick] = useState(0);

    useEffect(() => {
        if (!otherUser?.$id) return;

        // 1️⃣ Fetch fresh state immediately to avoid stale props flicker
        const fetchFreshUser = async () => {
            try {
                const { getUserProfile } = await import("@chatsync/services/user.service");
                const freshUser = await getUserProfile(otherUser.$id);
                setUserSnapshot(freshUser);
            } catch (err) {
                console.error("Failed to fetch fresh user profile", err);
                setUserSnapshot(otherUser);
            }
        };

        fetchFreshUser();

        // 2️⃣ Subscribe to realtime updates
        const unsub = subscribeSingleUserPresence(
            otherUser.$id,
            (updatedUser) => {
                setUserSnapshot(updatedUser);
            }
        );

        // 3️⃣ Ticker to re-calculate "isOnline" even if no events arrive
        const interval = setInterval(() => setTick((t) => t + 1), 30000);

        return () => {
            unsub();
            clearInterval(interval);
        };
    }, [otherUser?.$id]);

    if (!userSnapshot) {
        return <div className="text-gray-400 p-4 border-b border-gray-800">Loading…</div>;
    }

    const online = isUserOnline(userSnapshot);

    return (
        <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2 overflow-hidden">
                <Avatar
                    width={35}
                    height={35}
                    imageUrl={userSnapshot?.profile_pic}
                    name={userSnapshot?.name}
                />
                <div className="flex flex-col">
                    <h3 className="font-semibold">{userSnapshot.name}</h3>
                    <div className="flex items-baseline gap-1">
                        <span className={`h-2 w-2 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`} />
                        <p className="text-xs text-gray-300">
                            {online ? "Online" : userSnapshot.lastActiveAt ? `Last seen ${formatLastSeen(userSnapshot.lastActiveAt)}` : "Offline"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
