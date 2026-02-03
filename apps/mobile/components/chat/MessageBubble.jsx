import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import React from 'react';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getMobileFilePreview } from '@chatsync/services/storage.service';

const getTime = (date) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'HH:mm');
    } catch (e) {
        return '';
    }
};

const MessageBubble = React.memo(({ message, isMe }) => {
    if (!message) return null;

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
                            source={getMobileFilePreview(message.fileId)}
                            style={{ width: 250, height: 250 }}
                            contentFit="cover"
                            transition={200}
                            cachePolicy="memory-disk"
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
}, (prevProps, nextProps) => {
    return prevProps.message?.$id === nextProps.message?.$id &&
        prevProps.message?.isSeen === nextProps.message?.isSeen &&
        prevProps.message?.isDelivered === nextProps.message?.isDelivered;
});

export default MessageBubble;
