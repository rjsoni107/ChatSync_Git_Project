import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Pressable } from 'react-native';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const CustomAlert = () => {
    const { isVisible, title, message, buttons, hideAlert } = useAlertStore();
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={hideAlert}
        >
            <Pressable
                onPress={hideAlert}
                className="flex-1 bg-black/60 justify-center items-center px-8"
            >
                <Animated.View
                    style={{
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim
                    }}
                    className="bg-[#263238] w-full rounded-[28px] overflow-hidden shadow-2xl border border-[#374248]"
                >
                    <View className="p-6 items-center">
                        <Text className="text-white text-xl font-bold text-center mb-2">
                            {title}
                        </Text>
                        <Text className="text-[#8696a0] text-base text-center leading-6">
                            {message}
                        </Text>
                    </View>

                    <View className="flex-row border-t border-[#374248]">
                        {buttons.length === 0 ? (
                            <TouchableOpacity
                                onPress={hideAlert}
                                className="flex-1 py-4 items-center active:bg-[#374248]"
                            >
                                <Text className="text-[#00a884] text-base font-bold">OK</Text>
                            </TouchableOpacity>
                        ) : (
                            buttons.map((btn, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        hideAlert();
                                    }}
                                    className={`flex-1 py-4 items-center active:bg-[#374248] ${idx < buttons.length - 1 ? 'border-r border-[#374248]' : ''
                                        }`}
                                >
                                    <Text
                                        style={{ color: btn.style === 'destructive' ? '#ff4b4b' : '#00a884' }}
                                        className={`text-base ${btn.style === 'cancel' ? 'font-normal' : 'font-bold'}`}
                                    >
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

export default CustomAlert;
