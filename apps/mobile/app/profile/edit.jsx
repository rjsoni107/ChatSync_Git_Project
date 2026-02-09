import { View, Text, ScrollView, TouchableOpacity, Alert, Keyboard, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { getUserProfile, updateUserProfile, checkUsernameAvailability } from '@chatterapp/services/user.service';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const EditProfile = () => {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const showAlert = useAlertStore(s => s.showAlert);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        username: '',
        about: ''
    });
    const [initialUsername, setInitialUsername] = useState('');
    const [errors, setErrors] = useState({});
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.$id) return;
            try {
                const data = await getUserProfile(user.$id);
                setProfile({
                    name: data.name || '',
                    username: data.username || '',
                    about: data.about || ''
                });
                setInitialUsername(data.username || '');
            } catch (err) {
                console.error('Error fetching profile:', err);
                showAlert('Error', 'Failed to load profile details');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.$id]);

    useEffect(() => {
        const check = async () => {
            const username = profile.username.trim();
            if (!username || username === initialUsername) {
                setErrors(prev => {
                    const next = { ...prev };
                    delete next.username;
                    return next;
                });
                setIsUsernameAvailable(true);
                return;
            }

            if (username.length < 3) {
                setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
                setIsUsernameAvailable(false);
                return;
            }

            setCheckingUsername(true);
            try {
                const available = await checkUsernameAvailability(username);
                if (available) {
                    setErrors(prev => {
                        const next = { ...prev };
                        delete next.username;
                        return next;
                    });
                    setIsUsernameAvailable(true);
                } else {
                    setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
                    setIsUsernameAvailable(false);
                }
            } catch (err) {
                console.error('Availability check failed:', err);
            } finally {
                setCheckingUsername(false);
            }
        };

        const timeoutId = setTimeout(check, 500);
        return () => clearTimeout(timeoutId);
    }, [profile.username, initialUsername]);

    const handleSave = async () => {
        if (saving) return;

        // Basic validation
        const newErrors = {};
        if (!profile.name.trim()) newErrors.name = 'Name is required';
        if (!profile.username.trim()) newErrors.username = 'Username is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        setErrors({});

        try {
            Keyboard.dismiss();

            if (!isUsernameAvailable) {
                setErrors(prev => ({ ...prev, username: 'Please choose a valid username' }));
                return;
            }

            await updateUserProfile(user.$id, {
                name: profile.name.trim(),
                username: profile.username.trim(),
                about: profile.about.trim()
            });

            showAlert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (err) {
            console.error('Error updating profile:', err);
            showAlert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0b141a]">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between bg-[#111b21]">
                <TouchableOpacity
                    onPress={() => {
                        Keyboard.dismiss();
                        router.back();
                    }}
                    className="w-10 h-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
                >
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Edit Profile</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`px-5 py-2 rounded-full ${saving ? 'bg-[#2563eb]/50' : 'bg-[#2563eb]'}`}
                >
                    <Text className="text-white font-bold">Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 px-6 bg-[#0b141a]"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
            >
                <View className="mb-8">
                    <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">
                        Public Information
                    </Text>

                    <AuthInput
                        label="Display Name"
                        value={profile.name}
                        onChangeText={(t) => setProfile(prev => ({ ...prev, name: t }))}
                        placeholder="Your full name"
                        error={errors.name}
                        containerClassName="h-14 bg-white/5 border-white/5"
                    />

                    <View className="relative">
                        <AuthInput
                            label="Username"
                            value={profile.username}
                            onChangeText={(t) => setProfile(prev => ({ ...prev, username: t.toLowerCase().replace(/[^a-z0-9_.]/g, '') }))}
                            placeholder="unique_username"
                            error={errors.username}
                            autoCapitalize="none"
                            containerClassName="h-14 bg-white/5 border-white/5 pr-10"
                        />
                        {profile.username && profile.username !== initialUsername && (
                            <View className="absolute right-4 top-[42px]">
                                {checkingUsername ? (
                                    <ActivityIndicator size="small" color="#3b82f6" />
                                ) : isUsernameAvailable ? (
                                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                                ) : (
                                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                                )}
                            </View>
                        )}
                    </View>

                    <AuthInput
                        label="About"
                        value={profile.about}
                        onChangeText={(t) => setProfile(prev => ({ ...prev, about: t }))}
                        placeholder="Write a short bio..."
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        containerClassName="h-14 bg-white/5 border-white/5"
                    />
                </View>

                <View className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                        <Text className="text-[#3b82f6] text-sm font-bold ml-2">Privacy Note</Text>
                    </View>
                    <Text className="text-white/60 text-sm leading-5">
                        Your display name and bio are visible to anyone you chat with. Make sure you're comfortable sharing this information.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditProfile;
