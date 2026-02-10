import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { resetPassword } from '@chatterapp/services/auth.service';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResetPassword = () => {
    const router = useRouter();
    const { userId, secret } = useLocalSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!userId || !secret) {
            setError('Invalid or expired reset link. Please request a new one.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await resetPassword(userId, secret, password);
            setSuccess(true);
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="px-6 flex-1 justify-center pb-10">
                            <AuthHeader
                                title="Set New Password"
                                subtitle="Choose a strong password to protect your account"
                                logo={require('../../assets/chatterApp.png')}
                            />

                            {success ? (
                                <View className="bg-surface p-6 rounded-2xl items-center">
                                    <View className="w-16 h-16 bg-secondary/10 rounded-full items-center justify-center mb-4">
                                        <Text className="text-secondary text-4xl">✓</Text>
                                    </View>
                                    <Text className="text-white text-xl font-bold mb-2">Password Updated!</Text>
                                    <Text className="text-gray-400 text-center mb-6">
                                        Your password has been reset successfully. You can now log in with your new password.
                                    </Text>
                                    <AuthButton
                                        title="Go to Login"
                                        onPress={() => router.replace('/(auth)/login')}
                                    />
                                </View>
                            ) : (
                                <View className="space-y-4">
                                    <AuthInput
                                        label="New Password"
                                        placeholder="Min. 8 characters"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />

                                    <AuthInput
                                        label="Confirm New Password"
                                        placeholder="Repeat your password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />

                                    {error ? (
                                        <Text className="text-red-500 text-center mb-4">{error}</Text>
                                    ) : null}

                                    <View className="mt-4">
                                        <AuthButton
                                            title="Update Password"
                                            onPress={handleResetPassword}
                                            loading={loading}
                                        />

                                        <AuthButton
                                            title="Cancel"
                                            variant="secondary"
                                            onPress={() => router.replace('/(auth)/login')}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ResetPassword;
