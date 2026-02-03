import { View, Text, Image } from 'react-native';
import React from 'react';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getFilePreview, getMobileFilePreview } from '@chatsync/services/storage.service';

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
                {message.type === 'image' && message.fileId && (
                    <View className="mb-2 rounded-xl overflow-hidden bg-black/10">
                        <Image
                            source={{ uri: getMobileFilePreview(message.fileId) }}
                            style={{ width: 250, height: 250 }}
                            resizeMode="cover"
                            onLoadStart={() => console.log('Image URI:', getMobileFilePreview(message.fileId))}
                            onError={(e) => console.log('Image Load Error:', e.nativeEvent.error)}
                        />
                    </View>
                )}
                <Text className="text-white text-base leading-5">
                    {message.body || message.content || (message.type === 'image' ? '' : '...')}
                </Text>

                <View className="flex-row items-center justify-end mt-1">
                    <Text className="text-[#8696a0] text-[10px] mr-1">
                        {getTime(message.$createdAt || message.createdAt)}
                    </Text>
                    {isMe && (
                        <View className="flex-row items-center">
                            {message.isSeen ? (
                                <Ionicons name="checkmark-done" size={16} color="#53bdeb" />
                            ) : message.isDelivered ? (
                                <Ionicons name="checkmark-done" size={16} color="#8696a0" />
                            ) : (
                                <Ionicons name="checkmark" size={16} color="#8696a0" />
                            )}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default MessageBubble;
