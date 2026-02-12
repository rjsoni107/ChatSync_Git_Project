import { View, Text, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    checkBiometricsAvailability,
    authenticateWithBiometrics,
    setAppLockEnabled,
    getAppLockEnabled
} from '@chatterapp/services/security.service';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

export default function SecuritySettings() {
    const router = useRouter();
    const showAlert = useAlertStore(s => s.showAlert);
    const [loading, setLoading] = useState(true);
    const [isLockEnabled, setIsLockEnabled] = useState(false);
    const [biometricsStatus, setBiometricsStatus] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const [enabled, status] = await Promise.all([
                getAppLockEnabled(),
                checkBiometricsAvailability()
            ]);
            setIsLockEnabled(enabled);
            setBiometricsStatus(status);
        } catch (error) {
            console.error("Error loading security settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLock = async (value) => {
        if (value) {
            // Verifying before enabling
            const success = await authenticateWithBiometrics("Verify your identity to enable App Lock");
            if (success) {
                const saved = await setAppLockEnabled(true);
                if (saved) {
                    setIsLockEnabled(true);
                    showAlert("Success", "App Lock enabled successfully.");
                }
            } else {
                showAlert("Authentication Failed", "Could not verify your identity.");
            }
        } else {
            // Disabling
            const saved = await setAppLockEnabled(false);
            if (saved) {
                setIsLockEnabled(false);
                showAlert("App Lock Disabled", "You will no longer be prompted for authentication.");
            }
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-[#111b21] justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="px-4 py-4 flex-row items-center border-b border-[#202c33]">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Privacy & Security</Text>
            </View>

            <View className="p-4">
                <Text className="text-[#8696a0] text-sm font-bold uppercase tracking-wider mb-4">App Lock</Text>

                <View className="bg-[#202c33] rounded-2xl overflow-hidden">
                    <View className="flex-row items-center justify-between p-4 border-b border-[#374248]">
                        <View className="flex-1 mr-4">
                            <Text className="text-white text-lg font-bold">Biometric Authentication</Text>
                            <Text className="text-[#8696a0] text-xs mt-1">
                                When enabled, you'll need to use biometrics to unlock ChatterApp.
                            </Text>
                        </View>
                        <Switch
                            value={isLockEnabled}
                            onValueChange={handleToggleLock}
                            trackColor={{ false: "#374248", true: "#00a884" }}
                            thumbColor={isLockEnabled ? "#fff" : "#8696a0"}
                            disabled={!biometricsStatus?.hasHardware || !biometricsStatus?.isEnrolled}
                        />
                    </View>

                    {!biometricsStatus?.hasHardware && (
                        <View className="p-4 bg-red-500/10">
                            <Text className="text-red-400 text-xs">
                                Your device does not support biometric authentication.
                            </Text>
                        </View>
                    )}

                    {biometricsStatus?.hasHardware && !biometricsStatus?.isEnrolled && (
                        <View className="p-4 bg-yellow-500/10">
                            <Text className="text-yellow-400 text-xs">
                                No biometrics found. Please set up FaceID or Fingerprint in your device settings.
                            </Text>
                        </View>
                    )}
                </View>

                {biometricsStatus?.supportedTypes?.length > 0 && (
                    <Text className="text-[#8696a0] text-[10px] mt-2 ml-2">
                        Supported: {biometricsStatus.supportedTypes.join(', ')}
                    </Text>
                )}

                <Text className="text-[#8696a0] text-sm font-bold uppercase tracking-wider mt-10 mb-4">Account Security</Text>
                <View className="bg-[#202c33] rounded-2xl overflow-hidden">
                    <TouchableOpacity
                        onPress={() => router.push('/profile/change-password')}
                        className="flex-row items-center justify-between p-4 border-b border-[#374248]"
                    >
                        <View className="flex-row items-center flex-1">
                            <Ionicons name="key-outline" size={22} color="#8696a0" />
                            <Text className="text-white text-lg ml-4">Change Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#374248" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/status')} // status tab has the privacy lock icon
                        className="flex-row items-center justify-between p-4"
                    >
                        <View className="flex-row items-center flex-1">
                            <Ionicons name="eye-outline" size={22} color="#8696a0" />
                            <Text className="text-white text-lg ml-4">Status Privacy</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#374248" />
                    </TouchableOpacity>
                </View>

                <View className="mt-12">
                    <Text className="text-[#8696a0] text-xs text-center">
                        ChatterApp ensures your private conversations stay private with end-to-end security.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
