import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const LockOverlay = ({ onUnlock, authenticating }) => {
    return (
        <View style={StyleSheet.absoluteFill} className="bg-[#111b21] items-center justify-center z-[1000]">
            <View className="items-center">
                <View className="w-24 h-24 bg-[#202c33] rounded-full items-center justify-center mb-6">
                    <Ionicons name="lock-closed" size={48} color="#00a884" />
                </View>

                <Text className="text-white text-2xl font-bold mb-2">ChatterApp is Locked</Text>
                <Text className="text-[#8696a0] text-center px-12 mb-10">
                    Unlock with your biometric identity to access your private messages.
                </Text>

                {authenticating ? (
                    <ActivityIndicator size="large" color="#00a884" />
                ) : (
                    <TouchableOpacity
                        onPress={onUnlock}
                        className="bg-[#00a884] px-8 py-3 rounded-full flex-row items-center"
                    >
                        <Ionicons name="finger-print" size={20} color="black" />
                        <Text className="text-black font-bold ml-2 text-lg">Unlock App</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View className="absolute bottom-10 items-center">
                <Text className="text-white/30 text-[10px] tracking-[5px] uppercase">ChatterApp Secure</Text>
            </View>
        </View>
    );
};

export default LockOverlay;
