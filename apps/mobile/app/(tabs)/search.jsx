import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@chatsync/store/useAuthStore';
import { searchUsers } from '@chatsync/services/user.service';
import { findPrivateChat, createChat, addChatMember } from '@chatsync/services/chat.service';
import SearchBar from '../../components/chat/SearchBar';
import UserListItem from '../../components/contacts/UserListItem';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Search = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingChat, setStartingChat] = useState(false);

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

    const handleStartChat = async (targetUser) => {
        if (startingChat || !user?.$id) return;

        setStartingChat(true);
        try {
            // 1. Check if chat already exists
            let chatId = await findPrivateChat(user.$id, targetUser.userId);

            // 2. If not, create new chat
            if (!chatId) {
                const newChat = await createChat();
                chatId = newChat.$id;

                // Add both members
                await Promise.all([
                    addChatMember(chatId, user.$id),
                    addChatMember(chatId, targetUser.userId)
                ]);
            }

            // 3. Navigate to the chat
            router.push(`/chat/${chatId}`);
        } catch (error) {
            console.error('Error starting chat:', error);
            alert('Failed to start chat. Please try again.');
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
                <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center">
                    <ActivityIndicator size="large" color="#00a884" />
                    <Text className="text-white mt-4 font-bold text-lg">Initializing chat...</Text>
                </View>
            )}

            <FlatList
                data={results}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => (
                    <UserListItem
                        user={item}
                        onPress={() => handleStartChat(item)}
                        loading={startingChat}
                    />
                )}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center pt-20 px-10">
                        {loading ? (
                            <ActivityIndicator size="large" color="#00a884" />
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
