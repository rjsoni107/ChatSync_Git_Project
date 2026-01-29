import { View, Text, Image } from 'react-native';
import React from 'react';

export const UserAvatar = ({ url, name }) => {
    return (
        <View className="w-10 h-10 rounded-full bg-gray-200 justify-center items-center overflow-hidden">
            {url ? <Image source={{ uri: url }} className="w-full h-full" /> : <Text>{name?.[0]}</Text>}
        </View>
    );
};
