import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const UserListItem = ({ user, onPress, loading, status }) => {
    const router = useRouter();
    // status: 'none' | 'sent' | 'friend'

    const renderButton = () => {
        if (status === 'friend') {
            return (
                <TouchableOpacity onPress={onPress} disabled={loading}>
                    <View className="bg-[#3b82f6]/40 px-4 py-1.5 rounded-full items-center border border-[#3b82f6]/30 flex-row">
                        <Ionicons name="chatbubble-ellipses-outline" size={17} color="white" />
                        <Text className="text-white font-bold text-base ml-1">Chat</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        if (status === 'sent') {
            return (
                <TouchableOpacity onPress={onPress} disabled={loading}>
                    <View className="bg-[#374045] px-4 py-1.5 rounded-full border border-white/5">
                        <Text className="text-white font-bold text-sm">Cancel</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        if (status === 'received') {
            return (
                <TouchableOpacity onPress={onPress} disabled={loading}>
                    <View className="bg-secondary px-4 py-1.5 rounded-full border border-white/5">
                        <Text className="text-white font-bold text-sm">Respond</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        // Default 'none' case
        return (
            <TouchableOpacity onPress={onPress} disabled={loading}>
                <View className="bg-secondary px-4 py-1.5 rounded-full items-center border border-black/5 flex-row">
                    <Ionicons name="person-add" size={17} color="white" />
                    <Text className="text-white font-bold text-sm ml-1">Add</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-row px-4 py-3 items-center">
            {/* Clickable Profile Part */}
            <TouchableOpacity
                onPress={() => router.push(`/user/${user.userId || user.$id}`)}
                className="flex-row flex-1 items-center"
            >
                <View className="w-12 h-12 rounded-full bg-[#374045] items-center justify-center overflow-hidden">
                    {user.profile_pic ? (
                        <Image source={{ uri: user.profile_pic }} className="w-full h-full" />
                    ) : (
                        <Text className="text-white text-base font-bold">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    )}
                </View>

                <View className="flex-1 ml-4 py-2 border-b border-[#202c33]">
                    <Text className="text-white text-base font-bold" numberOfLines={1}>
                        {user.name}
                    </Text>
                    <Text className="text-[#8696a0] text-sm" numberOfLines={1}>
                        @{user.username || 'user'}
                    </Text>
                </View>
            </TouchableOpacity>

            <View className="ml-2">
                {renderButton()}
            </View>
        </View>
    );
};

export default UserListItem;
