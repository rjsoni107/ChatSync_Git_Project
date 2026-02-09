import { View, Text, TouchableOpacity, Modal, Animated, Pressable, Dimensions, StyleSheet, Easing } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ActionSheet = ({ isVisible, onClose, title, options }) => {
    const [modalVisible, setModalVisible] = useState(isVisible);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            setModalVisible(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 350,
                    easing: Easing.out(Easing.back(0.5)),
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setModalVisible(false);
            });
        }
    }, [isVisible]);

    if (!modalVisible) return null;

    return (
        <Modal
            transparent
            visible={modalVisible}
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable
                style={{ flex: 1, justifyContent: 'flex-end' }}
                onPress={onClose}
            >
                {/* Backdrop Overlay */}
                <Animated.View
                    style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        opacity: opacityAnim,
                    }}
                />

                {/* Content Area */}
                <Animated.View
                    style={{
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    {/* Inner Pressable with no-op handler prevents closure when clicking the menu itself */}
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <View className="bg-[#1c272c] rounded-t-[32px] overflow-hidden border-t border-white/5 shadow-2xl">
                            <SafeAreaView edges={['bottom']}>
                                {/* Drag Handle */}
                                <View className="items-center py-3">
                                    <View className="w-10 h-1.5 bg-white/10 rounded-full" />
                                </View>

                                {title && (
                                    <View className="px-6 pb-4 border-b border-white/5">
                                        <Text className="text-white/60 text-sm font-medium uppercase tracking-widest text-center">
                                            {title}
                                        </Text>
                                    </View>
                                )}

                                <View className="px-4 py-2">
                                    {options.map((option, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                option.onPress?.();
                                                onClose();
                                            }}
                                            className={`flex-row items-center px-4 py-4 rounded-2xl mb-1 active:bg-white/5 ${option.style === 'destructive' ? 'bg-red-500/10' : ''
                                                }`}
                                        >
                                            <View className={`w-10 h-10 items-center justify-center rounded-full mr-3 ${option.style === 'destructive' ? 'bg-red-500/10' : 'bg-white/5'
                                                }`}>
                                                <Ionicons
                                                    name={option.icon}
                                                    size={22}
                                                    color={option.style === 'destructive' ? '#ef4444' : '#3b82f6'}
                                                />
                                            </View>
                                            <Text className={`text-lg font-semibold flex-1 ${option.style === 'destructive' ? 'text-red-500' : 'text-white'
                                                }`}>
                                                {option.text}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Cancel Button */}
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="mx-4 mb-4 mt-2 py-4 bg-white/5 rounded-2xl items-center"
                                >
                                    <Text className="text-white text-lg font-bold">Cancel</Text>
                                </TouchableOpacity>
                            </SafeAreaView>
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

export default ActionSheet;
