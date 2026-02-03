import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Modal, Animated, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useImagePreviewStore } from '@chatsync/store/useImagePreviewStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImagePreviewModal = () => {
    const { isVisible, imageUrl, hideImage } = useImagePreviewStore();
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            opacityAnim.setValue(0);
            scaleAnim.setValue(0.9);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={hideImage}
        >
            <View className="flex-1 bg-black">
                <SafeAreaView className="flex-1">
                    {/* Header with Close Button */}
                    <View className="flex-row justify-end px-4 py-2 z-50">
                        <TouchableOpacity
                            onPress={hideImage}
                            className="bg-black/40 w-10 h-10 rounded-full items-center justify-center border border-white/10"
                        >
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Image Container */}
                    <Pressable
                        onPress={hideImage}
                        className="flex-1 justify-center items-center"
                    >
                        <Animated.View
                            style={{
                                opacity: opacityAnim,
                                transform: [{ scale: scaleAnim }],
                                width: SCREEN_WIDTH,
                                height: SCREEN_HEIGHT - 150 // Adjust for header/padding
                            }}
                        >
                            <Image
                                source={imageUrl}
                                className="w-full h-full"
                                contentFit="contain"
                                transition={300}
                                cachePolicy="memory-disk"
                            />
                        </Animated.View>
                    </Pressable>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default ImagePreviewModal;
