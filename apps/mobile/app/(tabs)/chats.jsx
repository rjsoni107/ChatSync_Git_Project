import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useChatStore } from '@chatterapp/store/useChatStore';
import { getUserChats } from '@chatterapp/services/chat.service';
import { subscribeChatsRealtime, subscribeUserPresence } from '@chatterapp/services/realtime.service';
import { subscribeMessages } from '@chatterapp/services/message.service';
import ChatListItem from '../../components/chat/ChatListItem';
import SearchBar from '../../components/chat/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Chats = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const chats = useChatStore((s) => s.chats);
    const setChats = useChatStore((s) => s.setChats);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [presenceMap, setPresenceMap] = useState({});

    const fetchChats = useCallback(async (isRefresh = false) => {
        if (!user?.$id) return;

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const fetchedChats = await getUserChats(user.$id);
            setChats(fetchedChats);

            // Initialize presence map from fetched data
            const initialMap = {};
            fetchedChats.forEach(chat => {
                if (chat.otherUser) {
                    initialMap[chat.otherUser.$id] = chat.otherUser.isOnline ? 'online' : 'offline';
                }
            });
            setPresenceMap(initialMap);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.$id, setChats]);

    useEffect(() => {
        if (!user?.$id) return;

        fetchChats();

        // Subscribe to real-time chat updates
        const unsubscribeChats = subscribeChatsRealtime((event) => {
            fetchChats();
        });

        // Subscribe to message updates to refresh unread counts
        const unsubscribeMessages = subscribeMessages((event) => {
            // Re-fetch chats when any message is added or updated (e.g. isSeen changes)
            fetchChats();
        });

        // Subscribe to presence updates
        const unsubscribePresence = subscribeUserPresence((event) => {
            if (event.payload) {
                setPresenceMap(prev => ({
                    ...prev,
                    [event.payload.$id]: event.payload.isOnline ? 'online' : 'offline'
                }));
            }
        });

        return () => {
            unsubscribeChats();
            unsubscribeMessages();
            unsubscribePresence();
        };
    }, [fetchChats, user?.$id]);

    const filteredChats = chats.filter(chat => {
        const name = chat.name || chat.otherUser?.name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const renderItem = ({ item }) => (
        <ChatListItem
            chat={{
                ...item,
                name: item.name || item.otherUser?.name,
                avatar: item.otherUser?.avatar
            }}
            lastMessage={item.lastMessage ? {
                content: item.lastMessage,
                $createdAt: item.lastMessageAt,
                isSeen: item.lastMessageSeen,
                isDelivered: item.lastMessageDelivered,
                senderId: item.lastSenderId
            } : null}
            unreadCount={item.unreadCount}
            onlineStatus={presenceMap[item.otherUser?.$id] || item.otherUser?.status}
        />
    );

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-white text-2xl font-bold">ChatterApp</Text>
                <View className="flex-row items-center">
                    <TouchableOpacity className="p-2" onPress={() => router.push('/(tabs)/search')}>
                        <Ionicons name="camera-outline" size={24} color="#8696a0" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 ml-2" onPress={() => router.push('/(tabs)/profile')}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#8696a0" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

            {/* Chats List */}
            <FlatList
                data={filteredChats}
                renderItem={renderItem}
                keyExtractor={(item) => item.$id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchChats(true)}
                        tintColor="#00a884"
                    />
                }
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center pt-20 px-10">
                        {loading ? (
                            <Text className="text-gray-400">Loading chats...</Text>
                        ) : (
                            <>
                                <Ionicons name="chatbubbles-outline" size={80} color="#202c33" />
                                <Text className="text-white text-xl font-bold mt-4 text-center">
                                    No conversations yet
                                </Text>
                                <Text className="text-gray-400 text-center mt-2">
                                    Tap on the search tab to find friends and start chatting!
                                </Text>
                            </>
                        )}
                    </View>
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                className="absolute bottom-6 right-6 w-14 h-14 bg-[#00a884] rounded-2xl items-center justify-center shadow-lg"
                onPress={() => router.push('/(tabs)/search')}
            >
                <Ionicons name="chatbubble-ellipses" size={24} color="#111b21" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default Chats;
