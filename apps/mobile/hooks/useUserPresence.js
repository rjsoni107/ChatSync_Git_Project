import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { heartbeat, setUserOnline, setUserOffline } from '@chatterapp/services/presence.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';

export const useUserPresence = () => {
    const user = useAuthStore((s) => s.user);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        if (!user?.$id) return;

        const userId = user.$id;
        console.log("Presence started for mobile user:", userId);

        // Mark online initially
        setUserOnline(userId).catch(err => console.error("Error setting online:", err));

        // Heartbeat every 20 seconds for mobile (slightly longer than web to save battery)
        const heartbeatInterval = setInterval(() => {
            if (appState.current === 'active') {
                heartbeat(userId).catch(err => console.warn("Presence heartbeat failed:", err.message));
            }
        }, 20000);

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to foreground
                setUserOnline(userId).catch(err => console.error("Error setting online:", err));
                heartbeat(userId).catch(err => console.warn("Presence heartbeat failed:", err.message));
            } else if (
                appState.current === 'active' &&
                nextAppState.match(/inactive|background/)
            ) {
                // App has gone to background
                setUserOffline(userId).catch(err => console.error("Error setting offline:", err));
            }

            appState.current = nextAppState;
        });

        return () => {
            clearInterval(heartbeatInterval);
            subscription.remove();
            setUserOffline(userId).catch(err => console.error("Error setting offline on unmount:", err));
        };
    }, [user?.$id]);
};
