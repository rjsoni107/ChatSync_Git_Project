import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, blockUser, unblockUser, isUserBlocked } from '@chatterapp/services/user.service';
import { clearChatMessages } from '@chatterapp/services/message.service';
import { deletePrivateChat, findPrivateChat } from '@chatterapp/services/chat.service';
import { deleteAllRequests, checkExistingRelationship, sendChatRequest, cancelChatRequest, updateRequestStatus } from '@chatterapp/services/request.service';
import { subscribeRequests, subscribeSingleUserPresence } from '@chatterapp/services/realtime.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import Skeleton from '../../components/ui/Skeleton';
import { formatLastSeen } from '@chatterapp/utils/date';
import bgColor from '../../components/ui/bgColor';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const UserProfile = () => {
    const { id, chatId: initialChatId } = useLocalSearchParams();
    const router = useRouter();
    const currentUser = useAuthStore(s => s.user);
    const showAlert = useAlertStore(s => s.showAlert);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [chatId, setChatId] = useState(initialChatId);
    const [relationship, setRelationship] = useState(null);
    const isSelf = currentUser?.$id === id;

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [profileData, blockedStatus, relStatus] = await Promise.all([
                    getUserProfile(id),
                    isUserBlocked(currentUser.$id, id),
                    checkExistingRelationship(currentUser.$id, id)
                ]);
                setProfile(profileData);
                setIsBlocked(blockedStatus);
                setRelationship(relStatus);

                // If no chatId, check if they are already friends
                if (!chatId) {
                    const existingChatId = await findPrivateChat(currentUser.$id, id);
                    if (existingChatId) setChatId(existingChatId);
                }
            } catch (err) {
                console.error('Error fetching user profile data:', err);
            } finally {
                setLoading(false);
            }
        };
        if (currentUser?.$id && id) {
            fetchInitialData();
        }
    }, [id, currentUser?.$id]); // Removed chatId from dependencies to prevent infinite loop

    // Real-time Relationship and Presence Updates
    useEffect(() => {
        if (!id || !currentUser?.$id) return;

        // 1. Listen for requests (Accept/Cancel/Delete)
        const unsubscribeRequests = subscribeRequests(async (event) => {
            const payload = event.payload;
            // Check if this request involves the current profile being viewed
            const isRelevant =
                (payload.senderId === currentUser.$id && payload.receiverId === id) ||
                (payload.senderId === id && payload.receiverId === currentUser.$id);

            if (!isRelevant) return;

            console.log('Real-time request event:', event.events[0]);

            // Handling Accept: Request status changes to 'accepted'
            if (payload.status === 'accepted') {
                setRelationship(null);
                const exChatId = await findPrivateChat(currentUser.$id, id);
                if (exChatId) setChatId(exChatId);
            }
            // Handling Delete/Cancel
            else if (event.events[0].includes('.delete')) {
                setRelationship(null);
            }
            // Handling New/Update
            else {
                const relStatus = await checkExistingRelationship(currentUser.$id, id);
                setRelationship(relStatus);
            }
        });

        // 2. Listen for User Presence (Online/Offline)
        const unsubscribePresence = subscribeSingleUserPresence(id, (payload) => {
            console.log('Real-time presence update:', payload.isOnline);
            setProfile(prev => prev ? { ...prev, ...payload } : payload);
        });

        return () => {
            unsubscribeRequests();
            unsubscribePresence();
        };
    }, [id, currentUser?.$id]);

    const handleRemoveFriend = () => {
        showAlert(
            "Remove Friend",
            `Are you sure you want to remove ${profile?.name} from your friends? This will delete your chat history and requests.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            // 1. Delete the chat (and messages/members)
                            if (chatId) {
                                await deletePrivateChat(chatId);
                            }

                            // 2. Delete any chat requests
                            await deleteAllRequests(currentUser.$id, id);

                            showAlert("Success", "Friend removed successfully.");
                            // Go back to previous screen
                            router.replace('/(tabs)/chats');
                        } catch (error) {
                            console.error("Error removing friend:", error);
                            showAlert("Error", "Failed to remove friend.");
                        } finally {
                            setProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleClearChat = () => {
        if (!chatId) return;
        showAlert(
            "Clear Chat",
            "Are you sure you want to delete all messages in this chat?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            await clearChatMessages(chatId);
                            showAlert("Success", "Chat cleared successfully.");
                        } catch (error) {
                            showAlert("Error", "Failed to clear chat.");
                        } finally {
                            setProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleBlockToggle = () => {
        const title = isBlocked ? "Unblock User" : "Block User";
        const message = isBlocked
            ? `Are you sure you want to unblock ${profile?.name}?`
            : `Blocked users will not be able to send you messages. Block ${profile?.name}?`;

        showAlert(
            title,
            message,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: isBlocked ? "Unblock" : "Block",
                    style: "destructive",
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            if (isBlocked) {
                                await unblockUser(currentUser.$id, id);
                                setIsBlocked(false);
                            } else {
                                await blockUser(currentUser.$id, id);
                                setIsBlocked(true);
                            }
                        } catch (error) {
                            showAlert("Error", `Failed to ${isBlocked ? 'unblock' : 'block'} user.`);
                        } finally {
                            setProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSendRequest = async () => {
        setProcessing(true);
        try {
            const res = await sendChatRequest(currentUser.$id, id);
            showAlert("Success", "Chat request sent!");
            // Manually update state for instant button toggle
            setRelationship({ type: 'request_sent', id: res.$id });
        } catch (error) {
            showAlert("Error", error.message || "Failed to send request.");
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!relationship?.id) return;
        setProcessing(true);
        try {
            await cancelChatRequest(relationship.id);
            showAlert("Success", "Request cancelled.");
            setRelationship(null);
        } catch (error) {
            showAlert("Error", "Failed to cancel request.");
        } finally {
            setProcessing(false);
        }
    };

    const handleAcceptRequest = async () => {
        if (!relationship?.id) return;
        setProcessing(true);
        try {
            await updateRequestStatus(relationship.id, "accepted");
            showAlert("Success", "Request accepted!");
            // Refresh everything manually for instant feedback
            setRelationship(null);
            const exChatId = await findPrivateChat(currentUser.$id, id);
            setChatId(exChatId);
        } catch (error) {
            showAlert("Error", "Failed to accept request.");
        } finally {
            setProcessing(false);
        }
    };

    const avatarName = profile?.name
        ? profile.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
        : "?";

    const nameHash = profile?.name ? profile.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const colorIndex = nameHash % (bgColor.length || 1);

    return (
        <View className="flex-1 bg-[#111b21]">
            {(processing) && (
                <View
                    style={StyleSheet.absoluteFill}
                    className="bg-black/50 z-50 items-center justify-center"
                >
                    <ActivityIndicator size="large" color="#60a5fa" />
                    <Text className="text-white mt-4 font-medium">Processing...</Text>
                </View>
            )}

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center px-4 py-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <Ionicons name="arrow-back" size={24} color="#60a5fa" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold ml-4">User Info</Text>
                </View>

                <ScrollView className="flex-1">
                    {/* Hero Section */}
                    <View className="items-center py-6 bg-[#0b141a]">
                        <View className={`w-[140px] h-[140px] rounded-full items-center justify-center overflow-hidden border-4 border-[#202c33] ${bgColor[colorIndex]}`}>
                            {loading ? (
                                <Skeleton width={140} height={140} borderRadius={80} backgroundColor="#374045" />
                            ) : profile?.profile_pic ? (
                                <Image source={{ uri: profile.profile_pic }} className="w-full h-full" />
                            ) : (
                                <Text className="text-[#1c2932] text-6xl font-bold">
                                    {avatarName}
                                </Text>
                            )}
                        </View>

                        {loading ? (
                            <View className="items-center mt-4">
                                <Skeleton width={200} height={28} borderRadius={14} className="mb-2" />
                                <Skeleton width={120} height={18} borderRadius={9} className="mb-2" />
                                <Skeleton width={150} height={14} borderRadius={7} />
                            </View>
                        ) : (
                            <>
                                <Text className="text-white text-3xl font-bold mt-4">
                                    {profile?.name || 'Unknown'}
                                </Text>
                                <Text className="text-[#8696a0] text-lg mt-1">
                                    @{profile?.username || 'username'}
                                </Text>
                                <View className="flex-row items-center mt-1.5">
                                    <View className={`w-2.5 h-2.5 rounded-full mr-2 ${profile?.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                                    <Text className="text-[#8696a0] text-sm">
                                        {profile?.isOnline ? 'Online' : `Last seen ${formatLastSeen(profile?.lastSeen)}`}
                                    </Text>
                                </View>
                            </>
                        )}

                        {/* Quick Actions */}
                        <View className="flex-row mt-8 w-full justify-around px-8">
                            {loading ? (
                                <>
                                    <View className="items-center">
                                        <Skeleton width={48} height={48} borderRadius={24} backgroundColor="#202c33" />
                                        <Skeleton width={40} height={12} borderRadius={6} backgroundColor="#202c33" className="mt-2" />
                                    </View>
                                    <View className="items-center">
                                        <Skeleton width={48} height={48} borderRadius={24} backgroundColor="#202c33" />
                                        <Skeleton width={40} height={12} borderRadius={6} backgroundColor="#202c33" className="mt-2" />
                                    </View>
                                    <View className="items-center">
                                        <Skeleton width={48} height={48} borderRadius={24} backgroundColor="#202c33" />
                                        <Skeleton width={40} height={12} borderRadius={6} backgroundColor="#202c33" className="mt-2" />
                                    </View>
                                </>
                            ) : (
                                <>
                                    {!isSelf && !chatId && !relationship && (
                                        <ActionBtn
                                            icon="person-add"
                                            label="Add Friend"
                                            onPress={handleSendRequest}
                                            color="#60a5fa"
                                        />
                                    )}

                                    {!isSelf && relationship?.type === 'request_sent' && (
                                        <ActionBtn
                                            icon="close-circle"
                                            label="Cancel Req"
                                            onPress={handleCancelRequest}
                                            color="#ef4444"
                                        />
                                    )}

                                    {!isSelf && relationship?.type === 'request_received' && (
                                        <ActionBtn
                                            icon="checkmark-circle"
                                            label="Accept Req"
                                            onPress={handleAcceptRequest}
                                            color="#22c55e"
                                        />
                                    )}

                                    {chatId && (
                                        <>
                                            <ActionBtn icon="call" label="Audio" color={isBlocked ? "#374045" : "#60a5fa"} disabled={isBlocked} />
                                            <ActionBtn icon="videocam" label="Video" color={isBlocked ? "#374045" : "#60a5fa"} disabled={isBlocked} />
                                            <ActionBtn
                                                icon="chatbubble"
                                                label="Message"
                                                onPress={() => router.push(`/chat/${chatId}`)}
                                                color="#60a5fa"
                                                disabled={isBlocked}
                                            />
                                        </>
                                    )}
                                    <ActionBtn icon="search" label="Search" color="#60a5fa" />
                                    {isSelf && (
                                        <ActionBtn
                                            icon="create-outline"
                                            label="Edit"
                                            onPress={() => router.push('/profile/edit')}
                                            color="#60a5fa"
                                        />
                                    )}
                                </>
                            )}
                        </View>
                    </View>

                    {/* Info Sections */}
                    <View className="mt-4 px-4">
                        <InfoSection title="About and phone number">
                            {loading ? (
                                <View>
                                    <Skeleton width="100%" height={20} borderRadius={10} backgroundColor="#202c33" className="mb-2" />
                                    <Skeleton width="60%" height={14} borderRadius={7} backgroundColor="#202c33" />
                                </View>
                            ) : (
                                <>
                                    <Text className="text-white text-base">
                                        {profile?.bio || "Hey there! I am using ChatterApp."}
                                    </Text>
                                    <Text className="text-[#8696a0] text-xs mt-2">
                                        Updated {profile?.$updatedAt ? new Date(profile.$updatedAt).toLocaleDateString() : 'recently'}
                                    </Text>
                                </>
                            )}
                        </InfoSection>

                        {loading ? (
                            <View className="py-4 border-b border-[#202c33]">
                                <Skeleton width={150} height={16} borderRadius={8} backgroundColor="#202c33" className="mb-3" />
                                <View className="flex-row items-center justify-between">
                                    <Skeleton width={100} height={14} borderRadius={7} backgroundColor="#202c33" />
                                    <Skeleton width={20} height={20} borderRadius={10} backgroundColor="#202c33" />
                                </View>
                            </View>
                        ) : (
                            chatId && (
                                <InfoSection title="Media, links and docs">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-[#8696a0] text-sm italic">No media shared yet</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#374045" />
                                    </View>
                                </InfoSection>
                            )
                        )}

                        {/* Management Actions */}
                        <View className="mt-6 mb-8">
                            {loading ? (
                                <>
                                    <View className="flex-row items-center py-4 border-b border-[#202c33]">
                                        <Skeleton width={24} height={24} borderRadius={12} backgroundColor="#202c33" />
                                        <Skeleton width={120} height={16} borderRadius={8} backgroundColor="#202c33" className="ml-4" />
                                    </View>
                                    <View className="flex-row items-center py-4 border-b border-[#202c33]">
                                        <Skeleton width={24} height={24} borderRadius={12} backgroundColor="#202c33" />
                                        <Skeleton width={120} height={16} borderRadius={8} backgroundColor="#202c33" className="ml-4" />
                                    </View>
                                </>
                            ) : (
                                <>
                                    {chatId && (
                                        <>
                                            <TouchableOpacity
                                                onPress={handleClearChat}
                                                className="flex-row items-center py-4 border-b border-[#202c33]"
                                            >
                                                <Ionicons name="refresh-outline" size={24} color="#ef4444" />
                                                <Text className="text-[#ef4444] text-base font-bold ml-4">Clear Chat</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={handleRemoveFriend}
                                                className="flex-row items-center py-4 border-b border-[#202c33]"
                                            >
                                                <Ionicons name="person-remove-outline" size={24} color="#ef4444" />
                                                <Text className="text-[#ef4444] text-base font-bold ml-4">Remove Friend</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}

                                    <TouchableOpacity
                                        onPress={handleBlockToggle}
                                        className="flex-row items-center py-4 border-b border-[#202c33]"
                                    >
                                        <Ionicons name={isBlocked ? "lock-open-outline" : "ban-outline"} size={24} color="#ef4444" />
                                        <Text className="text-[#ef4444] text-base font-bold ml-4">
                                            {isBlocked ? `Unblock ${profile?.name}` : `Block ${profile?.name}`}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    <View className="h-20" />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const ActionBtn = ({ icon, label, color, disabled, onPress }) => (
    <TouchableOpacity className="items-center" disabled={disabled} onPress={onPress}>
        <View className="w-12 h-12 rounded-full bg-[#202c33] items-center justify-center mb-1">
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={{ color }} className="text-xs font-medium">{label}</Text>
    </TouchableOpacity>
);

const InfoSection = ({ title, children }) => (
    <View className="py-4 border-b border-[#202c33]">
        <Text className="text-[#60a5fa] text-sm font-bold mb-3 uppercase tracking-wider">{title}</Text>
        {children}
    </View>
);

export default UserProfile;
