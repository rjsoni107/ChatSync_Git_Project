import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyEmail, sendVerificationEmail, getCurrentUser } from '@chatsync/services/auth.service';
import { useAuthStore } from '@chatsync/store/useAuthStore';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const VerifyEmail = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userId, secret } = params;
    const setUser = useAuthStore((s) => s.setUser);
    const user = useAuthStore((s) => s.user);

    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (userId && secret) {
            handleVerify();
        }
    }, [userId, secret]);

    const handleVerify = async () => {
        setVerifying(true);
        setError('');
        try {
            await verifyEmail(userId, secret);
            setSuccess(true);
            // Update local user state
            const updatedUser = await getCurrentUser();
            setUser(updatedUser);

            // Auto redirect after 3 seconds
            setTimeout(() => {
                router.replace('/(tabs)/chats');
            }, 3000);
        } catch (err) {
            console.error('Verification error:', err);
            setError(err.message || 'Verification failed. The link might be expired.');
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        setError('');
        try {
            // In a real app, this URL would be a deep link to the app
            const verificationUrl = 'https://chatsync.app/verify-email';
            await sendVerificationEmail(verificationUrl);
            alert('Verification email sent! Please check your inbox.');
        } catch (err) {
            console.error('Resend error:', err);
            setError(err.message || 'Failed to resend verification email.');
        } finally {
            setLoading(false);
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
                                <View className="w-20 h-20 bg-[#00a884]/20 rounded-full items-center justify-center mb-6">
                                    <Ionicons name="checkmark-circle" size={60} color="#00a884" />
                                </View>
                                <Text className="text-white text-center text-lg mb-6">
                                    Success! Your email is now verified. You'll be redirected in a moment.
                                </Text>
                                <AuthButton
                                    title="Go to Home"
                                    onPress={() => router.replace('/(tabs)/chats')}
                                />
                            </>
                        ) : verifying ? (
                            <>
                                <Text className="text-white text-center text-lg mb-6">
                                    Verifying your email...
                                </Text>
                                <AuthButton title="Verifying..." loading={true} disabled={true} />
                            </>
                        ) : (
                            <>
                                <View className="w-20 h-20 bg-blue-500/20 rounded-full items-center justify-center mb-6">
                                    <Ionicons name="mail" size={40} color="#3b82f6" />
                                </View>
                                <Text className="text-white text-center text-lg mb-2">
                                    Check your inbox
                                </Text>
                                <Text className="text-gray-400 text-center mb-8">
                                    We've sent a verification link to {user?.email || 'your email'}.
                                </Text>

                                {error ? (
                                    <Text className="text-red-500 text-center mb-4">{error}</Text>
                                ) : null}

                                <AuthButton
                                    title="Resend Verification Email"
                                    onPress={handleResend}
                                    loading={loading}
                                />

                                <AuthButton
                                    title="Back to Login"
                                    variant="secondary"
                                    onPress={() => router.replace('/(auth)/login')}
                                />
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default VerifyEmail;
