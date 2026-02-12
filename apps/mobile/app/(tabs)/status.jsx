import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, TextInput, Animated, RefreshControl } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer } from 'expo-video';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { createStatus, getRecentStatuses, markStatusSeen, deleteStatus, addToHighlight, muteUserStatus, unmuteUserStatus } from '@chatterapp/services/status.service';
import { findPrivateChat, createChat, addChatMember } from '@chatterapp/services/chat.service';
import { sendMessage } from '@chatterapp/services/message.service';
import { getUsersByIds, updateUserProfile } from '@chatterapp/services/user.service';
import { useAlertStore } from '@chatterapp/store/useAlertStore';
import { formatDistanceToNow } from 'date-fns';
import Skeleton from '../../components/ui/Skeleton';
import { Modal, KeyboardAvoidingView, Platform } from 'react-native';

// Modular Components
import TextStatusModal from '../../components/status/TextStatusModal';
import StatusViewer from '../../components/status/StatusViewer';
import ViewersList from '../../components/status/ViewersList';
import StatusAvatar from '../../components/status/StatusAvatar';

const STORY_DURATION = 5000;
const BG_COLORS = ['#1a2a33', '#833ab4', '#fd1d1d', '#fcb045', '#405de6', '#5851db', '#34a853', '#ea4335', '#25d366'];

export default function Status() {
    const user = useAuthStore(s => s.user);
    const showAlert = useAlertStore(s => s.showAlert);

    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showMuted, setShowMuted] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Create Text Status State
    const [showTextModal, setShowTextModal] = useState(false);
    const [textStatus, setTextStatus] = useState("");
    const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);

    // Media Upload Preview State
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaCaption, setMediaCaption] = useState("");

    // Viewer State
    const [viewingStatus, setViewingStatus] = useState(null);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showViewers, setShowViewers] = useState(false);
    const [viewerProfiles, setViewerProfiles] = useState([]);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    // Animation & Timing Refs
    const progress = useRef(new Animated.Value(0)).current;
    const animationRef = useRef(null);
    const remainingTimeRef = useRef(STORY_DURATION);
    const startTimeRef = useRef(null);

    // Video Player
    const player = useVideoPlayer(null);

    const fetchStatuses = async (isRefreshing = false) => {
        if (!user?.$id) return;
        if (isRefreshing) setRefreshing(true);
        try {
            let mutedIds = [];
            try {
                mutedIds = user.mutedStatusUsers ? JSON.parse(user.mutedStatusUsers) : [];
            } catch (e) {
                mutedIds = [];
            }
            const data = await getRecentStatuses(user.$id, mutedIds);
            setStatuses(data);
        } catch (error) {
            console.error("Error fetching statuses:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, []);

    // Fetch Viewer Profiles
    useEffect(() => {
        const fetchViewers = async () => {
            if (showViewers && viewingStatus) {
                const viewers = viewingStatus.items[currentItemIndex].viewers || [];
                if (viewers.length > 0) {
                    setLoadingViewers(true);
                    try {
                        const profiles = await getUsersByIds(viewers);
                        setViewerProfiles(profiles);
                    } catch (error) {
                        console.error("Error fetching viewer profiles:", error);
                    } finally {
                        setLoadingViewers(false);
                    }
                } else {
                    setViewerProfiles([]);
                }
            }
        };
        fetchViewers();
    }, [showViewers, currentItemIndex, viewingStatus]);

    // Progress bar and logic for stories
    useEffect(() => {
        if (!viewingStatus) return;

        const currentItem = viewingStatus.items[currentItemIndex];
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
                    nextItem();
                }
            });
        } else {
            if (animationRef.current) {
                animationRef.current.stop();
                const elapsed = Date.now() - startTimeRef.current;
                remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
            }
        }
    }, [isPaused]);

    useEffect(() => {
        if (!viewingStatus) return;
        progress.setValue(0);
        const currentItem = viewingStatus.items[currentItemIndex];
        remainingTimeRef.current = currentItem.type === 'video' ? 15000 : STORY_DURATION;

        // Auto-play/pause video
        if (currentItem.type === 'video') {
            player.replace(currentItem.mediaUrl);
            player.play();
        } else {
            player.pause();
        }
    }, [currentItemIndex, viewingStatus]);

    // Mark as seen
    useEffect(() => {
        if (viewingStatus && user?.$id) {
            const currentItem = viewingStatus.items[currentItemIndex];
            if (currentItem.userId !== user.$id) {
                markStatusSeen(currentItem.$id, user.$id);
            }
        }
    }, [viewingStatus, currentItemIndex]);

    const handlePickMedia = async (mediaType = 'images') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: mediaType === 'images' ? ['images'] : ['videos'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.7,
            videoMaxDuration: 30,
        });

        if (!result.canceled) {
            setMediaPreview(result.assets[0]);
            setMediaCaption(""); // Reset caption for new pick
        }
    };

    const uploadMediaStatus = async (asset) => {
        setUploading(true);
        try {
            const isVideo = asset.type === 'video';
            const file = {
                name: asset.fileName || `status_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
                type: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
                size: asset.fileSize,
                uri: asset.uri,
            };

            await createStatus({
                userId: user.$id,
                userName: user.name,
                userProfilePic: user.profile_pic || "",
                file: file,
                caption: mediaCaption,
                type: isVideo ? 'video' : 'image'
            });

            setMediaPreview(null);
            setMediaCaption("");
            showAlert("Success", "Status uploaded successfully!");
            fetchStatuses();
        } catch (error) {
            showAlert("Error", "Failed to upload status.");
        } finally {
            setUploading(false);
        }
    };

    const handleTextStatusUpload = async () => {
        if (!textStatus.trim()) return;
        setUploading(true);
        try {
            await createStatus({
                userId: user.$id,
                userName: user.name,
                userProfilePic: user.profile_pic || "",
                caption: textStatus,
                type: 'text',
                bgColor: selectedBg
            });
            setShowTextModal(false);
            setTextStatus("");
            showAlert("Success", "Text status uploaded!");
            fetchStatuses();
        } catch (error) {
            showAlert("Error", "Failed to post text status.");
        } finally {
            setUploading(false);
        }
    };

    const handleReply = async (quickEmoji = null) => {
        const content = quickEmoji || replyText;
        if (!content.trim() || !viewingStatus) return;

        setSendingReply(true);
        try {
            const receiverId = viewingStatus.userId;
            let chatId = await findPrivateChat(user.$id, receiverId);

            if (!chatId) {
                const newChat = await createChat();
                chatId = newChat.$id;
                await addChatMember(chatId, user.$id);
                await addChatMember(chatId, receiverId);
            }

            const currentSegment = viewingStatus.items[currentItemIndex];
            const replyMessage = quickEmoji ? `Reacted to your Status: ${quickEmoji}` : `Replying to Status: ${content}`;

            await sendMessage({
                chatId,
                senderId: user.$id,
                content: replyMessage,
                type: 'text'
            });

            setReplyText("");
            showAlert("Sent", "Reply sent!");
            closeViewer();
        } catch (error) {
            showAlert("Error", "Could not send reply.");
        } finally {
            setSendingReply(false);
        }
    };

    const handleDeleteStatus = async (item) => {
        setIsPaused(true);
        showAlert(
            "Delete Status?",
            "Are you sure you want to delete this status segment?",
            [
                { text: "Cancel", style: "cancel", onPress: () => setIsPaused(false) },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteStatus(item.$id, item.fileId);
                            showAlert("Deleted", "Status deleted successfully.");
                            fetchStatuses();
                            closeViewer();
                        } catch (error) {
                            showAlert("Error", "Failed to delete status.");
                        }
                    }
                }
            ]
        );
    };

    const handleHighlightStatus = (item) => {
        setIsPaused(true);
        showAlert(
            "Add to Highlights",
            "Enter a name for this highlight group:",
            [
                { text: "Cancel", style: "cancel", onPress: () => setIsPaused(false) },
                {
                    text: "Save",
                    onPress: async () => {
                        // For mobile, we might need a custom input modal for names, 
                        // but for now, we'll use a default name if prompt isn't easy
                        // Let's assume user wants to group it.
                        try {
                            await addToHighlight(item.$id, "My Highlights");
                            showAlert("Success", "Added to Highlights! Check your profile.");
                            setIsPaused(false);
                        } catch (error) {
                            showAlert("Error", "Failed to add to highlights.");
                            setIsPaused(false);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    const handleMuteUser = async (targetUser) => {
        showAlert(
            "Mute status?",
            `New status updates from ${targetUser.userName} won't show up in your recent updates.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Mute",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await muteUserStatus(user.$id, targetUser.userId);
                            showAlert("Muted", `${targetUser.userName}'s statuses have been muted.`);
                            // Local update for better UX
                            let mutedIds = [];
                            try {
                                mutedIds = user.mutedStatusUsers ? JSON.parse(user.mutedStatusUsers) : [];
                            } catch (e) { }
                            if (!mutedIds.includes(targetUser.userId)) {
                                mutedIds.push(targetUser.userId);
                            }
                            useAuthStore.getState().setUser({
                                ...user,
                                mutedStatusUsers: JSON.stringify(mutedIds)
                            });
                            fetchStatuses();
                        } catch (error) {
                            showAlert("Error", "Failed to mute user.");
                        }
                    }
                }
            ]
        );
    };

    const handleUnmuteUser = async (targetUser) => {
        try {
            await unmuteUserStatus(user.$id, targetUser.userId);
            // Local update
            let mutedIds = [];
            try {
                mutedIds = user.mutedStatusUsers ? JSON.parse(user.mutedStatusUsers) : [];
            } catch (e) { }
            mutedIds = mutedIds.filter(id => id !== targetUser.userId);
            useAuthStore.getState().setUser({
                ...user,
                mutedStatusUsers: JSON.stringify(mutedIds)
            });
            fetchStatuses();
            showAlert("Unmuted", `${targetUser.userName}'s statuses will now show up normally.`);
        } catch (error) {
            showAlert("Error", "Failed to unmute user.");
        }
    };

    const handleUpdatePrivacy = async (value) => {
        try {
            await updateStatusPrivacy(user.$id, value);
            useAuthStore.getState().setUser({ ...user, statusPrivacy: value });
            setShowPrivacyModal(false);
            showAlert("Privacy Updated", `Your status updates are now visible to: ${value === 'everyone' ? 'Everyone' : 'My Contacts'}`);
            fetchStatuses();
        } catch (error) {
            showAlert("Error", "Failed to update privacy settings.");
        }
    };

    const myStatus = statuses.find(s => s.userId === user?.$id);
    const othersStatuses = statuses.filter(s => s.userId !== user?.$id && !s.isMuted);
    const mutedStatuses = statuses.filter(s => s.userId !== user?.$id && s.isMuted);

    const isGroupSeen = (group) => {
        if (!user?.$id || !group.items) return false;
        return group.items.every(item => item.viewers?.includes(user.$id));
    };

    const openViewer = (group) => {
        setViewingStatus(group);
        setCurrentItemIndex(0);
        setIsPaused(false);
    };

    const closeViewer = () => {
        setViewingStatus(null);
        setCurrentItemIndex(0);
        setIsPaused(false);
        progress.setValue(0);
        setReplyText("");
    };

    const nextItem = () => {
        setCurrentItemIndex(prev => {
            if (!viewingStatus) return prev;
            if (prev < viewingStatus.items.length - 1) return prev + 1;
            closeViewer();
            return prev;
        });
    };

    const prevItem = () => {
        setCurrentItemIndex(prev => (prev > 0 ? prev - 1 : prev));
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="px-4 py-3 flex-row justify-between items-center border-b border-[#202c33]">
                <Text className="text-white text-2xl font-bold">Status</Text>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => setShowPrivacyModal(true)} className="mr-4">
                        <Ionicons name="lock-closed-outline" size={22} color="#8696a0" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => showAlert("Info", "Statuses disappear after 24 hours.")}>
                        <Ionicons name="ellipsis-vertical" size={20} color="#8696a0" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchStatuses(true)}
                        tintColor="#60a5fa"
                        colors={["#60a5fa"]}
                    />
                }
            >
                {/* My Status Section */}
                <View className="px-4 py-4">
                    <Text className="text-[#8696a0] text-sm font-bold uppercase tracking-wider mb-4">My Status</Text>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={myStatus ? () => openViewer(myStatus) : () => handlePickMedia('images')}
                            className="relative"
                        >
                            <StatusAvatar
                                imageUrl={user?.profile_pic}
                                itemsCount={myStatus?.items?.length || 0}
                                isSeen={myStatus ? isGroupSeen(myStatus) : false}
                                size={56}
                                strokeWidth={myStatus ? 2.5 : 1}
                                fallbackText={user?.name || "?"}
                            />
                            {!myStatus && (
                                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-5 h-5 items-center justify-center border-2 border-[#111b21]">
                                    <Ionicons name="add" size={16} color="white" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <View className="ml-4 flex-1">
                            <Text className="text-white text-lg font-bold">My Status</Text>
                            <Text className="text-[#8696a0] text-sm">
                                {myStatus ? `${myStatus.items.length} segments • Tap to view` : "Tap to add status update"}
                            </Text>
                        </View>
                        <View className="flex-row items-center space-x-2">
                            <TouchableOpacity onPress={() => handlePickMedia('images')} className="p-2 bg-[#202c33] rounded-full">
                                <Ionicons name="camera" size={22} color="#60a5fa" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowTextModal(true)} className="p-2 bg-[#202c33] rounded-full ml-2">
                                <Ionicons name="pencil" size={22} color="#60a5fa" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Others Status Updates */}
                <View className="mt-2 px-4">
                    <Text className="text-[#8696a0] text-sm font-bold uppercase tracking-wider mb-4">Recent updates</Text>
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <View key={i} className="flex-row items-center mb-6">
                                <Skeleton width={56} height={56} borderRadius={28} backgroundColor="#202c33" />
                                <View className="ml-4 flex-1"><Skeleton width={120} height={18} borderRadius={9} backgroundColor="#202c33" className="mb-2" /><Skeleton width={150} height={14} borderRadius={7} backgroundColor="#202c33" /></View>
                            </View>
                        ))
                    ) : othersStatuses.length > 0 ? (
                        othersStatuses.map((group) => (
                            <TouchableOpacity
                                key={group.userId}
                                className="flex-row items-center mb-6"
                                onPress={() => openViewer(group)}
                                onLongPress={() => handleMuteUser(group)}
                                delayLongPress={500}
                            >
                                <StatusAvatar
                                    imageUrl={group.userProfilePic}
                                    itemsCount={group.items.length}
                                    isSeen={isGroupSeen(group)}
                                    size={56}
                                    fallbackText={group.userName}
                                />
                                <View className="ml-4 flex-1">
                                    <Text className="text-white text-lg font-bold">{group.userName}</Text>
                                    <Text className="text-[#8696a0] text-sm">{formatDistanceToNow(new Date(group.items[0].createdAt))} ago</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="items-center justify-center py-20">
                            <Ionicons name="aperture-outline" size={60} color="#202c33" />
                            <Text className="text-gray-500 mt-4 text-center px-10">No status updates yet from your contacts.</Text>
                        </View>
                    )}
                </View>

                {/* Muted Updates Section */}
                {mutedStatuses.length > 0 && (
                    <View className="mt-4 px-4 pb-10">
                        <TouchableOpacity
                            onPress={() => setShowMuted(!showMuted)}
                            className="flex-row items-center justify-between py-2"
                        >
                            <Text className="text-[#8696a0] text-sm font-bold uppercase tracking-wider">Muted updates</Text>
                            <Ionicons
                                name={showMuted ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#8696a0"
                            />
                        </TouchableOpacity>

                        {showMuted && (
                            <View className="mt-4">
                                {mutedStatuses.map((group) => (
                                    <TouchableOpacity
                                        key={group.userId}
                                        className="flex-row items-center mb-6 opacity-60"
                                        onPress={() => openViewer(group)}
                                        onLongPress={() => handleUnmuteUser(group)}
                                        delayLongPress={500}
                                    >
                                        <StatusAvatar
                                            imageUrl={group.userProfilePic}
                                            itemsCount={group.items.length}
                                            isSeen={isGroupSeen(group)}
                                            size={56}
                                            fallbackText={group.userName}
                                            grayscale={true}
                                        />
                                        <View className="ml-4 flex-1">
                                            <Text className="text-white text-lg font-bold">{group.userName}</Text>
                                            <Text className="text-[#8696a0] text-sm">Muted • Long press to unmute</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            <TextStatusModal
                visible={showTextModal}
                onClose={() => setShowTextModal(false)}
                text={textStatus}
                onTextChange={setTextStatus}
                selectedBg={selectedBg}
                onBgChange={setSelectedBg}
                onUpload={handleTextStatusUpload}
            />

            <StatusViewer
                visible={!!viewingStatus}
                allStatuses={statuses}
                initialGroupIndex={statuses.findIndex(s => s.userId === viewingStatus?.userId)}
                onGroupChange={(group) => {
                    setViewingStatus(group);
                    setCurrentItemIndex(0);
                    setIsPaused(false);
                    progress.setValue(0);
                }}
                currentItemIndex={currentItemIndex}
                isPaused={isPaused}
                setIsPaused={setIsPaused}
                onClose={closeViewer}
                onNext={nextItem}
                onPrev={prevItem}
                onNavigateToViewers={() => setShowViewers(true)}
                user={user}
                progress={progress}
                player={player}
                replyText={replyText}
                setReplyText={setReplyText}
                onReply={handleReply}
                onDelete={handleDeleteStatus}
                onHighlight={handleHighlightStatus}
                onMute={handleMuteUser}
                onUnmute={handleUnmuteUser}
                sendingReply={sendingReply}
                animationRef={animationRef}
                remainingTimeRef={remainingTimeRef}
                startTimeRef={startTimeRef}
            />

            <ViewersList
                visible={showViewers}
                onClose={() => setShowViewers(false)}
                viewers={viewerProfiles}
                loading={loadingViewers}
            />

            {/* Status Privacy Modal */}
            <Modal
                visible={showPrivacyModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPrivacyModal(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/50 justify-end"
                    activeOpacity={1}
                    onPress={() => setShowPrivacyModal(false)}
                >
                    <View className="bg-[#111b21] rounded-t-3xl p-6 border-t border-[#202c33]">
                        <View className="items-center mb-6">
                            <View className="w-10 h-1.5 bg-[#202c33] rounded-full mb-4" />
                            <Text className="text-white text-xl font-bold">Status privacy</Text>
                            <Text className="text-[#8696a0] text-center mt-2 px-4">
                                Choose who can see your status updates. Changes will apply to new status updates.
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => handleUpdatePrivacy('everyone')}
                            className="flex-row items-center justify-between py-4 border-b border-[#202c33]"
                        >
                            <View className="flex-1">
                                <Text className="text-white text-lg">Everyone</Text>
                                <Text className="text-[#8696a0] text-sm">Anyone using ChatterApp</Text>
                            </View>
                            <Ionicons
                                name={(user?.statusPrivacy === 'everyone' || !user?.statusPrivacy) ? "radio-button-on" : "radio-button-off"}
                                size={24}
                                color={(user?.statusPrivacy === 'everyone' || !user?.statusPrivacy) ? "#00a884" : "#8696a0"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleUpdatePrivacy('contacts')}
                            className="flex-row items-center justify-between py-4"
                        >
                            <View className="flex-1">
                                <Text className="text-white text-lg">My contacts</Text>
                                <Text className="text-[#8696a0] text-sm">Only people you have a chat with</Text>
                            </View>
                            <Ionicons
                                name={user?.statusPrivacy === 'contacts' ? "radio-button-on" : "radio-button-off"}
                                size={24}
                                color={user?.statusPrivacy === 'contacts' ? "#00a884" : "#8696a0"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowPrivacyModal(false)}
                            className="mt-6 bg-[#00a884] py-3 rounded-full items-center"
                        >
                            <Text className="text-black font-bold text-lg">Done</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Media Preview Modal */}
            <Modal visible={!!mediaPreview} animationType="slide">
                <SafeAreaView className="flex-1 bg-black">
                    <View className="p-4 flex-row justify-between items-center z-10">
                        <TouchableOpacity onPress={() => setMediaPreview(null)}>
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => uploadMediaStatus(mediaPreview)}
                            className="bg-blue-500 px-6 py-2 rounded-full"
                        >
                            <Text className="text-white font-bold">Share</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 justify-center items-center">
                        {mediaPreview?.type === 'video' ? (
                            <Text className="text-white">Video selected</Text>
                        ) : (
                            <Image
                                source={{ uri: mediaPreview?.uri }}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        )}
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="p-4"
                    >
                        <View className="bg-white/10 rounded-2xl px-4 py-2 flex-row items-center border border-white/20">
                            <TextInput
                                placeholder="Add a caption..."
                                placeholderTextColor="#8696a0"
                                className="flex-1 text-white min-h-[40px] text-lg"
                                value={mediaCaption}
                                onChangeText={setMediaCaption}
                                multiline
                            />
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            {uploading && (
                <View style={StyleSheet.absoluteFill} className="bg-black/80 items-center justify-center z-50">
                    <ActivityIndicator size="large" color="#60a5fa" /><Text className="text-white mt-4 font-bold">Uploading status...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};


