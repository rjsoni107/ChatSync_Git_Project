import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const SettingsItem = ({ icon, title, subtitle, onPress, color = '#8696a0', showChevron = true }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center px-4 py-4 active:bg-[#202c33]"
        >
            <View className="w-10 h-10 items-center justify-center">
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View className="flex-1 ml-4">
                <Text className="text-white text-base font-medium">{title}</Text>
                {subtitle && (
                    <Text className="text-[#8696a0] text-sm mt-0.5">{subtitle}</Text>
                )}
            </View>
            {showChevron && (
                <Ionicons name="chevron-forward" size={18} color="#374045" />
            )}
        </TouchableOpacity>
    );
};

export default SettingsItem;
