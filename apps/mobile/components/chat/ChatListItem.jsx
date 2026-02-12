import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import StatusAvatar from '../status/StatusAvatar';

const ChatListItem = ({ chat, lastMessage, unreadCount, onlineStatus, statusGroup, onAvatarPress }) => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);

    const getTime = (date) => {
        if (!date) return '';
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: false });
        } catch (e) {
            return '';
        }
    };

    const isSeen = statusGroup ? statusGroup.items.every(item => item.viewers?.includes(user?.$id)) : false;

    return (
        <TouchableOpacity
            onPress={() => router.push(`/chat/${chat.$id}`)}
            className="flex-row px-4 py-3 items-center active:bg-[#202c33]"
        >
            {/* Avatar */}
            <View className="relative">
                <TouchableOpacity
                    onPress={() => statusGroup ? onAvatarPress(statusGroup) : router.push(`/chat/${chat.$id}`)}
                >
                    <StatusAvatar
                        imageUrl={chat.avatar || chat.profile_pic}
                        itemsCount={statusGroup?.items?.length || 0}
                        isSeen={isSeen}
                        size={56}
                        fallbackText={chat.name || "?"}
                    />
                </TouchableOpacity>
                {onlineStatus === 'online' && (
                    <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-600 border-2 border-[#111b21] z-10" />
                )}
            </View>

            {/* Chat Info */}
            <View className="flex-1 ml-4 border-b border-[#202c33] pb-3 justify-center">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>
                        {chat.name || 'Unknown'}
                    </Text>
                    <Text className={`text-xs ${unreadCount > 0 ? 'text-secondary' : 'text-gray-400'}`}>
                        {lastMessage ? getTime(lastMessage.$createdAt) : ''}
                    </Text>
                </View>

                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center flex-1 pr-2">
                        {lastMessage?.senderId === user?.$id && (
                            <View className="mr-1">
                                {lastMessage.isSeen ? (
                                    <Ionicons name="checkmark-done" size={16} color="#53bdeb" />
                                ) : lastMessage.isDelivered ? (
                                    <Ionicons name="checkmark-done" size={16} color="#8696a0" />
                                ) : (
                                    <Ionicons name="checkmark" size={16} color="#8696a0" />
                                )}
                            </View>
                        )}
                        <Text className="text-[#8696a0] text-sm flex-1" numberOfLines={1}>
                            {lastMessage?.content || 'No messages yet'}
                        </Text>
                    </View>
                    {unreadCount > 0 && (
                        <View className="bg-secondary rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                            <Text className="text-white text-xs font-bold">
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
