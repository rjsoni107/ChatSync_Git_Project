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

            // ⏳ 3s delay to ensure session is 100% active in SDK
            setTimeout(() => {
                createUserProfile(user)
                    .then(() => {
                        console.log("--- Sync Completed Successfully ---");
                        setProfileSynced(true);
                    })
                    .catch((err) => {
                        console.error("--- Sync Failed ---", err);
                        // We don't reset _syncingId here to prevent infinite retries.
                        // If it fails once, it stops until the user refreshes.
                    })
                    .finally(() => {
                        setSyncing(false);
                    });
            }, 3000);
        }
    }, [user, isProfileSynced, isSyncing, setProfileSynced, setSyncing]);
}
