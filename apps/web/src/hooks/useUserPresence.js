import { useEffect } from "react";
import { heartbeat, setUserOnline, setUserOffline } from "@chatsync/services/presence.service";
import { useAuthStore } from "@chatsync/store/useAuthStore";

export default function useUserPresence() {
    const user = useAuthStore((s) => s.user);
    const isProfileSynced = useAuthStore((s) => s.isProfileSynced);

    useEffect(() => {
        if (!user?.$id || !isProfileSynced) return;

        const userId = user.$id;
        console.log("Presence started for:", userId);

        // 🔥 Mark online & send initial heartbeat
        setUserOnline(userId);
        heartbeat(userId);

        // 🔁 Heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
            if (!document.hidden) {
                heartbeat(userId);
            }
        }, 10000);

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setUserOffline(userId);
            } else {
                setUserOnline(userId);
                heartbeat(userId);
            }
        };

        const handleBeforeUnload = () => {
            setUserOffline(userId);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            clearInterval(heartbeatInterval);
            handleBeforeUnload();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [user?.$id, isProfileSynced]);
}

