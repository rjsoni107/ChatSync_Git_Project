import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../ui/Skeleton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatLastSeen } from '@chatterapp/utils/date';
import bgColor from '../ui/bgColor';

const ChatHeader = ({ user, typing, chatId }) => {
    const router = useRouter();

    let avatarName = ""

    if (user?.name) {
        const splitName = user?.name?.split(" ")

        if (splitName.length > 1) {
            avatarName = splitName[0][0] + splitName[1][0]
        } else {
            avatarName = splitName[0][0]
        }
    }

    const nameHash = user?.name ? user?.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const colorIndex = nameHash % (bgColor.length || 1);

    return (
        <SafeAreaView edges={['top']} className="bg-surface shadow-md">
            <View className="flex-row items-center px-2 py-2 h-16">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-1"
                >
                    <Ionicons name="arrow-back" size={24} color="#3b82f6" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 flex-row items-center"
                    onPress={() => router.push({
                        pathname: `/user/${user?.$id}`,
                        params: { chatId: chatId }
                    })}
                >
                    {user?.name ? (
                        <>
                            <View className={`w-12 h-12 rounded-full items-center justify-center overflow-hidden ml-1 ${bgColor[colorIndex]}`}>
                                {user?.profile_pic ? (
                                    <Image source={{ uri: user.profile_pic }} className="w-full h-full" />
                                ) : user?.avatar ? (
                                    <Image source={{ uri: user.avatar }} className="w-full h-full" />
                                ) : (
                                    <Text className="text-[#111b21] text-lg font-bold">
                                        {avatarName}
                                    </Text>
                                )}
                            </View>
                            <View className="ml-2 w-64">
                                <Text className="text-white text-base font-bold" numberOfLines={1}>
                                    {user.name}
                                </Text>
                                <Text className="text-[#8696a0] text-xs" numberOfLines={1}>
                                    {typing ? 'typing...' : (user?.isOnline ? 'online' : formatLastSeen(user?.lastSeen))}
                                </Text>
                            </View>
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
                </TouchableOpacity>

                <View className="flex-row">
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
