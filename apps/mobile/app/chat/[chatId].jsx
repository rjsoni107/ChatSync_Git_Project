import { View, Text, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useChatStore } from '@chatterapp/store/useChatStore';
import { getMessagesByChat, sendMessage, markMessagesAsSeen, markMessagesAsDelivered, subscribeMessages, updateMessage } from '@chatterapp/services/message.service';
import { getOtherUserFromChat, getChat, getChatMembers } from '@chatterapp/services/chat.service';
import { setTyping, removeTyping } from '@chatterapp/services/typing.service';
import { subscribeTyping, subscribeSingleUserPresence, subscribeChatTyping } from '@chatterapp/services/realtime.service';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageInput from '../../components/chat/MessageInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InteractionManager, Animated } from 'react-native';
import { getRecentStatuses, markStatusSeen } from '@chatterapp/services/status.service';
import StatusViewer from '../../components/status/StatusViewer';
import { useVideoPlayer } from 'expo-video';

const STORY_DURATION = 5000;
const WALLPAPER_COLORS = {
    'default': '#0b141a',
    'blue': '#043d72',
    'green': '#064e3b',
    'purple': '#4c1d95',
    'wine': '#450a0a',
    'grey': '#1f2937',
};


import { getMessageDateLabel } from '@chatterapp/utils/date';

const ChatScreen = () => {
    const { chatId } = useLocalSearchParams();
    const user = useAuthStore((s) => s.user);
    const messages = useChatStore((s) => s.messages);
    const setMessages = useChatStore((s) => s.setMessages);
    const addMessage = useChatStore((s) => s.addMessage);

    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState({}); // { [userId]: name }
    const [statuses, setStatuses] = useState([]);
    const [editingMessage, setEditingMessage] = useState(null);
    const [wallpaper, setWallpaper] = useState('default');

    // Viewer State
    const [isPaused, setIsPaused] = useState(false);
    const [chat, setChat] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);

    // Animation & Timing Refs
    const progress = useRef(new Animated.Value(0)).current;
    const animationRef = useRef(null);
    const remainingTimeRef = useRef(STORY_DURATION);
    const startTimeRef = useRef(null);

    // Video Player
    const player = useVideoPlayer(null);

    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const isAtBottomRef = useRef(true);
    const didInitialScrollRef = useRef(false);

    const loadChatData = useCallback(async () => {
        if (!chatId || !user?.$id) return;

        try {
            setLoading(true);
            const [msgs, other, fetchedStatuses, chatDoc] = await Promise.all([
                getMessagesByChat(chatId),
                getOtherUserFromChat(chatId, user.$id),
                getRecentStatuses(),
                getChat(chatId)
            ]);
            setMessages(msgs);
            setOtherUser(other);
            setStatuses(fetchedStatuses);
            setChat(chatDoc);

            if (chatDoc.type === 'group') {
                const members = await getChatMembers(chatId);
                setGroupMembers(members);
            }

            // Fetch wallpaper
            const savedWallpaper = await SecureStore.getItemAsync('chat_wallpaper_uri');
            if (savedWallpaper) setWallpaper(savedWallpaper);

            // Mark messages as seen when opening the chat
            await markMessagesAsSeen(chatId, user.$id);
            await markMessagesAsDelivered(chatId, user.$id);
        } catch (error) {
            console.error('Error loading chat data:', error);
        } finally {
            setLoading(false);
        }
    }, [chatId, user?.$id, setMessages]);

    // 1. Load initial chat data
    useEffect(() => {
        if (!user?.$id || !chatId) return;

        // Clear previous chat data to prevent stale display
        setMessages([]);
        didInitialScrollRef.current = false;

        loadChatData();
    }, [chatId, user?.$id]); // Re-run only on chat change

    // 2. Subscribe to messages (Persistent during chat session)
    useEffect(() => {
        if (!user?.$id || !chatId) return;

        const unsubscribeMessages = subscribeMessages(async (res) => {
            if (res.events.includes('databases.*.collections.*.documents.*.create')) {
                const newMessage = res.payload;
                if (newMessage.chatId === chatId) {
                    addMessage(newMessage);
                    // Mark as seen if it's from the other user
                    if (newMessage.senderId !== user.$id) {
                        await markMessagesAsSeen(chatId, user.$id);
                        await markMessagesAsDelivered(chatId, user.$id);
                    }
                }
            } else if (res.events.includes('databases.*.collections.*.documents.*.update')) {
                const updatedMessage = res.payload;
                if (updatedMessage.chatId === chatId) {
                    setMessages(prev => prev.map(m => m.$id === updatedMessage.$id ? updatedMessage : m));
                }
            } else if (res.events.includes('databases.*.collections.*.documents.*.delete')) {
                const deletedMessage = res.payload;
                setMessages(prev => prev.filter(m => m.$id !== deletedMessage.$id));
            }
        });

        return () => unsubscribeMessages();
    }, [chatId, user?.$id, addMessage, setMessages]); // Independent of otherUser state

    // 3. Subscribe to Other User's typing status
    useEffect(() => {
        if (!chatId || !user?.$id) return;

        const unsubscribeTyping = subscribeTyping(async (res) => {
            const payload = res.payload;
            if (payload.chatId !== chatId || payload.userId === user.$id) return;

            if (res.events.some(e => e.includes('.create') || e.includes('.update'))) {
                setTypingUsers(prev => {
                    const next = { ...prev };
                    if (payload.isTyping) {
                        next[payload.userId] = payload.name;
                    } else {
                        delete next[payload.userId];
                    }
                    return next;
                });
            } else if (res.events.some(e => e.includes('.delete'))) {
                // For deletes, the payload might only contain the document ID
                // but our docId is chatId_userId, let's try to extract or just refresh
                // or better, typing status is usually update based.
                // If we can't get userId from payload on delete, we might need a different approach
                // but Appwrite usually includes the doc in payload.
                setTypingUsers(prev => {
                    const next = { ...prev };
                    delete next[payload.userId];
                    return next;
                });
            }
        });

        return () => {
            unsubscribeTyping();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [chatId, user?.$id]);

    // 4. Subscribe to Other User's presence updates
    const pinnedMessages = useMemo(() => {
        return messages.filter(m => m.isPinned && !m.isDeleted);
    }, [messages]);

    useEffect(() => {
        if (!otherUser?.$id) return;

        console.log("Subscribing to other user presence:", otherUser.$id);
        const unsubscribePresence = subscribeSingleUserPresence(otherUser.$id, (payload) => {
            console.log("Other user presence update:", payload.isOnline);
            setOtherUser(payload);
        });

        return () => unsubscribePresence();
    }, [otherUser?.$id]);

    useEffect(() => {
        if (!messages.length) return;
        if (didInitialScrollRef.current) return;

        InteractionManager.runAfterInteractions(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
            didInitialScrollRef.current = true;
        });
    }, [messages.length]);

    // Force scroll to bottom when keyboard opens
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onKeyboardShow = () => {
            if (isAtBottomRef.current) {
                // Small delay to allow layout calculation
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        };

        const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);

        return () => {
            showSubscription.remove();
        };
    }, []);


    const handleSendMessage = async (content, type = 'text', fileId = null, messageIdToEdit = null, duration = null) => {
        if (messageIdToEdit) {
            try {
                await updateMessage(messageIdToEdit, content);
                setEditingMessage(null);
                return;
            } catch (err) {
                console.error("Failed to edit message:", err);
                return;
            }
        }
        if ((!content?.trim() && !fileId) || !user?.$id) return;

        try {
            await sendMessage({
                chatId,
                senderId: user.$id,
                content: content?.trim() || '',
                type,
                fileId,
                duration
            });
            // remove typing indicator once message sent
            handleStopTyping();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            setTyping({
                chatId,
                userId: user.$id,
                name: user.name,
                isTyping: true
            });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            handleStopTyping();
        }, 3000);
    };

    const handleStopTyping = () => {
        if (isTypingRef.current) {
            isTypingRef.current = false;
            setTyping({
                chatId,
                userId: user.$id,
                name: user.name,
                isTyping: false
            });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const membersMap = useMemo(() => {
        const map = {};
        groupMembers.forEach(m => {
            if (m.user) map[m.userId] = m.user.name;
        });
        return map;
    }, [groupMembers]);

    const renderMessage = useCallback(({ item, index }) => {
        if (!item) return null;

        const dateLabel = getMessageDateLabel(item.$createdAt || item.createdAt);
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const prevDateLabel = prevMessage ? getMessageDateLabel(prevMessage.$createdAt || prevMessage.createdAt) : null;
        const showDateLabel = dateLabel !== prevDateLabel;

        return (
            <View>
                {showDateLabel && (
                    <View className="items-center my-4">
                        <View className="bg-[#1f2c34] px-3 py-1 rounded-lg">
                            <Text className="text-[#8696a0] text-[11px] font-medium uppercase tracking-wider">
                                {dateLabel}
                            </Text>
                        </View>
                    </View>
                )}
                <MessageBubble
                    message={item}
                    isMe={item.senderId === user?.$id}
                    isGroup={chat?.type === 'group'}
                    senderName={membersMap[item.senderId]}
                    onEdit={(msg) => setEditingMessage(msg)}
                />
            </View>
        );
    }, [user?.$id, messages]);

    const keyExtractor = useCallback((item) => item?.$id || Math.random().toString(), []);

    // Story Logic (Same as chats.jsx)
    useEffect(() => {
        if (!viewingStatus) return;

        const currentItem = viewingStatus.items[currentItemIndex];
        const totalDuration = currentItem.type === 'video' ? 15000 : STORY_DURATION;

        if (!isPaused) {
            startTimeRef.current = Date.now();
            animationRef.current = Animated.timing(progress, {
                toValue: 1,
                duration: remainingTimeRef.current,
                useNativeDriver: false,
            });

            animationRef.current.start(({ finished }) => {
                if (finished) {
                    setCurrentItemIndex(prev => {
                        if (prev < viewingStatus.items.length - 1) return prev + 1;
                        setViewingStatus(null);
                        return prev;
                    });
                }
            });
        } else {
            if (animationRef.current) {
                animationRef.current.stop();
                const elapsed = Date.now() - startTimeRef.current;
                remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
            }
        }
    }, [isPaused, viewingStatus, currentItemIndex]);

    useEffect(() => {
        if (!viewingStatus) return;
        progress.setValue(0);
        const currentItem = viewingStatus.items[currentItemIndex];
        remainingTimeRef.current = currentItem.type === 'video' ? 15000 : STORY_DURATION;

        if (currentItem.type === 'video') {
            player.replace(currentItem.mediaUrl);
            player.play();
        } else {
            player.pause();
        }
    }, [currentItemIndex, viewingStatus]);

    useEffect(() => {
        if (viewingStatus && user?.$id) {
            const currentItem = viewingStatus.items[currentItemIndex];
            if (currentItem.userId !== user.$id) {
                markStatusSeen(currentItem.$id, user.$id);
            }
        }
    }, [viewingStatus, currentItemIndex]);

    if (loading && !messages.length) {
        return (
            <View className="flex-1 bg-[#111b21] items-center justify-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const otherUserStatus = statuses.find(s => s.userId === otherUser?.$id);

    return (
        <View className="flex-1" style={{ backgroundColor: WALLPAPER_COLORS[wallpaper] || WALLPAPER_COLORS['default'] }}>
            <ChatHeader
                user={otherUser}
                chat={chat}
                members={groupMembers}
                typing={typingUsers}
                chatId={chatId}
                statusGroup={otherUserStatus}
                onAvatarPress={(group) => {
                    setViewingStatus(group);
                    setCurrentItemIndex(0);
                    setIsPaused(false);
                }}
            />

            {/* Pinned Messages Banner */}
            {
                pinnedMessages.length > 0 && (
                    <TouchableOpacity
                        onPress={() => {
                            const latestPin = pinnedMessages[pinnedMessages.length - 1];
                            const index = messages.findIndex(m => m.$id === latestPin.$id);
                            if (index > -1) {
                                flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                            }
                        }}
                        className="bg-[#202c33] px-4 py-2 flex-row items-center border-b border-[#374248]"
                    >
                        <Ionicons name="pin" size={16} color="#3b82f6" style={{ transform: [{ rotate: '45deg' }] }} />
                        <View className="ml-3 flex-1">
                            <Text className="text-[#3b82f6] text-[10px] font-bold uppercase">Pinned Message</Text>
                            <Text className="text-white text-xs" numberOfLines={1}>
                                {pinnedMessages[pinnedMessages.length - 1].content}
                            </Text>
                        </View>
                        {pinnedMessages.length > 1 && (
                            <Text className="text-[#8696a0] text-[10px]">+{pinnedMessages.length - 1} more</Text>
                        )}
                    </TouchableOpacity>
                )
            }

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View className="flex-1">
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={keyExtractor}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        removeClippedSubviews={Platform.OS === 'android'}
                        contentContainerStyle={{
                            paddingTop: 10,
                            paddingBottom: 12,
                        }}

                        onContentSizeChange={() => {
                            if (didInitialScrollRef.current && isAtBottomRef.current) {
                                flatListRef.current?.scrollToEnd({ animated: true });
                            }
                        }}

                        onScroll={(e) => {
                            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                            const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);

                            isAtBottomRef.current = distanceFromBottom < 60;
                        }}
                        scrollEventThrottle={5}
                    />
                    <View className="mb-2">
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            onTyping={handleTyping}
                            editingMessage={editingMessage}
                            onCancelEdit={() => setEditingMessage(null)}
                            chatId={chatId}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>

            <StatusViewer
                visible={!!viewingStatus}
                allStatuses={statuses}
                initialGroupIndex={statuses.findIndex(s => s.userId === viewingStatus?.userId)}
                onGroupChange={(group) => {
                    setViewingStatus(group);
                    setCurrentItemIndex(0);
                    setIsPaused(false);
                    progress.setValue(0);
                }}
                currentItemIndex={currentItemIndex}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
                onClose={() => setViewingStatus(null)}
                onNext={() => {
                    setCurrentItemIndex(prev => {
                        if (!viewingStatus) return prev;
                        if (prev < viewingStatus.items.length - 1) return prev + 1;
                        setViewingStatus(null);
                        return prev;
                    });
                }}
                onPrev={() => setCurrentItemIndex(prev => (prev > 0 ? prev - 1 : prev))}
                onNavigateToViewers={() => { }}
                user={user}
                progress={progress}
                player={player}
                replyText={""}
                setReplyText={() => { }}
                onReply={() => { }}
                onDelete={() => { }}
                onHighlight={() => { }}
                sendingReply={false}
                animationRef={animationRef}
                remainingTimeRef={remainingTimeRef}
                startTimeRef={startTimeRef}
            />
        </View >
    );
};

export default ChatScreen;
