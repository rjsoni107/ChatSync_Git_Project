import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createGroupChat } from '@chatterapp/services/chat.service';
import { uploadFile, getMobileFilePreview } from '@chatterapp/services/storage.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const GroupDetails = () => {
    const router = useRouter();
    const { userIds } = useLocalSearchParams();
    const user = useAuthStore((s) => s.user);
    const showAlert = useAlertStore(s => s.showAlert);

    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(false);

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
            setAvatar(result.assets[0]);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || !user?.$id) return;

        setLoading(true);
        try {
            let avatarUrl = '';
            if (avatar) {
                const file = {
                    name: avatar.uri.split('/').pop() || 'group-avatar.jpg',
                    type: 'image/jpeg',
                    size: avatar.fileSize || 0,
                    uri: avatar.uri,
                };
                const uploaded = await uploadFile(file);
                if (uploaded?.$id) {
                    avatarUrl = getMobileFilePreview(uploaded.$id);
                }
            }

            const members = userIds.split(',').map(id => ({ userId: id, role: 'member' }));
            // Add current user as admin
            members.push({ userId: user.$id, role: 'admin' });

            const newChat = await createGroupChat(groupName.trim(), members, groupDesc.trim(), avatarUrl);

            router.replace(`/chat/${newChat.$id}`);
        } catch (error) {
            console.error('Error creating group:', error);
            showAlert('Error', 'Failed to create group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="flex-row items-center px-4 py-3 border-b border-[#202c33]">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#60a5fa" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">New Group</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <View className="items-center mb-8">
                        <TouchableOpacity
                            onPress={handlePickImage}
                            className="w-32 h-32 rounded-full bg-[#202c33] items-center justify-center overflow-hidden border-2 border-dashed border-[#8696a0]"
                        >
                            {avatar ? (
                                <Image source={{ uri: avatar.uri }} className="w-full h-full" />
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="camera" size={32} color="#8696a0" />
                                    <Text className="text-[#8696a0] text-[10px] mt-1 uppercase font-bold">Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="space-y-6">
                        <View>
                            <Text className="text-[#8696a0] text-xs font-bold uppercase mb-2 ml-1">Group Name</Text>
                            <TextInput
                                className="bg-[#202c33] text-white px-4 h-12 rounded-xl text-base"
                                placeholder="Enter group name"
                                placeholderTextColor="#8696a0"
                                value={groupName}
                                onChangeText={setGroupName}
                                maxLength={50}
                            />
                        </View>

                        <View>
                            <Text className="text-[#8696a0] text-xs font-bold uppercase mb-2 ml-1">Description (Optional)</Text>
                            <TextInput
                                className="bg-[#202c33] text-white px-4 py-3 min-h-[100px] rounded-xl text-base"
                                placeholder="What is this group about?"
                                placeholderTextColor="#8696a0"
                                value={groupDesc}
                                onChangeText={setGroupDesc}
                                multiline
                                textAlignVertical="top"
                                maxLength={200}
                            />
                        </View>

                        <Text className="text-[#8696a0] text-[10px] text-center px-6 leading-4">
                            By creating this group, you'll be able to chat with multiple people at once and manage group settings as an admin.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View className="p-4 bg-[#111b21] border-t border-[#202c33]">
                <TouchableOpacity
                    onPress={handleCreateGroup}
                    disabled={loading || !groupName.trim()}
                    className={`h-14 rounded-2xl items-center justify-center ${loading || !groupName.trim() ? 'bg-gray-600' : 'bg-primary'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={20} color="white" className="mr-2" />
                            <Text className="text-white font-bold text-lg">Create Group</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default GroupDetails;
