import { View, Text, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useChatStore } from '@chatterapp/store/useChatStore';
import { useNotificationStore } from '@chatterapp/store/useNotificationStore';
import { getUserChats } from '@chatterapp/services/chat.service';
import { markStatusSeen } from '@chatterapp/services/status.service';
import { subscribeChatsRealtime, subscribeUserPresence } from '@chatterapp/services/realtime.service';
import { subscribeMessages } from '@chatterapp/services/message.service';
import ChatListItem from '../../components/chat/ChatListItem';
import SearchBar from '../../components/chat/SearchBar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ChatListSkeleton from '../../components/chat/ChatListSkeleton';
import { useDebouncedCallback } from 'use-debounce';
import { getRecentStatuses } from '@chatterapp/services/status.service';
import StatusViewer from '../../components/status/StatusViewer';
import { useVideoPlayer } from 'expo-video';
import { useRef } from 'react';
import { Animated } from 'react-native';

const STORY_DURATION = 5000;

const Chats = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const chats = useChatStore((s) => s.chats);
    const setChats = useChatStore((s) => s.setChats);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [presenceMap, setPresenceMap] = useState({});
    const [statuses, setStatuses] = useState([]);

    // Viewer State
    const [viewingStatus, setViewingStatus] = useState(null);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Animation & Timing Refs
    const progress = useRef(new Animated.Value(0)).current;
    const animationRef = useRef(null);
    const remainingTimeRef = useRef(STORY_DURATION);
    const startTimeRef = useRef(null);

    // Video Player
    const player = useVideoPlayer(null);

    const fetchChats = useCallback(async (isRefresh = false, isSilent = false) => {
        if (!user?.$id) return;

        if (isRefresh) setRefreshing(true);
        else if (!isSilent) setLoading(true);

        try {
            const [fetchedChats, fetchedStatuses] = await Promise.all([
                getUserChats(user.$id),
                getRecentStatuses()
            ]);
            setChats(fetchedChats);
            setStatuses(fetchedStatuses);

            // Update unread messages count for tab badge
            const totalUnread = fetchedChats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
            useNotificationStore.getState().setUnreadMessagesCount(totalUnread);

            // Initialize presence map from fetched data
            const initialMap = {};
            fetchedChats.forEach(chat => {
                if (chat.otherUser) {
                    initialMap[chat.otherUser.$id] = chat.otherUser.isOnline ? 'online' : 'offline';
                }
            });
            setPresenceMap(initialMap);

            // 🏆 Deliver pending messages for all chats where unreadCount > 0
            const { markMessagesAsDelivered } = require('@chatterapp/services/message.service');
            const deliveryPromises = fetchedChats
                .filter(chat => chat.unreadCount > 0)
                .map(chat => markMessagesAsDelivered(chat.$id, user.$id));

            if (deliveryPromises.length > 0) {
                // Run in background, don't block UI
                Promise.all(deliveryPromises).catch(err => console.warn("Background delivery sync failed:", err));
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.$id, setChats]);

    // Story Logic
    useEffect(() => {
        if (!viewingStatus) return;

        const currentItem = viewingStatus.items[currentItemIndex];
        const totalDuration = currentItem.type === 'video' ? 15000 : STORY_DURATION;

        if (!isPaused) {
            startTimeRef.current = Date.now();
            animationRef.current = Animated.timing(progress, {
                toValue: 1,
                duration: remainingTimeRef.current,
                useNativeDriver: false,
            });

            animationRef.current.start(({ finished }) => {
                if (finished) {
                    setCurrentItemIndex(prev => {
                        if (prev < viewingStatus.items.length - 1) return prev + 1;
                        setViewingStatus(null);
                        return prev;
                    });
                }
            });
        } else {
            if (animationRef.current) {
                animationRef.current.stop();
                const elapsed = Date.now() - startTimeRef.current;
                remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
            }
        }
    }, [isPaused, viewingStatus, currentItemIndex]);

    useEffect(() => {
        if (!viewingStatus) return;
        progress.setValue(0);
        const currentItem = viewingStatus.items[currentItemIndex];
        remainingTimeRef.current = currentItem.type === 'video' ? 15000 : STORY_DURATION;

        if (currentItem.type === 'video') {
            player.replace(currentItem.mediaUrl);
            player.play();
        } else {
            player.pause();
        }
    }, [currentItemIndex, viewingStatus]);

    useEffect(() => {
        if (viewingStatus && user?.$id) {
            const currentItem = viewingStatus.items[currentItemIndex];
            if (currentItem.userId !== user.$id) {
                markStatusSeen(currentItem.$id, user.$id);
            }
        }
    }, [viewingStatus, currentItemIndex]);

    const debouncedFetch = useDebouncedCallback(() => {
        fetchChats(false, true);
    }, 500);

    // 1. Initial Load
    useEffect(() => {
        if (!user?.$id) return;
        fetchChats();
    }, [user?.$id, fetchChats]);

    // 2. Subscribe to Chat Meta Updates
    useEffect(() => {
        if (!user?.$id) return;
        const unsubscribe = subscribeChatsRealtime(() => {
            fetchChats(false, true);
        });
        return () => unsubscribe();
    }, [user?.$id, fetchChats]);

    // 3. Subscribe to Message Updates (for unread counts and delivery)
    useEffect(() => {
        if (!user?.$id) return;
        const unsubscribe = subscribeMessages(async (event) => {
            // Use debounce for general message updates to avoid refresh spam
            debouncedFetch();

            if (event.events.includes('databases.*.collections.*.documents.*.create')) {
                const newMessage = event.payload;
                if (newMessage.senderId !== user.$id) {
                    const { markMessagesAsDelivered } = require('@chatterapp/services/message.service');
                    markMessagesAsDelivered(newMessage.chatId, user.$id);
                }
            }
        });
        return () => unsubscribe();
    }, [user?.$id, debouncedFetch]);

    // 4. Subscribe to Presence Updates
    useEffect(() => {
        if (!user?.$id) return;
        const unsubscribe = subscribeUserPresence((event) => {
            if (event.payload) {
                setPresenceMap(prev => ({
                    ...prev,
                    [event.payload.$id]: event.payload.isOnline ? 'online' : 'offline'
                }));
            }
        });
        return () => unsubscribe();
    }, [user?.$id]);

    const filteredChats = chats.filter(chat => {
        const name = chat.name || chat.otherUser?.name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const renderItem = ({ item }) => (
        <ChatListItem
            chat={{
                ...item,
                name: item.name || item.otherUser?.name,
                avatar: item.otherUser?.profile_pic || item.otherUser?.avatar
            }}
            statusGroup={statuses.find(s => s.userId === item.otherUser?.$id)}
            onAvatarPress={(group) => {
                setViewingStatus(group);
                setCurrentItemIndex(0);
                setIsPaused(false);
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
            <View className="flex-row items-center justify-between px-4 pt-2">
                <Image
                    source={require('../../assets/chatterApp_name.png')}
                    className="w-40 h-10"
                    resizeMode="contain"
                />
                <View className="flex-row items-center">
                    <TouchableOpacity className="p-2" onPress={() => router.push('/(tabs)/search')}>
                        <View className="bg-secondary px-2 py-2 rounded-full flex-row items-center border border-black/5">
                            <Ionicons name="person-add-outline" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2" onPress={() => router.push('/(tabs)/profile')}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#8696a0" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

            {loading ? (
                <ChatListSkeleton />
            ) : (
                <FlatList
                    data={filteredChats}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.$id}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchChats(true)}
                            tintColor="#2563eb"
                        />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center pt-20 px-10">
                            <Ionicons name="chatbubbles-outline" size={80} color="#202c33" />
                            <Text className="text-white text-xl font-bold mt-4 text-center">
                                No conversations yet
                            </Text>
                            <Text className="text-gray-400 text-center mt-2">
                                Tap on the search tab to find friends and start chatting!
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            {/* ... */}

            <StatusViewer
                visible={!!viewingStatus}
                allStatuses={statuses}
                initialGroupIndex={statuses.findIndex(s => s.userId === viewingStatus?.userId)}
                onGroupChange={(group) => {
                    setViewingStatus(group);
                    setCurrentItemIndex(0);
                    setIsPaused(false);
                    progress.setValue(0);
                }}
                currentItemIndex={currentItemIndex}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
                onClose={() => setViewingStatus(null)}
                onNext={() => {
                    setCurrentItemIndex(prev => {
                        if (!viewingStatus) return prev;
                        if (prev < viewingStatus.items.length - 1) return prev + 1;
                        setViewingStatus(null);
                        return prev;
                    });
                }}
                onPrev={() => setCurrentItemIndex(prev => (prev > 0 ? prev - 1 : prev))}
                onNavigateToViewers={() => { }}
                user={user}
                progress={progress}
                player={player}
                replyText={""}
                setReplyText={() => { }}
                onReply={() => { }}
                onDelete={() => { }}
                onHighlight={() => { }}
                sendingReply={false}
                animationRef={animationRef}
                remainingTimeRef={remainingTimeRef}
                startTimeRef={startTimeRef}
            />
        </SafeAreaView>
    );
};

export default Chats;
