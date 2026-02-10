import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { getCurrentUser } from '@chatterapp/services/auth.service';
import { useUserPresence } from '../hooks/useUserPresence';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import CustomAlert from '../components/ui/CustomAlert';
import ImagePreviewModal from '../components/ui/ImagePreviewModal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../utils/notification.util';

export default function RootLayout() {
    const setUser = useAuthStore((s) => s.setUser);
    const user = useAuthStore((s) => s.user);
    const router = useRouter();
    const segments = useSegments();
    const [isReady, setIsReady] = useState(false);

    // Track user presence (online/offline)
    useUserPresence();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                }
            } catch (error) {
                console.log('No active session');
            } finally {
                setIsReady(true);
            }
        };

        checkSession();
    }, []);

    // Registration for Push Notifications
    useEffect(() => {
        if (user?.$id) {
            registerForPushNotificationsAsync(user.$id);
            const unsubscribe = setupNotificationListeners();
            return () => unsubscribe();
        }
    }, [user?.$id]);

    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === '(auth)';

        // Use a small timeout to ensure navigation happens in the next tick
        // This prevents many "navigation during render" or "unprotected path" loops
        const timeout = setTimeout(() => {
            const inAuthGroup = segments[0] === '(auth)';
            const isVerifyScreen = segments[1] === 'verify-email';

            if (!user && !inAuthGroup) {
                // Redirect to login if user is not authenticated and not in auth group
                router.replace('/(auth)/login');
            } else if (user && !user.emailVerification && !isVerifyScreen) {
                // Redirect to verification if user is logged in but not verified
                router.replace('/(auth)/verify-email');
            } else if (user && user.emailVerification && inAuthGroup) {
                // Redirect to tabs if user is authenticated and verified, but trying to access auth screens
                router.replace('/(tabs)/chats');
            }
        }, 10);

        return () => clearTimeout(timeout);
    }, [user, segments, isReady]);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111b21' }}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style="light" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#111b21' },
                    }}
                >
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="chat/[chatId]"
                        options={{
                            headerShown: false,
                            animation: 'slide_from_right'
                        }}
                    />
                    <Stack.Screen
                        name="profile/edit"
                        options={{
                            headerShown: false,
                            animation: 'slide_from_bottom'
                        }}
                    />
                </Stack>
                <CustomAlert />
                <ImagePreviewModal />
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}
