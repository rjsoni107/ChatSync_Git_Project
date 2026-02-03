import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const UserListItem = ({ user, onPress, loading }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            className="flex-row px-4 py-3 items-center active:bg-[#202c33]"
        >
            <View className="w-12 h-12 rounded-full bg-[#374045] items-center justify-center overflow-hidden">
                {user.profile_pic ? (
                    <Image source={{ uri: user.profile_pic }} className="w-full h-full" />
                ) : (
                    <Text className="text-white text-lg font-bold">
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

            <View className="ml-2">
                <Ionicons name="chevron-forward" size={20} color="#374045" />
            </View>
        </TouchableOpacity>
    );
};

export default UserListItem;
