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
import { registerForPushNotificationsAsync, setupNotificationListeners, BACKGROUND_DELIVERY_TASK } from '../utils/notification.util';
import * as BackgroundFetch from 'expo-background-fetch';
import { AppState } from 'react-native';
import { getAppLockEnabled, authenticateWithBiometrics } from '@chatterapp/services/security.service';
import LockOverlay from '../components/ui/LockOverlay';

export default function RootLayout() {
    const setUser = useAuthStore((s) => s.setUser);
    const user = useAuthStore((s) => s.user);
    const router = useRouter();
    const segments = useSegments();
    const [isReady, setIsReady] = useState(false);

    // App Lock State
    const [isLocked, setIsLocked] = useState(false);
    const [isAppLockEnabled, setIsAppLockSettingEnabled] = useState(false);
    const [authenticating, setAuthenticating] = useState(false);

    // Track user presence (online/offline)
    useUserPresence();

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Initialize Lock State
                const lockEnabled = await getAppLockEnabled();
                setIsAppLockSettingEnabled(lockEnabled);
                if (lockEnabled) {
                    setIsLocked(true);
                }

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

    // Handle App Lock Activation/Deactivation on App State changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'background') {
                // When app goes to background, and lock is enabled, we lock it again
                const lockEnabled = await getAppLockEnabled();
                if (lockEnabled) {
                    setIsLocked(true);
                }
            }
        });

        return () => subscription.remove();
    }, []);

    const handleUnlock = async () => {
        setAuthenticating(true);
        const success = await authenticateWithBiometrics("Unlock your messages");
        if (success) {
            setIsLocked(false);
        }
        setAuthenticating(false);
    };

    // Auto-prompt biometrics when locked and app becomes active
    useEffect(() => {
        if (isLocked && isReady) {
            handleUnlock();
        }
    }, [isLocked, isReady]);

    // Registration for Push Notifications
    useEffect(() => {
        if (user?.$id) {
            registerForPushNotificationsAsync(user.$id);
            const unsubscribe = setupNotificationListeners((chatId) => {
                // Navigate to chat
                router.push(`/chat/${chatId}`);
            });

            // 🏆 Register Background Fetch
            const registerBackgroundFetch = async () => {
                try {
                    await BackgroundFetch.registerTaskAsync(BACKGROUND_DELIVERY_TASK, {
                        minimumInterval: 60 * 15, // 15 minutes (standard for iOS/Android)
                        stopOnTerminate: false, // Keep running after app close
                        startOnBoot: true, // Start after device restart
                    });
                    console.log('✅ Background Fetch registered');
                } catch (err) {
                    console.error('❌ Background Fetch registration failed:', err);
                }
            };
            registerBackgroundFetch();

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
            const isResetScreen = segments[1] === 'reset-password';

            if (!user && !inAuthGroup) {
                // Redirect to login if user is not authenticated and not in auth group
                router.replace('/(auth)/login');
            } else if (user && !user.emailVerification && !isVerifyScreen) {
                // Redirect to verification if user is logged in but not verified
                router.replace('/(auth)/verify-email');
            } else if (user && user.emailVerification && inAuthGroup && !isResetScreen) {
                // Redirect to tabs if user is authenticated and verified, but trying to access auth screens
                // EXCEPT if it's the reset-password screen (accessed via deep link)
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
                {isLocked && (
                    <LockOverlay
                        onUnlock={handleUnlock}
                        authenticating={authenticating}
                    />
                )}
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}
