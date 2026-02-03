import { View, Text, Pressable, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getMobileFilePreview } from '@chatsync/services/storage.service';
import { addReactionToMessage, deleteMessage, deleteMessageForUser } from '@chatsync/services/message.service';
import { useAuthStore } from '@chatsync/store/useAuthStore';
import ReactionBar from './ReactionBar';
import MessageMenu from './MessageMenu';

const getTime = (date) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'HH:mm');
    } catch (e) {
        return '';
    }
};

const MessageBubble = React.memo(({ message, isMe }) => {
    const user = useAuthStore(s => s.user);
    const [showMenu, setShowMenu] = useState(false);

    if (!message) return null;

    // Check if message is deleted for current user
    const deletedFor = useMemo(() => {
        try {
            return message.deletedForUsers ? JSON.parse(message.deletedForUsers) : [];
        } catch (e) { return []; }
    }, [message.deletedForUsers]);

    if (deletedFor.includes(user?.$id)) return null;

    const reactions = useMemo(() => {
        try {
            return message.reactions ? JSON.parse(message.reactions) : [];
        } catch (e) {
            return [];
        }
    }, [message.reactions]);

    const groupedReactions = useMemo(() => {
        const groups = {};
        reactions.forEach(r => {
            if (!groups[r.emoji]) groups[r.emoji] = 0;
            groups[r.emoji]++;
        });
        return groups;
    }, [reactions]);

    const handleLongPress = () => {
        setShowMenu(true);
    };

    const handleSelectReaction = async (emoji) => {
        try {
            await addReactionToMessage(message.$id, emoji, user.$id);
        } catch (error) {
            console.error("Failed to add reaction:", error);
        }
    };

    const handleMenuAction = async (actionId) => {
        if (actionId === 'unsend') {
            Alert.alert('Unsend Message?', 'This will remove the message for everyone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unsend',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMessage(message.$id);
                        } catch (e) {
                            console.error("Unsend Error Details:", e);
                            Alert.alert('Error', `Failed to unsend: ${e.message || 'Unknown error'}`);
                        }
                    }
                }
            ]);
        } else if (actionId === 'delete_for_me') {
            try {
                await deleteMessageForUser(message.$id, user.$id);
            } catch (e) { Alert.alert('Error', 'Failed to delete message'); }
        }
    };

    return (
        <View className={`mb-4 px-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
            <View className="relative">
                <MessageMenu
                    isVisible={showMenu}
                    onClose={() => setShowMenu(false)}
                    onAction={handleMenuAction}
                    onSelectEmoji={handleSelectReaction}
                    onShowMore={() => {
                        setShowMenu(false);
                        Alert.alert("Coming Soon", "Full emoji picker for reactions is on the way!");
                    }}
                    isMe={isMe}
                    timestamp={getTime(message.$createdAt || message.createdAt)}
                />

                <Pressable
                    onLongPress={handleLongPress}
                    delayLongPress={300}
                    onPress={() => {
                        if (showMenu) {
                            setShowMenu(false);
                            setShowReactions(false);
                        }
                    }}
                    className={`max-w-[280px] min-w-[100px] rounded-2xl px-3 py-2 shadow-sm ${isMe
                        ? 'bg-[#005c4b] rounded-tr-none'
                        : 'bg-[#202c33] rounded-tl-none'
                        }`}
                >
                    {message.type === 'image' && message.fileId && (
                        <View className="mb-2 rounded-xl overflow-hidden bg-black/10">
                            <Image
                                source={getMobileFilePreview(message.fileId)}
                                style={{ width: 240, height: 240 }}
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

                    {/* Reactions Display */}
                    {reactions.length > 0 && (
                        <View className={`absolute -bottom-3 flex-row items-center bg-[#202c33] rounded-full px-1 py-0.5 border border-[#111b21] shadow-sm ${isMe ? 'right-0' : 'left-0'}`}>
                            {Object.entries(groupedReactions).map(([emoji, count]) => (
                                <View key={emoji} className="flex-row items-center mx-0.5">
                                    <Text className="text-[12px]">{emoji}</Text>
                                    {reactions.length > 1 && (
                                        <Text className="text-white text-[10px] ml-0.5">{count}</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </Pressable>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return prevProps.message?.$id === nextProps.message?.$id &&
        prevProps.message?.isSeen === nextProps.message?.isSeen &&
        prevProps.message?.isDelivered === nextProps.message?.isDelivered &&
        prevProps.message?.reactions === nextProps.message?.reactions;
});

export default MessageBubble;
