import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { updatePassword } from '@chatterapp/services/auth.service';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore } from '@chatterapp/store/useAlertStore';
import PasswordRequirements from '../../components/auth/PasswordRequirements';

const ChangePassword = () => {
    const router = useRouter();
    const showAlert = useAlertStore(s => s.showAlert);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword === oldPassword) {
            setError('New password cannot be the same as old password');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await updatePassword(newPassword, oldPassword);
            showAlert('Success', 'Password updated successfully!');
            router.back();
        } catch (err) {
            console.error('Password update error:', err);
            setError(err.message || 'Failed to update password. Please check your old password.');
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
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                        <View className="px-6 flex-1 justify-center pb-32">
                            <View className="flex-row items-center mb-6">
                                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                                    <Ionicons name="arrow-back" size={24} color="#60a5fa" />
                                </TouchableOpacity>
                                <Text className="text-white text-xl font-bold ml-2">Change Password</Text>
                            </View>

                            <AuthHeader
                                title="Security"
                                subtitle="Update your account password to keep it secure"
                            />

                            <View className="mt-4">
                                <AuthInput
                                    label="Current Password"
                                    placeholder="Enter current password"
                                    value={oldPassword}
                                    onChangeText={setOldPassword}
                                    secureTextEntry
                                />

                                <AuthInput
                                    label="New Password"
                                    placeholder="Enter new strong password"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />

                                <PasswordRequirements password={newPassword} />

                                <AuthInput
                                    label="Confirm New Password"
                                    placeholder="Re-enter new password"
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
                                        onPress={handleChangePassword}
                                        loading={loading}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChangePassword;
