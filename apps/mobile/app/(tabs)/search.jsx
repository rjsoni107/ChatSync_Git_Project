import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { searchUsers } from '@chatterapp/services/user.service';
import { findPrivateChat, getUserChats } from '@chatterapp/services/chat.service';
import { sendChatRequest, checkExistingRelationship, cancelChatRequest, getReceivedRequests, getSentRequests } from '@chatterapp/services/request.service';
import { subscribeRequests } from '@chatterapp/services/realtime.service';
import SearchBar from '../../components/chat/SearchBar';
import UserListItem from '../../components/contacts/UserListItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const Search = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const showAlert = useAlertStore(s => s.showAlert);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingChat, setStartingChat] = useState(false);
    const [friends, setFriends] = useState(new Set());
    const [sentRequests, setSentRequests] = useState(new Map()); // userId -> requestId
    const [receivedRequests, setReceivedRequests] = useState(new Map()); // userId -> requestId

    const fetchRelationships = async () => {
        if (!user?.$id) return;
        try {
            // 1. Get current friends (active chats)
            const chats = await getUserChats(user.$id);
            const friendIds = new Set(chats.map(chat => chat.otherUser?.$id).filter(Boolean));
            setFriends(friendIds);

            // 2. Get SENT and RECEIVED pending requests
            const [sent, received] = await Promise.all([
                getSentRequests(user.$id),
                getReceivedRequests(user.$id)
            ]);

            const sentMap = new Map();
            sent.forEach(r => sentMap.set(r.receiverId, r.$id));
            setSentRequests(sentMap);

            const receivedMap = new Map();
            received.forEach(r => receivedMap.set(r.senderId, r.$id));
            setReceivedRequests(receivedMap);

        } catch (error) {
            console.error('Error fetching relationships:', error);
        }
    };

    useEffect(() => {
        fetchRelationships();
    }, [user?.$id]);

    // Real-time Relationship Updates
    useEffect(() => {
        if (!user?.$id) return;

        const unsubscribe = subscribeRequests(async (event) => {
            const payload = event.payload;
            // Check if this request involves the current user
            const isRelevant = payload.senderId === user.$id || payload.receiverId === user.$id;

            if (isRelevant) {
                // Refresh friend set and search results to update statuses
                await fetchRelationships();
                if (query.trim().length >= 2) {
                    handleSearch();
                }
            }
        });

        return () => unsubscribe();
    }, [user?.$id, query]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length >= 2) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = async () => {
        if (!user?.$id) return;
        setLoading(true);
        try {
            const users = await searchUsers(query, user.$id);
            setResults(users);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (targetUser) => {
        if (startingChat || !user?.$id) return;

        setStartingChat(true);
        try {
            if (targetUser.relationshipStatus === 'friend') {
                const chatId = await findPrivateChat(user.$id, targetUser.userId);
                if (chatId) {
                    router.push(`/chat/${chatId}`);
                }
                return;
            }

            if (targetUser.relationshipStatus === 'received') {
                router.push('/(tabs)/requests');
                return;
            }

            if (targetUser.relationshipStatus === 'sent') {
                // Cancel request
                await cancelChatRequest(targetUser.requestId);
                showAlert("Success", "Request cancelled.");
                // Manually update state
                setSentRequests(prev => {
                    const newState = new Map(prev);
                    newState.delete(targetUser.userId);
                    return newState;
                });
            } else {
                // Send new chat request
                const res = await sendChatRequest(user.$id, targetUser.userId);
                showAlert("Success", "Chat request sent!");
                // Manually update state for instant button toggle
                setSentRequests(prev => new Map(prev).set(targetUser.userId, res.$id));
            }
            // No need to fetchRelationships() if state is manually updated
        } catch (error) {
            console.error('Error handling chat request:', error);
            showAlert('Error', error.message || 'Action failed.');
        } finally {
            setStartingChat(false);
        }
    };

    const getRelationshipInfo = (userId) => {
        if (friends.has(userId)) return { status: 'friend' };
        if (sentRequests.has(userId)) return { status: 'sent', requestId: sentRequests.get(userId) };
        if (receivedRequests.has(userId)) return { status: 'received', requestId: receivedRequests.get(userId) };
        return { status: 'none' };
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="px-4 py-3">
                <Text className="text-white text-2xl font-bold">Search People</Text>
            </View>

            <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or username..."
            />

            {startingChat && (
                <View
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, alignItems: 'center', justifyContent: 'center' }}
                >
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text className="text-white mt-4 font-bold text-lg">Processing...</Text>
                </View>
            )}

            <FlatList
                data={results}
                keyExtractor={(item) => item.$id}
                extraData={[friends, sentRequests, receivedRequests]}
                renderItem={({ item }) => {
                    const info = getRelationshipInfo(item.userId);
                    return (
                        <UserListItem
                            user={item}
                            status={info.status}
                            onPress={() => handleAction({ ...item, relationshipStatus: info.status, requestId: info.requestId })}
                            loading={startingChat}
                        />
                    );
                }}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center pt-20 px-10">
                        {loading ? (
                            <ActivityIndicator size="large" color="#2563eb" />
                        ) : query.length < 2 ? (
                            <>
                                <Ionicons name="people-outline" size={80} color="#202c33" />
                                <Text className="text-gray-400 text-center mt-4 text-lg">
                                    Type at least 2 characters to search for people
                                </Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="search-outline" size={80} color="#202c33" />
                                <Text className="text-white text-xl font-bold mt-4 text-center">
                                    No users found
                                </Text>
                                <Text className="text-gray-400 text-center mt-2">
                                    Try searching with a different name or username
                                </Text>
                            </>
                        )}
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

export default Search;
