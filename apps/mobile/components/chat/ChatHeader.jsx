import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatHeader = ({ user, typing }) => {
    const router = useRouter();

    return (
        <SafeAreaView edges={['top']} className="bg-[#202c33] shadow-md">
            <View className="flex-row items-center px-2 py-2 h-16">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-1"
                >
                    <Ionicons name="arrow-back" size={24} color="#00a884" />
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
                    <Text className="text-white text-base font-bold" numberOfLines={1}>
                        {user?.name || 'Loading...'}
                    </Text>
                    <Text className="text-[#8696a0] text-xs">
                        {typing ? 'typing...' : (user?.isOnline ? 'online' : (user?.lastSeen ? `last seen ${new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'offline'))}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row">
                    <TouchableOpacity className="p-2">
                        <Ionicons name="videocam-outline" size={22} color="#00a884" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="call-outline" size={20} color="#00a884" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="ellipsis-vertical" size={20} color="#00a884" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ChatHeader;
