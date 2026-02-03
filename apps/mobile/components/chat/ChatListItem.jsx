import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';

const ChatListItem = ({ chat, lastMessage, unreadCount, onlineStatus }) => {
    const router = useRouter();

    const getTime = (date) => {
        if (!date) return '';
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: false });
        } catch (e) {
            return '';
        }
    };

    return (
        <TouchableOpacity
            onPress={() => router.push(`/chat/${chat.$id}`)}
            className="flex-row px-4 py-3 items-center active:bg-[#202c33]"
        >
            {/* Avatar */}
            <View className="relative">
                <View className="w-14 h-14 rounded-full bg-[#202c33] items-center justify-center overflow-hidden">
                    {chat.avatar ? (
                        <Image source={{ uri: chat.avatar }} className="w-full h-full" />
                    ) : (
                        <Text className="text-white text-xl font-bold">
                            {chat.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    )}
                </View>
                {onlineStatus === 'online' && (
                    <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00a884] border-2 border-[#111b21]" />
                )}
            </View>

            {/* Chat Info */}
            <View className="flex-1 ml-4 border-b border-[#202c33] pb-3 justify-center">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>
                        {chat.name || 'Unknown'}
                    </Text>
                    <Text className={`text-xs ${unreadCount > 0 ? 'text-[#00a884]' : 'text-gray-400'}`}>
                        {lastMessage ? getTime(lastMessage.$createdAt) : ''}
                    </Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <Text className="text-[#8696a0] text-sm flex-1" numberOfLines={1}>
                        {lastMessage?.content || 'No messages yet'}
                    </Text>
                    {unreadCount > 0 && (
                        <View className="bg-[#00a884] rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                            <Text className="text-[#111b21] text-xs font-bold">
                                {unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default ChatListItem;
