import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { getUserProfile } from '@chatterapp/services/user.service';
import { logout } from '@chatterapp/services/auth.service';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SettingsItem from '../../components/settings/SettingsItem';
import Skeleton from '../../components/ui/Skeleton';

import { useAlertStore } from '@chatterapp/store/useAlertStore';

const Profile = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const clearUser = useAuthStore((s) => s.clearUser);
    const showAlert = useAlertStore(s => s.showAlert);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.$id) return;
            try {
                const data = await getUserProfile(user.$id);
                setProfile(data);
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.$id]);

    const handleLogout = () => {
        showAlert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            clearUser();
                            router.replace('/(auth)/login');
                        } catch (err) {
                            showAlert('Error', 'Logout failed. Please try again.');
                        }
                    }
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="px-4 py-3 flex-row items-center">
                <Text className="text-white text-2xl font-bold flex-1">Profile</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* User Info Header */}
                <View className="items-center py-8">
                    <View className="relative">
                        <View className="w-32 h-32 rounded-full bg-[#202c33] items-center justify-center overflow-hidden border-4 border-[#111b21] shadow-xl">
                            {profile?.profile_pic ? (
                                <Image source={{ uri: profile.profile_pic }} className="w-full h-full" />
                            ) : (
                                <Text className="text-white text-4xl font-bold">
                                    {user?.name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            className="absolute bottom-1 right-1 w-10 h-10 bg-primary rounded-full items-center justify-center border-4 border-background"
                            onPress={() => {/* Avatar picker logic */ }}
                        >
                            <Ionicons name="camera" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <Skeleton width={180} height={28} borderRadius={14} className="mt-4" />
                    ) : (
                        <Text className="text-white text-2xl font-bold mt-4">
                            {user?.name || 'Unknown User'}
                        </Text>
                    )}
                    {loading ? (
                        <Skeleton width={120} height={18} borderRadius={9} className="mt-2" />
                    ) : (
                        <Text className="text-[#8696a0] text-base mt-1">
                            @{profile?.username || 'username'}
                        </Text>
                    )}
                </View>

                {/* Account Section */}
                <View className="mt-2">
                    <Text className="text-secondary px-4 py-2 font-bold uppercase text-xs tracking-widest">
                        Account
                    </Text>
                    <View className="bg-[#111b21]">
                        <SettingsItem
                            icon="person-outline"
                            title="Edit Profile"
                            subtitle="Name, username, about"
                        />
                        <SettingsItem
                            icon="mail-outline"
                            title="Email"
                            subtitle={user?.email}
                            showChevron={false}
                        />
                        <SettingsItem
                            icon="shield-checkmark-outline"
                            title="Security"
                            subtitle="Two-step verification, change password"
                        />
                    </View>
                </View>

                {/* App Settings Section */}
                <View className="mt-4">
                    <Text className="text-secondary px-4 py-2 font-bold uppercase text-xs tracking-widest">
                        App Settings
                    </Text>
                    <View className="bg-[#111b21]">
                        <SettingsItem
                            icon="notifications-outline"
                            title="Notifications"
                            subtitle="Message, group & call tones"
                        />
                        <SettingsItem
                            icon="color-palette-outline"
                            title="Appearance"
                            subtitle="Theme, wallpaper"
                        />
                        <SettingsItem
                            icon="help-circle-outline"
                            title="Help Center"
                            subtitle="FAQ, contact us, privacy policy"
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <View className="mt-8 mb-10">
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="flex-row items-center px-4 py-4 bg-[#202c33]/30"
                    >
                        <View className="w-10 h-10 items-center justify-center">
                            <Ionicons name="log-out-outline" size={24} color="#ff4b4b" />
                        </View>
                        <Text className="text-[#ff4b4b] text-base font-bold ml-4">Log Out</Text>
                    </TouchableOpacity>

                    <View className="items-center mt-6">
                        <Text className="text-gray-600 text-xs">ChatterApp v1.0.0</Text>
                        <Text className="text-gray-600 text-[10px] mt-1">from Google DeepMind</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
