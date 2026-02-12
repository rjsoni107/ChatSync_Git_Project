import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../ui/Skeleton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatLastSeen } from '@chatterapp/utils/date';
import bgColor from '../ui/bgColor';
import StatusAvatar from '../status/StatusAvatar';
import { useAuthStore } from '@chatterapp/store/useAuthStore';

const ChatHeader = ({ user, typing, chatId, chat, members, statusGroup, onAvatarPress }) => {
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.user);

    const isGroup = chat?.type === 'group';

    let avatarName = ""
    const displayName = isGroup ? chat.name : user?.name;
    const profilePic = isGroup ? chat.avatar : (user?.profile_pic || user?.avatar);

    if (displayName) {
        const splitName = displayName.split(" ")
        if (splitName.length > 1) {
            avatarName = splitName[0][0] + splitName[1][0]
        } else {
            avatarName = splitName[0][0]
        }
    }

    const nameHash = displayName ? displayName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const colorIndex = nameHash % (bgColor.length || 1);

    const isSeen = statusGroup ? statusGroup.items.every(item => item.viewers?.includes(currentUser?.$id)) : false;

    const getStatusText = () => {
        const typingNames = Object.values(typing || {});
        if (typingNames.length > 0) {
            if (typingNames.length === 1) return `${typingNames[0]} is typing...`;
            return `${typingNames[0]}, ${typingNames[1]}${typingNames.length > 2 ? '...' : ''} are typing...`;
        }

        if (isGroup) {
            return `${members?.length || 0} members`;
        }

        return user?.isOnline ? 'online' : formatLastSeen(user?.lastSeen);
    };

    return (
        <SafeAreaView edges={['top']} className="bg-surface shadow-md">
            <View className="flex-row items-center px-2 py-2 h-16">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-1"
                >
                    <Ionicons name="arrow-back" size={24} color="#3b82f6" />
                </TouchableOpacity>

                <View className="flex-1 flex-row items-center">
                    {displayName ? (
                        <>
                            <TouchableOpacity
                                onPress={() => !isGroup && statusGroup ? onAvatarPress(statusGroup) : null}
                                className="ml-1"
                            >
                                <StatusAvatar
                                    imageUrl={profilePic}
                                    itemsCount={!isGroup && statusGroup ? statusGroup?.items?.length || 0 : 0}
                                    isSeen={isSeen}
                                    size={48}
                                    fallbackText={avatarName || "?"}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="ml-2 flex-1"
                                onPress={() => {
                                    if (isGroup) {
                                        router.push(`/chat/group-info/${chatId}`);
                                    } else {
                                        router.push({
                                            pathname: `/user/${user?.$id}`,
                                            params: { chatId: chatId }
                                        });
                                    }
                                }}
                            >
                                <Text className="text-white text-base font-bold" numberOfLines={1}>
                                    {displayName}
                                </Text>
                                <Text className="text-[#8696a0] text-xs" numberOfLines={1}>
                                    {getStatusText()}
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Skeleton width={48} height={48} borderRadius={24} backgroundColor="#374045" className="ml-1" />
                            <View className="ml-2">
                                <Skeleton width={120} height={16} borderRadius={8} backgroundColor="#374045" className="mb-2" />
                                <Skeleton width={80} height={12} borderRadius={6} backgroundColor="#374045" />
                            </View>
                        </>
                    )}
                </View>

                <View className="flex-row">
                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: '/chat/media-gallery',
                            params: { chatId, chatName: displayName }
                        })}
                        className="p-2"
                    >
                        <Ionicons name="images-outline" size={23} color="#60a5fa" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="videocam-outline" size={25} color="#60a5fa" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="call-outline" size={25} color="#60a5fa" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="ellipsis-vertical" size={23} color="#60a5fa" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ChatHeader;
