import { Tabs } from 'expo-router';
import React from 'react';
import TabBar from '../../components/navigation/TabBar';

export default function TabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
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
