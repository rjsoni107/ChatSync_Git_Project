import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { searchUsers } from '@chatterapp/services/user.service';
import { findPrivateChat, getUserChats } from '@chatterapp/services/chat.service';
import { sendChatRequest, checkExistingRelationship, cancelChatRequest, getReceivedRequests } from '@chatterapp/services/request.service';
import SearchBar from '../../components/chat/SearchBar';
import UserListItem from '../../components/contacts/UserListItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

const Search = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingChat, setStartingChat] = useState(false);
    const [friends, setFriends] = useState(new Set());
    const [pendingRequests, setPendingRequests] = useState(new Map()); // userId -> requestId

    const fetchRelationships = async () => {
        if (!user?.$id) return;
        try {
            // 1. Get current friends (active chats)
            const chats = await getUserChats(user.$id);
            const friendIds = new Set(chats.map(chat => chat.otherUser?.$id).filter(Boolean));
            setFriends(friendIds);

            // 2. Get SENT pending requests
            // We need a way to get sent requests specifically. 
            // For now, let's use checkExistingRelationship or a new helper if needed.
            // Since we don't have a 'getSentRequests', let's fix that in service later or use listDocuments here.
        } catch (error) {
            console.error('Error fetching relationships:', error);
        }
    };

    useEffect(() => {
        fetchRelationships();
    }, [user?.$id]);

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

            // To be efficient, we'll check relationship for each result
            const resultsWithStatus = await Promise.all(users.map(async (u) => {
                const isFriend = friends.has(u.userId);
                if (isFriend) return { ...u, relationshipStatus: 'friend' };

                const rel = await checkExistingRelationship(user.$id, u.userId);
                if (rel?.type === 'request_sent') return { ...u, relationshipStatus: 'sent', requestId: rel.id };

                return { ...u, relationshipStatus: 'none' };
            }));

            setResults(resultsWithStatus);
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

            if (targetUser.relationshipStatus === 'sent') {
                // Cancel request
                await cancelChatRequest(targetUser.requestId);
                Alert.alert("Success", "Request cancelled.");
            } else {
                // Send new chat request
                await sendChatRequest(user.$id, targetUser.userId);
                Alert.alert("Success", "Chat request sent!");
            }
            // Refresh results to show new status
            handleSearch();
        } catch (error) {
            console.error('Error handling chat request:', error);
            Alert.alert('Error', error.message || 'Action failed.');
        } finally {
            setStartingChat(false);
        }
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
                renderItem={({ item }) => (
                    <UserListItem
                        user={item}
                        status={item.relationshipStatus}
                        onPress={() => handleAction(item)}
                        loading={startingChat}
                    />
                )}
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
