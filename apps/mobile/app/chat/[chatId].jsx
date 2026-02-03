import { View, Text, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@chatsync/store/useAuthStore';
import { useChatStore } from '@chatsync/store/useChatStore';
import { getMessagesByChat, sendMessage, markMessagesAsSeen, subscribeMessages } from '@chatsync/services/message.service';
import { getOtherUserFromChat } from '@chatsync/services/chat.service';
import { setTyping, removeTyping } from '@chatsync/services/typing.service';
import { subscribeTyping, subscribeSingleUserPresence } from '@chatsync/services/realtime.service';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageInput from '../../components/chat/MessageInput';
import { SafeAreaView } from 'react-native-safe-area-context';

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
                    }
                }
            } else if (res.events.includes('databases.*.collections.*.documents.*.update')) {
                // Update message (e.g. isSeen updated)
                const updatedMessage = res.payload;
                if (updatedMessage.chatId === chatId) {
                    setMessages(prev => prev.map(m => m.$id === updatedMessage.$id ? updatedMessage : m));
                }
            }
        });

        // Subscribe to typing indicators
        const unsubscribeTyping = subscribeTyping((event) => {
            const payload = event.payload;
            if (payload.chatId === chatId && payload.userId !== user.$id) {
                setIsOtherUserTyping(payload.isTyping);
            }
        });

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [loadChatData, addMessage, chatId, user?.$id, setMessages]);

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

    const handleSendMessage = async (content) => {
        if (!content.trim() || !user?.$id) return;

        try {
            await sendMessage({
                chatId,
                senderId: user.$id,
                content: content.trim(),
                type: 'text'
            });
            // remove typing indicator once message sent
            handleStopTyping();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        setTyping({
            chatId,
            userId: user.$id,
            name: user.name,
            isTyping: true
        });

        typingTimeoutRef.current = setTimeout(() => {
            handleStopTyping();
        }, 3000);
    };

    const handleStopTyping = () => {
        setTyping({
            chatId,
            userId: user.$id,
            name: user.name,
            isTyping: false
        });
    };

    if (loading && !messages.length) {
        return (
            <View className="flex-1 bg-[#111b21] items-center justify-center">
                <ActivityIndicator size="large" color="#00a884" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#0b141a]">
            <ChatHeader user={otherUser} typing={isOtherUserTyping} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages || []}
                    renderItem={({ item }) => {
                        if (!item) return null;
                        return (
                            <MessageBubble
                                message={item}
                                isMe={item.senderId === user?.$id}
                            />
                        );
                    }}
                    keyExtractor={(item) => item?.$id || Math.random().toString()}
                    contentContainerStyle={{ paddingVertical: 10, flexGrow: 1, justifyContent: 'flex-end' }}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <MessageInput
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                />
            </KeyboardAvoidingView>
        </View>
    );
};

export default ChatScreen;
