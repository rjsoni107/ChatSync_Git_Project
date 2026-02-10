import { View, Text, ScrollValue, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { login } from '@chatterapp/services/auth.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { getUserByUsername } from '@chatterapp/services/user.service';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

const Login = () => {
    const router = useRouter();
    const setUser = useAuthStore((s) => s.setUser);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError('');
        setLoading(true);

        try {
            let loginEmail = email;

            // If it's not an email (no @), look up by username
            if (!email.includes('@')) {
                const profile = await getUserByUsername(email);
                if (!profile) {
                    setError('Username not found');
                    setLoading(false);
                    return;
                }
                loginEmail = profile.email;
            }

            const session = await login(loginEmail, password);
            if (session) {
                // Fetch user data after successful login
                const { getCurrentUser } = await import('@chatterapp/services/auth.service');
                const user = await getCurrentUser();
                setUser(user);
                router.replace('/(tabs)/chats');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                className="flex-1"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="px-6 flex-1 justify-center pb-10">
                            <AuthHeader
                                title="Welcome Back"
                                subtitle="Enter your credentials to access your account"
                                logo={require('../../assets/chatterApp.webp')}
                            />

                            <View>
                                <AuthInput
                                    label="Username or Email"
                                    placeholder="Enter username or email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <AuthInput
                                    label="Password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />

                                {error ? (
                                    <Text className="text-red-500 text-center mb-4">{error}</Text>
                                ) : null}

                                <View className="mt-4">
                                    <AuthButton
                                        title="Login"
                                        onPress={handleLogin}
                                        loading={loading}
                                    />

                                    <AuthButton
                                        title="Forgot Password?"
                                        variant="secondary"
                                        onPress={() => router.push('/(auth)/forgot')}
                                    />
                                </View>
                            </View>

                            <View className="flex-row justify-center mt-2">
                                <Text className="text-gray-400 text-base">Don't have an account? </Text>
                                <TouchableWithoutFeedback onPress={() => router.push('/(auth)/signup')}>
                                    <Text className="text-secondary font-bold text-base">Sign Up</Text>
                                </TouchableWithoutFeedback>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Login;
