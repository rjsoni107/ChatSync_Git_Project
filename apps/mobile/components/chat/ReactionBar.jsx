import { View, TouchableOpacity, Text, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

const REACTION_EMOJIS = ['🤗', '😘', '😍', '😅', '❤️', '😂'];

const ReactionBar = ({ onSelectEmoji, onShowMore, isVisible, isMe, style }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: isVisible ? 1 : 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7
        }).start();
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <Animated.View
            style={[{
                transform: [{ scale: scaleAnim }],
                position: 'absolute',
                top: -55,
                left: isMe ? undefined : -10,
                right: isMe ? -10 : undefined,
                zIndex: 1000
            }, style]}
        >
            <View className="flex-row bg-[#1c272d] px-2 py-1.5 rounded-full shadow-2xl border border-[#2a3942] items-center">
                {REACTION_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                        key={emoji}
                        onPress={() => onSelectEmoji(emoji)}
                        className="mx-1 active:scale-150"
                        style={{ transform: [{ scale: 1.1 }] }}
                    >
                        <Text className="text-2xl">{emoji}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    onPress={onShowMore}
                    className="ml-1 mr-1 w-8 h-8 rounded-full bg-[#2a3942] items-center justify-center active:bg-[#374248]"
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

export default ReactionBar;
