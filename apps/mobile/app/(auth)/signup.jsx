import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { signup, login, sendVerificationEmail } from '@chatterapp/services/auth.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { checkUsernameAvailability, getUsernameSuggestions, createUserProfile } from '@chatterapp/services/user.service';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import PasswordRequirements from '../../components/auth/PasswordRequirements';
import { Ionicons } from '@expo/vector-icons';
import { useDebounce } from 'use-debounce';

const Signup = () => {
    const router = useRouter();
    const setUser = useAuthStore((s) => s.setUser);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false
    const [suggestions, setSuggestions] = useState([]);

    const [debouncedUsername] = useDebounce(username, 500);

    React.useEffect(() => {
        const check = async () => {
            if (debouncedUsername.length < 3) {
                setUsernameAvailable(null);
                setSuggestions([]);
                return;
            }
            setUsernameLoading(true);
            const available = await checkUsernameAvailability(debouncedUsername);
            setUsernameAvailable(available);
            if (!available) {
                const suggs = await getUsernameSuggestions(debouncedUsername);
                setSuggestions(suggs);
            } else {
                setSuggestions([]);
            }
            setUsernameLoading(false);
        };
        check();
    }, [debouncedUsername]);

    const handleSignup = async () => {
        if (!name || !email || !username || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (usernameAvailable === false) {
            setError('Please choose a different username');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasNumber || !hasSpecialChar) {
            setError('Password must include at least one number and one special character');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await signup(email, password, name);
            const session = await login(email, password);
            if (session) {
                const { getCurrentUser } = await import('@chatterapp/services/auth.service');
                const user = await getCurrentUser();

                // ℹ️ Create User Profile with custom username
                await createUserProfile(user, username);

                // 📧 Send Verification Email
                try {
                    const verificationUrl = 'https://chatterapp.app/verify-email';
                    await sendVerificationEmail(verificationUrl);
                } catch (verifyErr) {
                    console.error('Verification email failed:', verifyErr);
                    // If it's the URI error, we still proceed but show a warning
                    if (verifyErr.message?.includes('Invalid URI')) {
                        console.warn('URI not registered in Appwrite Console');
                    }
                }

                setUser(user);
                // Redirect to verify email screen instead of chats
                router.replace('/(auth)/verify-email');
            }
        } catch (err) {
            console.error('Signup error:', err);
            if (err.message?.includes('Invalid URI')) {
                setError('Appwrite Configuration Error: Please register "chatterapp.app" as a Web platform in your Appwrite Console.');
            } else {
                setError(err.message || 'Registration failed. Please try again.');
            }
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

                            <View>
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

                                <View>
                                    <AuthInput
                                        label="Username"
                                        placeholder="Pick a unique username"
                                        value={username}
                                        onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                                        autoCapitalize="none"
                                        error={usernameAvailable === false ? `The username ${username} is not available.` : ''}
                                    />
                                    {usernameLoading && (
                                        <View className="absolute right-4 top-[48px]">
                                            <ActivityIndicator size="small" color="#2ecc71" />
                                        </View>
                                    )}
                                    {usernameAvailable === true && (
                                        <View className="absolute right-4 top-[48px]">
                                            <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
                                        </View>
                                    )}
                                    {usernameAvailable === false && suggestions.length > 0 && (
                                        <View className="mb-4 bg-[#1c272e] rounded-xl overflow-hidden border border-[#2c373e]">
                                            {suggestions.map((s, i) => (
                                                <TouchableOpacity
                                                    key={i}
                                                    onPress={() => setUsername(s)}
                                                    className={`py-3 px-4 ${i < suggestions.length - 1 ? 'border-b border-[#2c373e]' : ''}`}
                                                >
                                                    <Text className="text-secondary text-base font-bold">{s}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                <AuthInput
                                    label="Password"
                                    placeholder="Enter strong password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />

                                <PasswordRequirements password={password} />

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
                                <Text className="text-gray-400 text-base">Already have an account? </Text>
                                <TouchableWithoutFeedback onPress={() => router.push('/(auth)/login')}>
                                    <Text className="text-secondary font-bold text-base">Log In</Text>
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
