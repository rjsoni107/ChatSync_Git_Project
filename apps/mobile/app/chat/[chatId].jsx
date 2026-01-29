import { View, Text } from 'react-native';
import React from 'react';
import { useLocalSearchParams } from 'expo-router';

const Chat = () => {
    const { chatId } = useLocalSearchParams();
    return (
        <View className="flex-1 justify-center items-center">
            <Text>Chat ID: {chatId}</Text>
        </View>
    );
};

export default Chat;
