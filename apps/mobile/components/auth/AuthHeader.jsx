import { View, Text, Image } from 'react-native';
import React from 'react';

const AuthHeader = ({ title, subtitle, logo }) => {
    return (
        <View className="items-center mb-10 pt-10">
            {logo && (
                <View className="w-60 h-20  rounded-3xl items-center justify-center mb-6 shadow-lg">
                    <Image source={logo} className="w-full h-full" resizeMode="contain" />
                </View>
            )}
            <Text className="text-white text-3xl font-bold mb-1">{title}</Text>
            {subtitle && (
                <Text className="text-[#8696a0] text-center px-5 leading-5">
                    {subtitle}
                </Text>
            )}
        </View>
    );
};

export default AuthHeader;
