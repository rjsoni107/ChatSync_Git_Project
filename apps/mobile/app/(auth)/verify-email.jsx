import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCurrentUser, logout, sendVerificationOTP, verifyOTP } from '@chatterapp/services/auth.service';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore } from '@chatterapp/store/useAlertStore';
import { TextInput } from 'react-native';
import { updateUserProfile } from '@chatterapp/services/user.service';

const VerifyEmail = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userId: paramUserId, email: paramEmail } = params;
    const setUser = useAuthStore((s) => s.setUser);
    const user = useAuthStore((s) => s.user);
    const showAlert = useAlertStore(s => s.showAlert);

    const displayEmail = user?.email || paramEmail;
    const targetUserId = user?.$id || paramUserId;

    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [otp, setOtp] = useState('');


    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            return;
        }

        setVerifying(true);
        setError('');
        try {
            // Appwrite doesn't allow creating a session if one is already active.
            // Since we log in during signup to check verification status, we must logout now.
            try {
                await logout();
            } catch (e) {
                // Ignore if already logged out
            }

            // Verify using Appwrite Email OTP (token)
            // This will create a NEW session
            await verifyOTP(targetUserId, otp);

            setSuccess(true);

            // Refresh user state
            const updatedUser = await getCurrentUser();
            setUser({ ...updatedUser, emailVerification: true });

            showAlert('Email verified successfully!');

            // Auto redirect after 2 seconds
            setTimeout(() => {
                router.replace('/(tabs)/chats');
            }, 2000);
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.message || 'Verification failed. Please check the code and try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setLoading(true);
        setError('');
        try {
            // Use Email OTP Token instead of verification link
            await sendVerificationOTP(targetUserId, displayEmail);
            showAlert('Verification code sent! Please check your email.');
            setCooldown(600); // 10 minutes
        } catch (err) {
            console.error('Resend error:', err);
            setError(err.message || 'Failed to send verification code.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = async () => {
        try {
            await logout();
            setUser(null);
            router.replace('/(auth)/login');
        } catch (err) {
            console.error('Logout error:', err);
            router.replace('/(auth)/login');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View className="px-6 flex-1 justify-center pb-10">
                    <AuthHeader
                        title="Email Verification"
                        subtitle={success ? "Your email has been verified!" : "Please verify your email address to continue"}
                    />

                    <View className="bg-[#202c33] p-8 rounded-3xl items-center shadow-lg">
                        {success ? (
                            <>
                                <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-6">
                                    <Ionicons name="checkmark-circle" size={60} color="#22c55e" />
                                </View>
                                <Text className="text-white text-center text-lg mb-6 font-semibold">
                                    Email Verified!
                                </Text>
                                <Text className="text-gray-400 text-center mb-6">
                                    Redirecting you to Chats...
                                </Text>
                            </>
                        ) : (
                            <>
                                <View className="w-20 h-20 bg-blue-500/20 rounded-full items-center justify-center mb-6">
                                    <Ionicons name="shield-checkmark" size={40} color="#3b82f6" />
                                </View>
                                <Text className="text-white text-center text-xl font-bold mb-2">
                                    Enter confirmation code
                                </Text>
                                <Text className="text-gray-400 text-center mb-8 px-4">
                                    To confirm your account, enter the 6-digit code we sent to <Text className="text-blue-400 font-bold">{displayEmail}</Text>
                                </Text>

                                <View className="w-full mb-6">
                                    <TextInput
                                        className="bg-[#2a3942] text-white text-center text-2xl font-bold tracking-[10px] p-4 rounded-xl border border-gray-700"
                                        placeholder="000000"
                                        placeholderTextColor="#8696a0"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        value={otp}
                                        onChangeText={setOtp}
                                        editable={!verifying}
                                    />
                                </View>

                                {error ? (
                                    <Text className="text-red-500 text-center mb-6 px-4">{error}</Text>
                                ) : null}

                                <AuthButton
                                    title="Continue"
                                    onPress={handleVerify}
                                    loading={verifying}
                                    disabled={otp.length !== 6 || verifying}
                                />

                                <View className="mt-6 w-full gap-4">
                                    <AuthButton
                                        title={cooldown > 0 ? `I didn't get the code (${Math.floor(cooldown / 60)}:${(cooldown % 60).toString().padStart(2, '0')})` : "I didn't get the code"}
                                        variant="secondary"
                                        onPress={handleResend}
                                        loading={loading}
                                        disabled={cooldown > 0 || verifying}
                                    />

                                    <AuthButton
                                        title="I already have an account"
                                        variant="ghost"
                                        onPress={handleBackToLogin}
                                        disabled={verifying}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default VerifyEmail;
