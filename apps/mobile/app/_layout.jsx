import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@chatsync/store/useAuthStore';
import { getCurrentUser } from '@chatsync/services/auth.service';
import { useUserPresence } from '../hooks/useUserPresence';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

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

    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // Redirect to login if user is not authenticated and not in auth group
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // Redirect to tabs if user is authenticated and trying to access auth screens
            router.replace('/(tabs)/chats');
        }
    }, [user, segments, isReady]);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111b21' }}>
                <ActivityIndicator size="large" color="#00a884" />
            </View>
        );
    }

    return (
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
            </Stack>
        </GestureHandlerRootView>
    );
}
