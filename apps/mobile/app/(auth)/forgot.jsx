import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { sendPasswordRecoveryEmail } from '@chatterapp/services/auth.service';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

const ForgotPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleResetRequest = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // In a real app, the URL would be a deep link to the app or a web reset page
            const resetUrl = 'https://chatterapp.app/reset-password';
            await sendPasswordRecoveryEmail(email, resetUrl);
            setSuccess(true);
        } catch (err) {
            console.error('Password recovery error:', err);
            setError(err.message || 'Failed to send recovery email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
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
                                title="Forgot Password"
                                subtitle="Enter your email and we'll send you a link to reset your password"
                            />

                            {success ? (
                                <View className="bg-[#202c33] p-6 rounded-2xl items-center">
                                    <Text className="text-[#00a884] text-xl font-bold mb-2">Email Sent!</Text>
                                    <Text className="text-gray-400 text-center mb-6">
                                        We've sent a password reset link to {email}. Please check your inbox.
                                    </Text>
                                    <AuthButton
                                        title="Back to Login"
                                        onPress={() => router.replace('/(auth)/login')}
                                    />
                                </View>
                            ) : (
                                <View className="space-y-4">
                                    <AuthInput
                                        label="Email Address"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />

                                    {error ? (
                                        <Text className="text-red-500 text-center mb-4">{error}</Text>
                                    ) : null}

                                    <View className="mt-4">
                                        <AuthButton
                                            title="Send Reset Link"
                                            onPress={handleResetRequest}
                                            loading={loading}
                                        />

                                        <AuthButton
                                            title="Back to Login"
                                            variant="secondary"
                                            onPress={() => router.back()}
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

export default ForgotPassword;
