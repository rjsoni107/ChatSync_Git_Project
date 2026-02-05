import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Skeleton from '../ui/Skeleton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatLastSeen } from '@chatterapp/utils/date';

const ChatHeader = ({ user, typing }) => {
    const router = useRouter();

    return (
        <SafeAreaView edges={['top']} className="bg-surface shadow-md">
            <View className="flex-row items-center px-2 py-2 h-16">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-1"
                >
                    <Ionicons name="arrow-back" size={24} color="#3b82f6" />
                    <View className="w-10 h-10 rounded-full bg-[#374045] items-center justify-center overflow-hidden ml-1">
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} className="w-full h-full" />
                        ) : (
                            <Text className="text-white font-bold">
                                {user?.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 ml-2"
                    onPress={() => {/* Profile details? */ }}
                >
                    {user?.name ? (
                        <Text className="text-white text-base font-bold" numberOfLines={1}>
                            {user.name}
                        </Text>
                    ) : (
                        <Skeleton width={120} height={18} borderRadius={9} />
                    )}
                    <Text className="text-[#8696a0] text-xs">
                        {typing ? 'typing...' : (user?.isOnline ? 'online' : formatLastSeen(user?.lastSeen))}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row">
                    <TouchableOpacity className="p-2">
                        <Ionicons name="videocam-outline" size={24} color="#60a5fa" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="call-outline" size={24} color="#60a5fa" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="ellipsis-vertical" size={22} color="#60a5fa" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ChatHeader;
