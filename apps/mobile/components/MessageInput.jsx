import { View, TextInput } from 'react-native';
import React from 'react';

export const MessageInput = ({ onSend }) => {
    return (
        <View>
            <TextInput placeholder="Type a message..." />
        </View>
    );
};
