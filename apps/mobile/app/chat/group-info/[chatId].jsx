import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getChat, getChatMembers, updateMemberRole, removeMember, updateGroupMetadata } from '@chatterapp/services/chat.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const GroupInfo = () => {
    const { chatId } = useLocalSearchParams();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const showAlert = useAlertStore(s => s.showAlert);

    const [chat, setChat] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const fetchData = useCallback(async () => {
        if (!chatId) return;
        try {
            setLoading(true);
            const [chatDoc, memberDocs] = await Promise.all([
                getChat(chatId),
                getChatMembers(chatId)
            ]);
            setChat(chatDoc);
            setMembers(memberDocs);

            const currentUserMember = memberDocs.find(m => m.userId === user?.$id);
            setIsAdmin(currentUserMember?.role === 'admin');
        } catch (error) {
            console.error('Error fetching group info:', error);
            showAlert('Error', 'Failed to load group details');
        } finally {
            setLoading(false);
        }
    }, [chatId, user?.$id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePromoteAdmin = async (membershipId) => {
        try {
            await updateMemberRole(membershipId, 'admin');
            fetchData();
        } catch (error) {
            showAlert('Error', 'Failed to promote member');
        }
    };

    const handleRemoveMember = (membershipId, memberName) => {
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${memberName} from the group?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeMember(membershipId);
                            fetchData();
                        } catch (error) {
                            showAlert('Error', 'Failed to remove member');
                        }
                    }
                }
            ]
        );
    };

    const handleLeaveGroup = () => {
        const myMembership = members.find(m => m.userId === user?.$id);
        if (!myMembership) return;

        Alert.alert(
            'Leave Group',
            'Are you sure you want to leave this group?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeMember(myMembership.$id);
                            router.replace('/(tabs)/chats');
                        } catch (error) {
                            showAlert('Error', 'Failed to leave group');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-[#111b21] items-center justify-center">
                <ActivityIndicator color="#60a5fa" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-[#202c33]">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#60a5fa" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">Group Info</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View className="items-center py-8 bg-[#202c33]/30">
                    <View className="w-32 h-32 rounded-full bg-gray-600 overflow-hidden mb-4 border-4 border-[#202c33]">
                        {chat?.avatar ? (
                            <Image source={{ uri: chat.avatar }} className="w-full h-full" />
                        ) : (
                            <View className="w-full h-full items-center justify-center">
                                <Text className="text-white text-4xl font-bold">{chat?.name?.[0]}</Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-white text-2xl font-bold">{chat?.name}</Text>
                    <Text className="text-[#8696a0] mt-1">Group · {members.length} members</Text>
                </View>

                {/* Description */}
                {chat?.description && (
                    <View className="p-4 border-b border-[#202c33]">
                        <Text className="text-[#8696a0] text-xs font-bold uppercase mb-2">Description</Text>
                        <Text className="text-white text-base">{chat.description}</Text>
                    </View>
                )}

                {/* Members List */}
                <View className="p-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-[#8696a0] text-xs font-bold uppercase">{members.length} Members</Text>
                        {isAdmin && (
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: '/chat/group/add-members',
                                    params: { chatId }
                                })}
                                className="flex-row items-center"
                            >
                                <Ionicons name="person-add-outline" size={16} color="#60a5fa" />
                                <Text className="text-primary ml-1 text-sm font-bold">Add</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {members.map((item) => (
                        <View key={item.$id} className="flex-row items-center py-3">
                            <View className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                {item.user?.profile_pic ? (
                                    <Image source={{ uri: item.user.profile_pic }} className="w-full h-full" />
                                ) : (
                                    <View className="w-full h-full items-center justify-center">
                                        <Text className="text-white font-bold">{item.user?.name?.[0]}</Text>
                                    </View>
                                )}
                            </View>
                            <View className="flex-1 ml-3">
                                <Text className="text-white font-bold">{item.user?.name} {item.userId === user?.$id && '(You)'}</Text>
                                <Text className="text-[#8696a0] text-xs">@{item.user?.username}</Text>
                            </View>
                            {item.role === 'admin' && (
                                <View className="bg-primary/20 px-2 py-0.5 rounded mr-2">
                                    <Text className="text-primary text-[10px] font-bold">Admin</Text>
                                </View>
                            )}

                            {isAdmin && item.userId !== user?.$id && (
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert.alert(
                                            'Member Options',
                                            `Manage ${item.user?.name}`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                item.role !== 'admin' ? { text: 'Make Admin', onPress: () => handlePromoteAdmin(item.$id) } : null,
                                                { text: 'Remove from Group', style: 'destructive', onPress: () => handleRemoveMember(item.$id, item.user?.name) }
                                            ].filter(Boolean)
                                        );
                                    }}
                                    className="p-1"
                                >
                                    <Ionicons name="ellipsis-horizontal" size={20} color="#8696a0" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

                {/* Danger Zone */}
                <View className="p-4 mt-4 border-t border-[#202c33]">
                    <TouchableOpacity
                        onPress={handleLeaveGroup}
                        className="flex-row items-center p-4 bg-red-900/20 rounded-xl"
                    >
                        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                        <Text className="text-red-500 font-bold ml-3 text-base">Leave Group</Text>
                    </TouchableOpacity>
                </View>

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default GroupInfo;
