import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getMobileFilePreview } from '@chatsync/services/storage.service';
import { addReactionToMessage, deleteMessage, deleteMessageForUser } from '@chatsync/services/message.service';
import { useAuthStore } from '@chatsync/store/useAuthStore';
import { useAlertStore } from '@chatsync/store/useAlertStore';
import { useImagePreviewStore } from '@chatsync/store/useImagePreviewStore';
import MessageMenu from './MessageMenu';

const getTime = (date) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'hh:mm a');
    } catch (e) {
        return '';
    }
};

const MessageBubble = React.memo(({ message, isMe }) => {
    const user = useAuthStore(s => s.user);
    const showAlert = useAlertStore(s => s.showAlert);
    const showImage = useImagePreviewStore(s => s.showImage);
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

    const handleMessagePress = () => {
        if (showMenu) {
            setShowMenu(false);
            return;
        }

        if (message.type === 'image' && message.fileId) {
            showImage(getMobileFilePreview(message.fileId));
        }
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
            showAlert('Unsend Message?', 'This will remove the message for everyone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unsend',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMessage(message.$id);
                        } catch (e) {
                            console.error("Unsend Error Details:", e);
                            showAlert('Error', `Failed to unsend: ${e.message || 'Unknown error'}`);
                        }
                    }
                }
            ]);
        } else if (actionId === 'delete_for_me') {
            try {
                await deleteMessageForUser(message.$id, user.$id);
            } catch (e) {
                showAlert('Error', 'Failed to delete message');
            }
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
                        showAlert("Coming Soon", "Full emoji picker for reactions is on the way!");
                    }}
                    isMe={isMe}
                    timestamp={getTime(message.$createdAt || message.createdAt)}
                />

                <Pressable
                    onLongPress={handleLongPress}
                    delayLongPress={300}
                    onPress={handleMessagePress}
                    className={`max-w-[280px] min-w-[120px] rounded-2xl shadow-sm ${message.type === 'image' ? 'p-1' : 'px-1 py-1'} ${isMe
                        ? 'bg-[#005c4b] rounded-tr-none'
                        : 'bg-[#202c33] rounded-tl-none'
                        }`}
                >
                    {message.type === 'image' && message.fileId && (
                        <View className="rounded-xl overflow-hidden bg-black/10">
                            <Image
                                source={getMobileFilePreview(message.fileId)}
                                style={{ width: 240, height: undefined, aspectRatio: 1 }}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                        </View>
                    )}

                    {message.content && message.content !== "[Image]" && (
                        <Text className="text-white text-base leading-5 mt-1 px-2">
                            {message.body || message.content}
                        </Text>
                    )}

                    <View className="flex-row items-center justify-end">
                        <Text className="text-[#bcc1c4] text-[10px] mr-1">
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
                        <View className={`absolute -bottom-5 flex-row items-center bg-[#202c33] rounded-full px-1 py-0.5 border border-[#111b21] shadow-sm ${isMe ? 'right-0' : 'left-0'}`}>
                            {Object.entries(groupedReactions).map(([emoji, count]) => (
                                <View key={emoji} className="flex-row items-center mx-0.5">
                                    <Text className="text-[14px]">{emoji}</Text>
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
