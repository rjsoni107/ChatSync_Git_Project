import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { getUserProfile, updateUserProfile, deleteUserProfile } from '@chatterapp/services/user.service';
import { uploadFile, deleteFile, getMobileFilePreview } from '@chatterapp/services/storage.service';
import { logout } from '@chatterapp/services/auth.service';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SettingsItem from '../../components/settings/SettingsItem';
import Skeleton from '../../components/ui/Skeleton';
import * as ImagePicker from 'expo-image-picker';
import { useImagePreviewStore } from '@chatterapp/store/useImagePreviewStore';
import ActionSheet from '../../components/ui/ActionSheet';

import { useAlertStore } from '@chatterapp/store/useAlertStore';

const Profile = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const clearUser = useAuthStore((s) => s.clearUser);
    const showAlert = useAlertStore(s => s.showAlert);

    const showImage = useImagePreviewStore(s => s.showImage);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);

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

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [user?.$id])
    );

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
                        } catch (err) {
                            showAlert('Error', 'Logout failed. Please try again.');
                        }
                    }
                },
            ]
        );
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission Denied', 'Gallery access is required');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadProfilePhoto(result.assets[0]);
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission Denied', 'Camera access is required');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadProfilePhoto(result.assets[0]);
        }
    };

    const uploadProfilePhoto = async (asset) => {
        setUploading(true);
        try {
            const file = {
                name: asset.uri.split('/').pop() || 'profile.jpg',
                type: 'image/jpeg',
                size: asset.fileSize || 0,
                uri: asset.uri,
            };

            const uploaded = await uploadFile(file);
            if (uploaded?.$id) {
                const photoUrl = getMobileFilePreview(uploaded.$id);

                // If there was an old photo, we might want to delete it from storage
                // but for now let's just update the profile
                await updateUserProfile(user.$id, {
                    profile_pic: photoUrl
                });

                // Update store so tab bar and other components sync
                useAuthStore.getState().setUser({ ...user, profile_pic: photoUrl });

                setProfile(prev => ({ ...prev, profile_pic: photoUrl }));
                showAlert('Success', 'Profile photo updated');
            }
        } catch (err) {
            console.error('Upload Failed:', err);
            showAlert('Upload Failed', 'Please try again');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAccount = () => {
        showAlert(
            'Delete Account',
            'This will permanently delete your profile, photo, and all data. This action cannot be undone. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUploading(true);

                            // 1. Delete Profile Picture if exists
                            if (profile?.profile_pic) {
                                try {
                                    // Extract fileId from URL: .../files/{fileId}/view?...
                                    const fileIdMatch = profile.profile_pic.match(/\/files\/([^\/]+)\/view/);
                                    if (fileIdMatch && fileIdMatch[1]) {
                                        await deleteFile(fileIdMatch[1]);
                                    }
                                } catch (err) {
                                    console.warn('Failed to delete profile picture file:', err);
                                }
                            }

                            // 2. Delete Database Profile
                            await deleteUserProfile(user.$id);

                            // 3. Logout
                            await logout();

                            // 4. Clear Store
                            clearUser();

                            showAlert('Account Deleted', 'Your profile has been successfully removed.');
                        } catch (err) {
                            console.error('Account deletion failed:', err);
                            showAlert('Error', 'Failed to delete account. Please try again.');
                        } finally {
                            setUploading(false);
                        }
                    }
                },
            ]
        );
    };

    const handleDeletePhoto = async () => {
        showAlert(
            'Delete Photo',
            'Are you sure you want to remove your profile photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUploading(true);
                            await updateUserProfile(user.$id, {
                                profile_pic: ""
                            });
                            // Update store
                            useAuthStore.getState().setUser({ ...user, profile_pic: "" });

                            setProfile(prev => ({ ...prev, profile_pic: "" }));
                            showAlert('Success', 'Profile photo removed');
                        } catch (err) {
                            showAlert('Error', 'Failed to remove photo');
                        } finally {
                            setUploading(false);
                            setShowPhotoOptions(false);
                        }
                    }
                }
            ]
        );
    };

    const handlePhotoPress = () => {
        setShowPhotoOptions(true);
    };

    const photoOptions = [
        {
            text: 'View Photo',
            icon: 'image-outline',
            onPress: () => {
                if (profile?.profile_pic) {
                    showImage(profile.profile_pic);
                }
            },
        },
        {
            text: 'Upload from Gallery',
            icon: 'library-outline',
            onPress: handlePickImage,
        },
        {
            text: 'Take Photo',
            icon: 'camera-outline',
            onPress: handleTakePhoto,
        },
    ];

    if (profile?.profile_pic) {
        photoOptions.push({
            text: 'Remove Photo',
            icon: 'trash-outline',
            style: 'destructive',
            onPress: handleDeletePhoto,
        });
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0b141a]">
            <View className="px-4 py-3 flex-row items-center">
                <Text className="text-white text-2xl font-bold flex-1">Profile</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* User Info Header */}
                <View className="items-center py-6">
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
                            className="absolute bottom-1 right-1 w-10 h-10 bg-primary rounded-full items-center justify-center border-4 border-[#111b21]"
                            onPress={handlePhotoPress}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons name="camera" size={20} color="white" />
                            )}
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
                <View className="">
                    <Text className="text-secondary px-4 py-2 font-bold uppercase text-xs tracking-widest">
                        Account
                    </Text>
                    <View className="bg-[#111b21]">
                        <SettingsItem
                            icon="person-outline"
                            title="Edit Profile"
                            subtitle="Name, username, about"
                            onPress={() => router.push('/profile/edit')}
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
                            onPress={() => router.push('/profile/change-password')}
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
                        onPress={handleDeleteAccount}
                        className="flex-row items-center px-4 py-2 bg-[#202c33]/30"
                    >
                        <View className="w-10 h-10 items-center justify-center">
                            <Ionicons name="trash-outline" size={24} color="#ff4b4b" />
                        </View>
                        <Text className="text-[#ff4b4b] text-base font-bold">Delete Account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="flex-row items-center px-4 py-2 bg-[#202c33]/30"
                    >
                        <View className="w-10 h-10 items-center justify-center">
                            <Ionicons name="log-out-outline" size={24} color="#ff4b4b" />
                        </View>
                        <Text className="text-[#ff4b4b] text-base font-bold">Log Out</Text>
                    </TouchableOpacity>

                    <View className="items-center mt-6">
                        <Text className="text-gray-600 text-xs">ChatterApp v1.0.1</Text>
                        <Text className="text-gray-600 text-[10px] mt-1">from JaRa Tech Solutions Pvt. Ltd.</Text>
                    </View>
                </View>
            </ScrollView>

            <ActionSheet
                isVisible={showPhotoOptions}
                onClose={() => setShowPhotoOptions(false)}
                title="Profile Photo"
                options={photoOptions}
            />
        </SafeAreaView>
    );
};

export default Profile;
