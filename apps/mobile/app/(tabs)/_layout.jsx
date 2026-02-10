import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import TabBar from '../../components/navigation/TabBar';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useNotificationStore } from '@chatterapp/store/useNotificationStore';
import { getReceivedRequests } from '@chatterapp/services/request.service';
import { getUserChats } from '@chatterapp/services/chat.service';
import { subscribeRequests } from '@chatterapp/services/realtime.service';
import { subscribeMessages } from '@chatterapp/services/message.service';

export default function TabsLayout() {
    const user = useAuthStore(s => s.user);

    useEffect(() => {
        if (!user?.$id) return;

        const setCounts = async () => {
            try {
                // Initial fetch
                const [requests, chats] = await Promise.all([
                    getReceivedRequests(user.$id),
                    getUserChats(user.$id)
                ]);

                useNotificationStore.getState().setPendingRequestsCount(requests.length);
                const totalUnread = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
                useNotificationStore.getState().setUnreadMessagesCount(totalUnread);
            } catch (error) {
                console.error("Error setting initial badge counts:", error);
            }
        };

        setCounts();

        // Realtime for requests
        const unsubscribeRequests = subscribeRequests((event) => {
            setCounts();
        });

        // Realtime for messages (to update unread count)
        const unsubscribeMessages = subscribeMessages((event) => {
            setCounts();
        });

        return () => {
            unsubscribeRequests();
            unsubscribeMessages();
        };
    }, [user?.$id]);

    return (
        <Tabs
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                sceneContainerStyle: { backgroundColor: '#0b141a' },
            }}
        >
            <Tabs.Screen
                name="chats"
                options={{
                    title: 'Chats',
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                }}
            />
            <Tabs.Screen
                name="requests"
                options={{
                    title: 'Requests',
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                }}
            />
        </Tabs>
    );
}
