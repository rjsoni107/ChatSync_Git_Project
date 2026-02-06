import { View, Text, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useChatStore } from '@chatterapp/store/useChatStore';
import { getMessagesByChat, sendMessage, markMessagesAsSeen, markMessagesAsDelivered, subscribeMessages } from '@chatterapp/services/message.service';
import { getOtherUserFromChat } from '@chatterapp/services/chat.service';
import { setTyping, removeTyping } from '@chatterapp/services/typing.service';
import { subscribeTyping, subscribeSingleUserPresence, subscribeChatTyping } from '@chatterapp/services/realtime.service';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageInput from '../../components/chat/MessageInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InteractionManager } from 'react-native';


import { getMessageDateLabel } from '@chatterapp/utils/date';

const ChatScreen = () => {
    const { chatId } = useLocalSearchParams();
    const user = useAuthStore((s) => s.user);
    const messages = useChatStore((s) => s.messages);
    const setMessages = useChatStore((s) => s.setMessages);
    const addMessage = useChatStore((s) => s.addMessage);

    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const isAtBottomRef = useRef(true);
    const didInitialScrollRef = useRef(false);

    const loadChatData = useCallback(async () => {
        if (!chatId || !user?.$id) return;

        try {
            setLoading(true);
            const [msgs, other] = await Promise.all([
                getMessagesByChat(chatId),
                getOtherUserFromChat(chatId, user.$id)
            ]);
            setMessages(msgs);
            setOtherUser(other);

            // Mark messages as seen when opening the chat
            markMessagesAsSeen(chatId, user.$id);
            markMessagesAsDelivered(chatId, user.$id);
        } catch (error) {
            console.error('Error loading chat data:', error);
        } finally {
            setLoading(false);
        }
    }, [chatId, user?.$id, setMessages]);

    useEffect(() => {
        if (!user?.$id || !chatId) return;

        loadChatData();

        // Subscribe to messages
        const unsubscribeMessages = subscribeMessages((res) => {
            if (res.events.includes('databases.*.collections.*.documents.*.create')) {
                const newMessage = res.payload;
                if (newMessage.chatId === chatId) {
                    addMessage(newMessage);
                    // Mark as seen if it's from the other user
                    if (newMessage.senderId !== user.$id) {
                        markMessagesAsSeen(chatId, user.$id);
                        markMessagesAsDelivered(chatId, user.$id);
                    }
                }
            } else if (res.events.includes('databases.*.collections.*.documents.*.update')) {
                // Update message (e.g. isSeen updated or deletedForUsers updated)
                const updatedMessage = res.payload;
                if (updatedMessage.chatId === chatId) {
                    setMessages(prev => prev.map(m => m.$id === updatedMessage.$id ? updatedMessage : m));
                }
            } else if (res.events.includes('databases.*.collections.*.documents.*.delete')) {
                // Delete message (Unsend)
                const deletedMessage = res.payload;
                // res.payload for delete event in Appwrite usually contains the deleted document
                setMessages(prev => prev.filter(m => m.$id !== deletedMessage.$id));
            }
        });

        // Listen for typing from the OTHER user specifically
        let unsubscribeTyping = () => { };
        if (otherUser?.$id) {
            unsubscribeTyping = subscribeChatTyping(chatId, otherUser.$id, (payload) => {
                setIsOtherUserTyping(payload.isTyping);
            });
        }

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [loadChatData, addMessage, chatId, user?.$id, setMessages, otherUser?.$id]);

    // Handle other user's presence updates in real-time
    useEffect(() => {
        if (!otherUser?.$id) return;

        console.log("Subscribing to other user presence:", otherUser.$id);
        const unsubscribe = subscribeSingleUserPresence(otherUser.$id, (payload) => {
            console.log("Other user presence update:", payload.isOnline);
            setOtherUser(payload);
        });

        return () => unsubscribe();
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


    const handleSendMessage = async (content, type = 'text', fileId = null) => {
        if ((!content?.trim() && !fileId) || !user?.$id) return;

        try {
            await sendMessage({
                chatId,
                senderId: user.$id,
                content: content?.trim() || '',
                type,
                fileId
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
                />
            </View>
        );
    }, [user?.$id, messages]);

    const keyExtractor = useCallback((item) => item?.$id || Math.random().toString(), []);

    if (loading && !messages.length) {
        return (
            <View className="flex-1 bg-[#111b21] items-center justify-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#0b141a]">
            <ChatHeader user={otherUser} typing={isOtherUserTyping} chatId={chatId} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
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

                    <MessageInput
                        onSendMessage={handleSendMessage}
                        onTyping={handleTyping}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ChatScreen;
