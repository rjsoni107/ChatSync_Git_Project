import { View, Text } from 'react-native';
import React from 'react';

export const ChatBubble = ({ message, isMe }) => {
    return (
        <View style={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
            <Text>{message.content}</Text>
        </View>
    );
};
