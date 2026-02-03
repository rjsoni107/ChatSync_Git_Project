import { View, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const MessageInput = ({ onSendMessage, onTyping }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (!message.trim()) return;
        onSendMessage(message.trim());
        setMessage('');
    };

    const handleChangeText = (text) => {
        setMessage(text);
        if (onTyping) onTyping();
    };

    return (
        <View className="flex-row items-center p-2 bg-[#111b21]">
            <View className="flex-row flex-1 items-center bg-[#202c33] rounded-3xl px-3 h-12">
                <TouchableOpacity className="mr-2">
                    <Ionicons name="happy-outline" size={24} color="#8696a0" />
                </TouchableOpacity>

                <TextInput
                    className="flex-1 text-white text-base pt-0 pb-0"
                    placeholder="Type a message"
                    placeholderTextColor="#8696a0"
                    value={message}
                    onChangeText={handleChangeText}
                    multiline
                />

                <TouchableOpacity className="ml-2">
                    <Ionicons name="attach-outline" size={24} color="#8696a0" className="rotate-45" />
                </TouchableOpacity>

                {!message.trim() && (
                    <TouchableOpacity className="ml-3">
                        <Ionicons name="camera-outline" size={24} color="#8696a0" />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                onPress={handleSend}
                className="ml-2 w-12 h-12 bg-[#00a884] rounded-full items-center justify-center shadow-md"
            >
                <Ionicons
                    name={message.trim() ? "send" : "mic"}
                    size={24}
                    color="#ffffff"
                />
            </TouchableOpacity>
        </View>
    );
};

export default MessageInput;
