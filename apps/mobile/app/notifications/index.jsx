import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useNotificationStore } from '@chatterapp/store/useNotificationStore';
import { getProfileViews, markViewAsRead } from '@chatterapp/services/notification.service';
import { getUsersByIds } from '@chatterapp/services/user.service';
import { formatLastSeen } from '@chatterapp/utils/date';
import bgColor from '../../components/ui/bgColor';

const NotificationsScreen = () => {
    const router = useRouter();
    const user = useAuthStore(s => s.user);
    const setProfileViewsCount = useNotificationStore(s => s.setProfileViewsCount);

    const [views, setViews] = useState([]);
    const [viewersMap, setViewersMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async (isRefresh = false) => {
        if (!user?.$id) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const profileViews = await getProfileViews(user.$id);
            setViews(profileViews);

            // Update unread count in store
            const unreadCount = profileViews.filter(v => !v.isRead).length;
            setProfileViewsCount(unreadCount);

            // Fetch viewer profiles
            const viewerIds = [...new Set(profileViews.map(v => v.viewerId))];
            if (viewerIds.length > 0) {
                const viewerProfiles = await getUsersByIds(viewerIds);
                const map = {};
                viewerProfiles.forEach(p => {
                    map[p.userId] = p;
                });
                setViewersMap(map);
            }
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.$id, setProfileViewsCount]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleMarkAsRead = async (viewId) => {
        try {
            await markViewAsRead(viewId);
            setViews(prev => prev.map(v => v.$id === viewId ? { ...v, isRead: true } : v));
            setProfileViewsCount(Math.max(0, useNotificationStore.getState().profileViewsCount - 1));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const renderItem = ({ item }) => {
        const viewer = viewersMap[item.viewerId];
        const avatarName = viewer?.name ? viewer.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";
        const nameHash = viewer?.name ? viewer.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
        const colorIndex = nameHash % (bgColor.length || 1);

        return (
            <TouchableOpacity
                onPress={() => {
                    if (!item.isRead) handleMarkAsRead(item.$id);
                    router.push(`/user/${item.viewerId}`);
                }}
                className={`flex-row items-center px-4 py-4 border-b border-[#202c33] ${item.isRead ? 'opacity-70' : 'bg-[#202c33]/20'}`}
            >
                <View className={`w-12 h-12 rounded-full items-center justify-center overflow-hidden ${bgColor[colorIndex]}`}>
                    {viewer?.profile_pic ? (
                        <Image source={{ uri: viewer.profile_pic }} className="w-full h-full" />
                    ) : (
                        <Text className="text-[#1c2932] font-bold">{avatarName}</Text>
                    )}
                </View>

                <View className="flex-1 ml-4">
                    <Text className="text-white text-base">
                        <Text className="font-bold">{viewer?.name || 'Someone'}</Text> viewed your profile{" "}
                        {item.count > 1 ? <Text className="text-primary font-bold">{item.count} times</Text> : ""}
                    </Text>
                    <Text className="text-[#8696a0] text-xs mt-1">
                        {formatLastSeen(item.lastViewedAt)}
                    </Text>
                </View>

                {!item.isRead && (
                    <TouchableOpacity
                        onPress={() => handleMarkAsRead(item.$id)}
                        className="bg-primary/20 px-3 py-1 rounded-full border border-primary/30"
                    >
                        <Text className="text-primary text-[10px] font-bold">Mark as read</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="flex-row items-center px-4 py-3 border-b border-[#202c33]">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#60a5fa" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Activity</Text>
            </View>

            {loading && views.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#60a5fa" />
                </View>
            ) : (
                <FlatList
                    data={views}
                    renderItem={renderItem}
                    keyExtractor={item => item.$id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor="#60a5fa" />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center pt-20">
                            <Ionicons name="eye-outline" size={80} color="#202c33" />
                            <Text className="text-[#8696a0] mt-4 text-center">No profile views yet</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default NotificationsScreen;
