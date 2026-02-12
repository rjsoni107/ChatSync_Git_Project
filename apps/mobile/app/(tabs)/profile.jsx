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
import { getUserHighlights, getRecentStatuses } from '@chatterapp/services/status.service';
import StatusViewer from '../../components/status/StatusViewer';
import StatusAvatar from '../../components/status/StatusAvatar';
import { useVideoPlayer } from 'expo-video';
import { useRef } from 'react';
import { Animated } from 'react-native';

const STORY_DURATION = 5000;

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

    const [highlights, setHighlights] = useState([]);
    const [activeStatus, setActiveStatus] = useState(null);
    const [viewingHighlight, setViewingHighlight] = useState(null);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Animation & Timing Refs for Highlight Viewer
    const progress = useRef(new Animated.Value(0)).current;
    const animationRef = useRef(null);
    const remainingTimeRef = useRef(STORY_DURATION);
    const startTimeRef = useRef(null);
    const player = useVideoPlayer(null);

    const fetchProfile = async () => {
        if (!user?.$id) return;
        try {
            const [profileData, highlightData, allRecentStatuses] = await Promise.all([
                getUserProfile(user.$id),
                getUserHighlights(user.$id),
                getRecentStatuses()
            ]);
            setProfile(profileData);
            setHighlights(highlightData);

            // Find current user's active status group
            const userStatus = allRecentStatuses.find(s => s.userId === user.$id);
            setActiveStatus(userStatus);
        } catch (err) {
            console.error('Error fetching profile/highlights:', err);
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

    // Highlight Viewing Logic
    useEffect(() => {
        if (!viewingHighlight) return;

        const currentItem = viewingHighlight.items[currentItemIndex];
        const totalDuration = currentItem.type === 'video' ? 15000 : STORY_DURATION;

        if (!isPaused) {
            startTimeRef.current = Date.now();
            animationRef.current = Animated.timing(progress, {
                toValue: 1,
                duration: remainingTimeRef.current,
                useNativeDriver: false,
            });

            animationRef.current.start(({ finished }) => {
                if (finished) {
                    nextHighlightItem();
                }
            });
        } else {
            if (animationRef.current) {
                animationRef.current.stop();
                const elapsed = Date.now() - startTimeRef.current;
                remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
            }
        }
    }, [isPaused, viewingHighlight, currentItemIndex]);

    useEffect(() => {
        if (!viewingHighlight) return;
        progress.setValue(0);
        const currentItem = viewingHighlight.items[currentItemIndex];
        remainingTimeRef.current = currentItem.type === 'video' ? 15000 : STORY_DURATION;

        if (currentItem.type === 'video') {
            player.replace(currentItem.mediaUrl);
            player.play();
        } else {
            player.pause();
        }
    }, [currentItemIndex, viewingHighlight]);

    const nextHighlightItem = () => {
        setCurrentItemIndex(prev => {
            if (!viewingHighlight) return prev;
            if (prev < viewingHighlight.items.length - 1) return prev + 1;
            closeHighlightViewer();
            return prev;
        });
    };

    const prevHighlightItem = () => {
        setCurrentItemIndex(prev => (prev > 0 ? prev - 1 : prev));
    };

    const closeHighlightViewer = () => {
        setViewingHighlight(null);
        setCurrentItemIndex(0);
        setIsPaused(false);
        progress.setValue(0);
    };

    const openHighlight = (highlight) => {
        // Transform highlight to match StatusViewer group format
        const statusGroup = {
            userId: user.$id,
            userName: highlight.name,
            userProfilePic: highlight.coverUrl,
            items: highlight.items
        };
        setViewingHighlight(statusGroup);
        setCurrentItemIndex(0);
        setIsPaused(false);
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
                        <TouchableOpacity
                            onPress={activeStatus ? () => openHighlight({ name: 'My Status', items: activeStatus.items, coverUrl: user?.profile_pic }) : handlePhotoPress}
                        >
                            <StatusAvatar
                                imageUrl={profile?.profile_pic}
                                itemsCount={activeStatus?.items?.length || 0}
                                isSeen={false} // On profile, we can show it as unseen if it exists
                                size={120}
                                strokeWidth={4}
                                fallbackText={user?.name || "?"}
                            />
                        </TouchableOpacity>
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

                {/* Highlights Section */}
                {!loading && (
                    <View className="mb-6">
                        <Text className="text-secondary px-4 mb-3 font-bold uppercase text-[10px] tracking-widest">
                            Highlights
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
                            {highlights.length > 0 ? (
                                highlights.map((hl, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        className="items-center mr-4"
                                        onPress={() => openHighlight(hl)}
                                    >
                                        <StatusAvatar
                                            imageUrl={hl.coverUrl}
                                            itemsCount={hl.items.length}
                                            isSeen={true} // Highlights are usually seen style (gray)
                                            size={64}
                                            strokeWidth={2}
                                            fallbackText={hl.name}
                                        />
                                        <Text className="text-white text-[10px] font-medium w-16 text-center mt-1" numberOfLines={1}>
                                            {hl.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="flex-row items-center">
                                    <View className="items-center mr-4 opacity-50">
                                        <View className="w-16 h-16 rounded-full border-2 border-dashed border-[#202c33] items-center justify-center mb-1">
                                            <Ionicons name="add" size={24} color="#8696a0" />
                                        </View>
                                        <Text className="text-[#8696a0] text-[10px]">No Highlights</Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}

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
                        <Text className="text-gray-600 text-xs">ChatterApp v1.0.2</Text>
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
            <StatusViewer
                visible={!!viewingHighlight}
                allStatuses={[viewingHighlight]}
                initialGroupIndex={0}
                onGroupChange={() => { }} // Only one highlight group viewed at a time
                currentItemIndex={currentItemIndex}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
                onClose={closeHighlightViewer}
                onNext={nextHighlightItem}
                onPrev={prevHighlightItem}
                onNavigateToViewers={() => { }} // Highlights viewers not implemented yet
                user={user}
                progress={progress}
                player={player}
                replyText={""}
                setReplyText={() => { }}
                onReply={() => { }}
                onDelete={() => { }} // Should we allow delete from highlights? For now no
                onHighlight={() => { }} // Already a highlight
                sendingReply={false}
                animationRef={animationRef}
                remainingTimeRef={remainingTimeRef}
                startTimeRef={startTimeRef}
            />
        </SafeAreaView>
    );
};

export default Profile;
