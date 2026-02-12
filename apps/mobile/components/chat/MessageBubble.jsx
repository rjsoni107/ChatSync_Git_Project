import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getMobileFilePreview } from '@chatterapp/services/storage.service';
import { addReactionToMessage, deleteMessage, deleteMessageForUser, updateMessage, togglePinMessage, deleteMessageForEveryone, voteOnPoll } from '@chatterapp/services/message.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useAlertStore } from '@chatterapp/store/useAlertStore';
import { useImagePreviewStore } from '@chatterapp/store/useImagePreviewStore';
import MessageMenu from './MessageMenu';
import VoiceMessage from './VoiceMessage';

const getTime = (date) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'hh:mm a');
    } catch (e) {
        return '';
    }
};

const MessageBubble = React.memo(({ message, isMe, isGroup, senderName, onEdit }) => {
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
        if (actionId === 'edit') {
            onEdit?.(message);
        } else if (actionId === 'pin') {
            try {
                await togglePinMessage(message.$id, true);
            } catch (e) {
                showAlert('Error', 'Failed to pin message');
            }
        } else if (actionId === 'unpin') {
            try {
                await togglePinMessage(message.$id, false);
            } catch (e) {
                showAlert('Error', 'Failed to unpin message');
            }
        } else if (actionId === 'unsend') {
            showAlert('Delete for everyone?', 'This will remove the message content for everyone in this chat.', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMessageForEveryone(message.$id);
                        } catch (e) {
                            console.error("Delete Error:", e);
                            showAlert('Error', `Failed to delete message: ${e.message || 'Unknown error'}`);
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

    if (message.isDeleted) {
        return (
            <View className={`mb-4 px-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[280px] rounded-2xl border border-white/10 px-4 py-2 ${isMe ? 'bg-[#1f2c34] rounded-tr-none' : 'bg-[#111b21] rounded-tl-none'}`}>
                    <View className="flex-row items-center">
                        <Ionicons name="ban-outline" size={14} color="#8696a0" style={{ marginRight: 6 }} />
                        <Text className="text-[#8696a0] text-sm italic">
                            {isMe ? 'You deleted this message' : 'This message was deleted'}
                        </Text>
                    </View>
                    <View className="flex-row items-center justify-end mt-1">
                        <Text className="text-[#8696a0] text-[10px]">
                            {getTime(message.$createdAt || message.createdAt)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    const pollData = useMemo(() => {
        if (message.type !== 'poll') return null;
        try {
            return JSON.parse(message.content);
        } catch (e) { return null; }
    }, [message.content, message.type]);

    const pollMetadata = useMemo(() => {
        if (message.type !== 'poll') return { votes: {} };
        try {
            return message.metadata ? JSON.parse(message.metadata) : { votes: {} };
        } catch (e) { return { votes: {} }; }
    }, [message.metadata, message.type]);

    const handleVote = async (index) => {
        try {
            await voteOnPoll(message.$id, user.$id, index);
        } catch (error) {
            console.error("Failed to vote:", error);
        }
    };

    const stickerScale = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (message.type === 'sticker') {
            Animated.spring(stickerScale, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
    }, [message.type]);

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
                    message={message}
                />

                <Pressable
                    onLongPress={handleLongPress}
                    delayLongPress={300}
                    onPress={handleMessagePress}
                    style={({ pressed }) => [
                        pressed && { opacity: 0.7 }
                    ]}
                    className={`max-w-[280px] min-w-[120px] rounded-2xl shadow-sm ${message.type === 'image' ? 'p-1' : 'px-1 py-1'} ${isMe
                        ? (message.type === 'sticker' ? 'bg-transparent' : 'bg-[#043d72] rounded-tr-none')
                        : (message.type === 'sticker' ? 'bg-transparent' : 'bg-surface rounded-tl-none')
                        } ${message.type === 'sticker' ? 'shadow-none' : ''}`}
                >
                    {isGroup && !isMe && senderName && (
                        <Text className="text-secondary text-[11px] font-bold px-2 pt-1 mb-1">
                            {senderName}
                        </Text>
                    )}
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

                    {message.type === 'voice' && message.fileId && (
                        <VoiceMessage
                            fileId={message.fileId}
                            duration={parseInt(message.content || "0")}
                            isMe={isMe}
                        />
                    )}

                    {message.type === 'gif' && message.content && (
                        <View className="rounded-xl overflow-hidden bg-black/10">
                            <Image
                                source={message.content}
                                style={{ width: 240, height: 180 }}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                        </View>
                    )}

                    {message.type === 'sticker' && message.content && (
                        <Animated.View style={{ transform: [{ scale: stickerScale }] }}>
                            <Image
                                source={message.content}
                                style={{ width: 180, height: 180 }}
                                contentFit="contain"
                                transition={300}
                                cachePolicy="memory-disk"
                            />
                        </Animated.View>
                    )}

                    {message.content && message.content !== "[Image]" && message.type !== 'voice' && message.type !== 'gif' && message.type !== 'poll' && (
                        <Text className="text-white text-base leading-5 mt-1 px-2">
                            {message.body || message.content}
                        </Text>
                    )}

                    {message.type === 'poll' && pollData && (
                        <View className="px-2 pt-1 pb-2 min-w-[240px]">
                            <Text className="text-white text-lg font-bold mb-3">{pollData.question}</Text>
                            {pollData.options.map((opt, index) => {
                                const totalVotes = Object.keys(pollMetadata.votes).length;
                                const optionVotes = Object.values(pollMetadata.votes).filter(v => v === index).length;
                                const percentage = totalVotes === 0 ? 0 : (optionVotes / totalVotes) * 100;
                                const hasVoted = pollMetadata.votes[user?.$id] === index;

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleVote(index)}
                                        className="mb-2 last:mb-0"
                                    >
                                        <View className="relative bg-[#202c33] rounded-lg overflow-hidden h-10 justify-center px-3 border border-white/5">
                                            <Animated.View
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: `${percentage}%`,
                                                    backgroundColor: hasVoted ? '#3b82f6' : '#2a3942',
                                                    opacity: 0.6
                                                }}
                                            />
                                            <View className="flex-row justify-between items-center z-10">
                                                <Text className={`text-sm ${hasVoted ? 'text-white font-bold' : 'text-[#e9edef]'}`}>
                                                    {opt}
                                                </Text>
                                                <View className="flex-row items-center">
                                                    {hasVoted && <Ionicons name="checkmark-circle" size={16} color="#3b82f6" className="mr-1" />}
                                                    <Text className="text-[10px] text-[#8696a0] ml-2">
                                                        {optionVotes} ({Math.round(percentage)}%)
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            <Text className="text-[#8696a0] text-[10px] mt-2 text-center">
                                {Object.keys(pollMetadata.votes).length} votes • Tap to vote
                            </Text>
                        </View>
                    )}

                    <View className="flex-row items-center justify-end mt-1 px-2">
                        {message.isPinned && (
                            <Ionicons name="pin" size={12} color="#8696a0" style={{ transform: [{ rotate: '45deg' }], marginRight: 4 }} />
                        )}
                        {message.isEdited && (
                            <Text className="text-[#8696a0] text-[9px] mr-1 italic">
                                (edited)
                            </Text>
                        )}
                        <Text className="text-[#bcc4bc] text-[10px] mr-1">
                            {getTime(message.$createdAt || message.createdAt)}
                        </Text>
                        {isMe && (
                            <View className="flex-row items-center">
                                {message.isSeen ? (
                                    <Ionicons name="checkmark-done" size={16} color="#3ec93e" />
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
                        <View className={`absolute -bottom-5 flex-row items-center bg-surface rounded-full px-1 py-0.5 border border-background shadow-sm ${isMe ? 'right-0' : 'left-0'}`}>
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
