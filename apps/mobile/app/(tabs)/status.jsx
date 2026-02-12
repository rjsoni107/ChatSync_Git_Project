import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet, TextInput, Animated } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer } from 'expo-video';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { createStatus, getRecentStatuses, markStatusSeen, deleteStatus, addToHighlight } from '@chatterapp/services/status.service';
import { findPrivateChat, createChat, addChatMember } from '@chatterapp/services/chat.service';
import { sendMessage } from '@chatterapp/services/message.service';
import { getUsersByIds } from '@chatterapp/services/user.service';
import { useAlertStore } from '@chatterapp/store/useAlertStore';
import { formatDistanceToNow } from 'date-fns';
import Skeleton from '../../components/ui/Skeleton';

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

    // Create Text Status State
    const [showTextModal, setShowTextModal] = useState(false);
    const [textStatus, setTextStatus] = useState("");
    const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);

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

    const fetchStatuses = async () => {
        try {
            const data = await getRecentStatuses();
            setStatuses(data);
        } catch (error) {
            console.error("Error fetching statuses:", error);
        } finally {
            setLoading(false);
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
            uploadMediaStatus(result.assets[0]);
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
                type: isVideo ? 'video' : 'image'
            });

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

    const myStatus = statuses.find(s => s.userId === user?.$id);
    const othersStatuses = statuses.filter(s => s.userId !== user?.$id);

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
                <TouchableOpacity onPress={() => showAlert("Info", "Statuses disappear after 24 hours.")}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#8696a0" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
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
                            <TouchableOpacity key={group.userId} className="flex-row items-center mb-6" onPress={() => openViewer(group)}>
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
                        <View className="items-center justify-center py-20"><Ionicons name="aperture-outline" size={60} color="#202c33" /><Text className="text-gray-500 mt-4 text-center px-10">No status updates yet from your contacts.</Text></View>
                    )}
                </View>
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

            {uploading && (
                <View style={StyleSheet.absoluteFill} className="bg-black/80 items-center justify-center z-50">
                    <ActivityIndicator size="large" color="#60a5fa" /><Text className="text-white mt-4 font-bold">Uploading status...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};


