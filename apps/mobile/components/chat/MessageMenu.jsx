import { View, Text, TouchableOpacity, Animated, Modal, Pressable } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import ReactionBar from './ReactionBar';

const MessageMenu = ({ isVisible, onClose, onAction, onSelectEmoji, onShowMore, isMe, timestamp, message }) => {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const isPinned = message?.isPinned;

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            slideAnim.setValue(300);
            opacityAnim.setValue(0);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    const menuItems = [
        { id: 'reply', label: 'Reply', icon: 'return-up-back-outline' },
        { id: 'edit', label: 'Edit', icon: 'pencil-outline', show: isMe },
        { id: 'sticker', label: 'Add sticker', icon: 'happy-outline' },
        { id: 'forward', label: 'Forward', icon: 'paper-plane-outline' },
        { id: isPinned ? 'unpin' : 'pin', label: isPinned ? 'Unpin' : 'Pin', icon: isPinned ? 'pin' : 'pin-outline' },
        { id: 'delete_for_me', label: 'Delete for you', icon: 'trash-outline' },
        { id: 'unsend', label: 'Unsend', icon: 'reload-outline', color: '#ff4444', show: isMe },
    ];

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable
                onPress={onClose}
                className="flex-1 bg-black/40 justify-center items-center px-6"
            >
                <Animated.View
                    style={{
                        opacity: opacityAnim,
                        transform: [{ translateY: slideAnim }],
                        width: '75%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start'
                    }}
                    className="relative"
                >
                    {/* Reaction Bar placed above the menu */}
                    <View style={{ marginBottom: 10 }}>
                        <ReactionBar
                            isVisible={true}
                            onSelectEmoji={(emoji) => {
                                onSelectEmoji(emoji);
                                onClose();
                            }}
                            onShowMore={onShowMore}
                            isMe={isMe}
                            style={{ position: 'relative', top: 0, left: 0, right: 0 }}
                        />
                    </View>

                    <View className="bg-[#263238] rounded-3xl overflow-hidden shadow-2xl">
                        {/* Timestamp Header */}
                        <View className="px-5 py-3 border-b border-[#374248]">
                            <Text className="text-[#8696a0] text-sm text-center">
                                Today {timestamp}
                            </Text>
                        </View>

                        {/* Menu Items */}
                        <View className="py-2">
                            {menuItems.filter(i => i.show !== false).map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => {
                                        onAction(item.id);
                                        onClose();
                                    }}
                                    className="flex-row items-center px-5 py-3.5 active:bg-[#374248]"
                                >
                                    <Ionicons
                                        name={item.icon}
                                        size={22}
                                        color={item.color || '#fff'}
                                    />
                                    <Text
                                        style={{ color: item.color || '#fff' }}
                                        className="ml-4 text-base font-medium"
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

export default MessageMenu;
