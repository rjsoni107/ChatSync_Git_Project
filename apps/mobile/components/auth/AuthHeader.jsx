import { View, Text, Image } from 'react-native';
import React from 'react';

const AuthHeader = ({ title, subtitle }) => {
    return (
        <View className="items-center mb-10 pt-10">
            <View className="w-20 h-20 bg-[#00a884] rounded-3xl items-center justify-center mb-6 shadow-lg">
                <Text className="text-white text-4xl font-black">CS</Text>
            </View>
            <Text className="text-white text-3xl font-bold mb-2">{title}</Text>
            {subtitle && (
                <Text className="text-[#8696a0] text-center px-6 leading-5">
                    {subtitle}
                </Text>
            )}
        </View>
    );
};

export default AuthHeader;
