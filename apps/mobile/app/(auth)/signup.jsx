import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { signup, login } from '@chatterapp/services/auth.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

const Signup = () => {
    const router = useRouter();
    const setUser = useAuthStore((s) => s.setUser);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
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

        setError('');
        setLoading(true);

        try {
            await signup(email, password, name);
            // After signup, automatically log the user in
            const session = await login(email, password);
            if (session) {
                const { getCurrentUser } = await import('@chatterapp/services/auth.service');
                const user = await getCurrentUser();
                setUser(user);
                router.replace('/(tabs)/chats');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.message || 'Registration failed. Please try again.');
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
                                title="Create Account"
                                subtitle="Join ChatterApp and start messaging with friends"
                                logo={require('../../assets/chatterApp.webp')}
                            />

                            <View className="space-y-4">
                                <AuthInput
                                    label="Full Name"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChangeText={setName}
                                />

                                <AuthInput
                                    label="Email Address"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <AuthInput
                                    label="Password"
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />

                                <AuthInput
                                    label="Confirm Password"
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />

                                {error ? (
                                    <Text className="text-red-500 text-center mb-4">{error}</Text>
                                ) : null}

                                <View className="mt-4">
                                    <AuthButton
                                        title="Sign Up"
                                        onPress={handleSignup}
                                        loading={loading}
                                    />
                                </View>
                            </View>

                            <View className="flex-row justify-center mt-6">
                                <Text className="text-gray-400">Already have an account? </Text>
                                <TouchableWithoutFeedback onPress={() => router.push('/(auth)/login')}>
                                    <Text className="text-secondary font-bold">Log In</Text>
                                </TouchableWithoutFeedback>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Signup;
