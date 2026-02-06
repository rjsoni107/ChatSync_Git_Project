import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const UserListItem = ({ user, onPress, loading, status }) => {
    // status: 'none' | 'sent' | 'friend'
    
    const renderButton = () => {
        if (status === 'friend') {
            return (
                <View className="bg-[#3b82f6]/20 px-4 py-1.5 rounded-full border border-[#3b82f6]/30">
                    <Text className="text-[#3b82f6] font-bold text-xs">Chat</Text>
                </View>
            );
        }

        if (status === 'sent') {
            return (
                <View className="bg-[#374045] px-4 py-1.5 rounded-full border border-white/5">
                    <Text className="text-white font-bold text-xs">Cancel</Text>
                </View>
            );
        }

        // Default 'none' case
        return (
            <View className="bg-[#FFFC00] px-4 py-1.5 rounded-full flex-row items-center border border-black/5">
                <Ionicons name="person-add" size={14} color="black" />
                <Text className="text-black font-bold text-xs ml-1">Add</Text>
            </View>
        );
    };

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

            <View className="ml-2">
                {renderButton()}
            </View>
        </TouchableOpacity>
    );
};

export default UserListItem;
