//useAuth.js
import { useEffect } from "react";
import { useAuthStore } from "@chatsync/store/useAuthStore";
import { getCurrentUser } from "@chatsync/services/auth.service";
import { createUserProfile } from "@chatsync/services/user.service";

export default function useAuth() {
    const setUser = useAuthStore((s) => s.setUser);
    const setLoading = useAuthStore((s) => s.setLoading);
    const user = useAuthStore((s) => s.user);

    const isProfileSynced = useAuthStore((s) => s.isProfileSynced);
    const isSyncing = useAuthStore((s) => s.isSyncing);
    const setProfileSynced = useAuthStore((s) => s.setProfileSynced);
    const setSyncing = useAuthStore((s) => s.setSyncing);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const sessionUser = await getCurrentUser();
                setUser(sessionUser);
                console.log("fetchUser (initial check)", sessionUser);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        if (!user) {
            fetchUser();
        }
    }, [setUser, setLoading, user]);

    // 🔄 Sync profile whenever user is available
    useEffect(() => {
        if (user && !isProfileSynced && !isSyncing) {
            // Bulletproof lock to prevent any loop
            if (window._syncingId === user.$id) return;
            window._syncingId = user.$id;

            console.log("--- Starting Auto Sync ---");
            setSyncing(true);

            createUserProfile(user)
                .then((fullProfile) => {
                    console.log("--- Sync Completed Successfully ---", fullProfile);
                    setUser(fullProfile); // 🔥 Save full profile with about/pic to store
                    setProfileSynced(true);
                })
                .catch((err) => {
                    console.error("--- Sync Failed ---", err);
                })
                .finally(() => {
                    setSyncing(false);
                });
        }
    }, [user, isProfileSynced, isSyncing, setProfileSynced, setSyncing]);
}
