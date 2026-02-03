import { View, Text } from 'react-native';
import React from 'react';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const MessageBubble = ({ message, isMe }) => {
    if (!message) return null;

    const getTime = (date) => {
        if (!date) return '';
        try {
            return format(new Date(date), 'HH:mm');
        } catch (e) {
            return '';
        }
    };

    return (
        <View className={`mb-2 px-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
            <View
                className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${isMe
                    ? 'bg-[#005c4b] rounded-tr-none'
                    : 'bg-[#202c33] rounded-tl-none'
                    }`}
            >
                <Text className="text-white text-base leading-5">
                    {message.body || message.content || '...'}
                </Text>

                <View className="flex-row items-center justify-end mt-1">
                    <Text className="text-[#8696a0] text-[10px] mr-1">
                        {getTime(message.$createdAt || message.createdAt)}
                    </Text>
                    {isMe && (
                        <Ionicons
                            name={message.isSeen ? "checkmark-done" : "checkmark"}
                            size={14}
                            color={message.isSeen ? "#53bdeb" : "#8696a0"}
                        />
                    )}
                </View>
            </View>
        </View>
    );
};

export default MessageBubble;
