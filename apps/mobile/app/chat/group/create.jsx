import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { getUserChats } from '@chatterapp/services/chat.service';

const CreateGroup = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const [friends, setFriends] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchFriends = useCallback(async () => {
        if (!user?.$id) return;
        try {
            const chats = await getUserChats(user.$id);
            // In a real app, you'd filter for direct friends. 
            // For now, any user with an active private chat is a "friend".
            const contacts = chats
                .filter(c => c.type === 'private' && c.otherUser)
                .map(c => c.otherUser);

            // Remove duplicates (though shouldn't exist in chats)
            const uniqueContacts = Array.from(new Map(contacts.map(u => [u.$id, u])).values());
            setFriends(uniqueContacts);
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.$id]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    const toggleUser = (u) => {
        if (selectedUsers.find(su => su.$id === u.$id)) {
            setSelectedUsers(prev => prev.filter(su => su.$id !== u.$id));
        } else {
            setSelectedUsers(prev => [...prev, u]);
        }
    };

    const filteredFriends = friends.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNext = () => {
        if (selectedUsers.length === 0) return;
        // Pass selected user IDs to the next screen
        const userIdsString = selectedUsers.map(u => u.$id).join(',');
        router.push({
            pathname: '/chat/group/details',
            params: { userIds: userIdsString }
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-[#202c33]">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#60a5fa" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-white text-lg font-bold">New Group</Text>
                    <Text className="text-[#8696a0] text-xs">
                        {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'Add members'}
                    </Text>
                </View>
                {selectedUsers.length > 0 && (
                    <TouchableOpacity
                        onPress={handleNext}
                        className="bg-primary px-4 py-1.5 rounded-full"
                    >
                        <Text className="text-white font-bold">Next</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Selected Users Bar */}
            {selectedUsers.length > 0 && (
                <View className="py-3 border-b border-[#202c33]">
                    <FlatList
                        horizontal
                        data={selectedUsers}
                        keyExtractor={item => `sel-${item.$id}`}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => toggleUser(item)}
                                className="items-center mr-4 relative"
                            >
                                <View className="w-14 h-14 rounded-full bg-gray-600 overflow-hidden">
                                    {item.profile_pic ? (
                                        <Image source={{ uri: item.profile_pic }} className="w-full h-full" />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center">
                                            <Text className="text-white font-bold text-lg">{item.name[0]}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text className="text-white text-[10px] mt-1 w-14 text-center" numberOfLines={1}>
                                    {item.name.split(' ')[0]}
                                </Text>
                                <View className="absolute top-0 right-0 bg-[#8696a0] rounded-full p-0.5">
                                    <Ionicons name="close" size={12} color="white" />
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Search */}
            <View className="px-4 py-2">
                <View className="flex-row items-center bg-[#202c33] rounded-full px-4 h-10">
                    <Ionicons name="search" size={18} color="#8696a0" />
                    <TextInput
                        className="flex-1 ml-2 text-white"
                        placeholder="Search contacts"
                        placeholderTextColor="#8696a0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Contact List */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#60a5fa" />
                </View>
            ) : (
                <FlatList
                    data={filteredFriends}
                    keyExtractor={item => item.$id}
                    renderItem={({ item }) => {
                        const isSelected = selectedUsers.find(su => su.$id === item.$id);
                        return (
                            <TouchableOpacity
                                onPress={() => toggleUser(item)}
                                className="flex-row items-center px-4 py-3 active:bg-[#202c33]"
                            >
                                <View className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden">
                                    {item.profile_pic ? (
                                        <Image source={{ uri: item.profile_pic }} className="w-full h-full" />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center">
                                            <Text className="text-white font-bold">{item.name[0]}</Text>
                                        </View>
                                    )}
                                </View>
                                <View className="flex-1 ml-4 py-1">
                                    <Text className="text-white font-bold text-base">{item.name}</Text>
                                    <Text className="text-[#8696a0] text-xs">@{item.username}</Text>
                                </View>
                                {isSelected && (
                                    <View className="bg-primary rounded-full p-1">
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-20">
                            <Text className="text-[#8696a0]">No contacts found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default CreateGroup;
