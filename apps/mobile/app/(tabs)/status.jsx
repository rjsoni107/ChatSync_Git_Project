import { View, Text, ScrollView, TouchableOpacity, Pressable, Image, Modal, ActivityIndicator, StyleSheet, Dimensions, Animated, PanResponder, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { createStatus, getRecentStatuses, markStatusSeen } from '@chatterapp/services/status.service';
import { findPrivateChat, createChat, addChatMember } from '@chatterapp/services/chat.service';
import { sendMessage } from '@chatterapp/services/message.service';
import { getUsersByIds } from '@chatterapp/services/user.service';
import { useAlertStore } from '@chatterapp/store/useAlertStore';
import { formatDistanceToNow } from 'date-fns';
import Skeleton from '../../components/ui/Skeleton';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds default for images

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

    // Animation for progress bar
    const progress = useRef(new Animated.Value(0)).current;

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

    // Progress Bar Animation Logic
    useEffect(() => {
        if (!viewingStatus) return;

        if (viewingStatus && !isPaused) {
            const currentItem = viewingStatus.items[currentItemIndex];
            // Get video duration if available, else default
            const duration = currentItem.type === 'video' ? 15000 : STORY_DURATION;

            progress.setValue(0);
            Animated.timing(progress, {
                toValue: 1,
                duration: duration,
                useNativeDriver: false,
            }).start(({ finished }) => {
                if (finished) {
                    nextItem();
                }
            });
        } else {
            progress.stopAnimation();
        }
    }, [viewingStatus, currentItemIndex, isPaused]);

    // Video Lifecycle
    useEffect(() => {
        const currentItem = viewingStatus?.items[currentItemIndex];
        if (currentItem?.type === 'video') {
            player.replace(currentItem.mediaUrl);
            player.play();
        } else {
            player.pause();
        }
    }, [viewingStatus, currentItemIndex]);

    useEffect(() => {
        if (viewingStatus?.items[currentItemIndex]?.type === 'video') {
            if (isPaused) {
                player.pause();
            } else {
                player.play();
            }
        }
    }, [isPaused]);

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
            videoMaxDuration: 30, // Limit to 30s
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
            console.error("Upload failed:", error);
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

    const handleReply = async () => {
        if (!replyText.trim() || !viewingStatus) return;
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
            const replyMessage = `Replying to Status: ${replyText}`;

            await sendMessage({
                chatId,
                senderId: user.$id,
                content: replyMessage,
                type: 'text'
            });

            setReplyText("");
            showAlert("Sent", "Reply sent to direct messages!");
            closeViewer();
        } catch (error) {
            console.error("Reply failed:", error);
            showAlert("Error", "Could not send reply.");
        } finally {
            setSendingReply(false);
        }
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

            if (prev < viewingStatus.items.length - 1) {
                return prev + 1;
            } else {
                closeViewer();
                return prev;
            }
        });
    };

    const prevItem = () => {
        setCurrentItemIndex(prev => (prev > 0 ? prev - 1 : prev));
    };



    // Swipe to Close PanResponder
    const panY = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
            onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 150) {
                    closeViewer();
                } else {
                    Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
                }
            }
        })
    ).current;

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="px-4 py-3 flex-row justify-between items-center">
                <Text className="text-white text-2xl font-bold">Status</Text>
                <TouchableOpacity onPress={() => showAlert("Info", "Statuses disappear after 24 hours.")}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#8696a0" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
                {/* My Status Section */}
                <View className="px-4 py-2">
                    <Text className="text-[#8696a0] text-sm font-bold uppercase tracking-wider mb-4">My Status</Text>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={myStatus ? () => openViewer(myStatus) : () => handlePickMedia('images')}
                            className="relative"
                        >
                            <View className={`w-14 h-14 rounded-full p-[2px] border-2 ${myStatus ? (isGroupSeen(myStatus) ? 'border-gray-500' : 'border-green-500') : 'border-gray-600'} items-center justify-center`}>
                                {user?.profile_pic ? (
                                    <Image source={{ uri: user.profile_pic }} className="w-full h-full rounded-full" />
                                ) : (
                                    <View className="w-full h-full rounded-full bg-[#374045] items-center justify-center">
                                        <Ionicons name="person" size={24} color="#8696a0" />
                                    </View>
                                )}
                            </View>
                            {!myStatus && (
                                <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-5 h-5 items-center justify-center border-2 border-[#111b21]">
                                    <Ionicons name="add" size={16} color="white" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <View className="ml-4 flex-1">
                            <Text className="text-white text-lg font-bold">My Status</Text>
                            <Text className="text-[#8696a0] text-sm">
                                {myStatus
                                    ? `${myStatus.items.length} segments • Tap to view`
                                    : "Tap to add status update"
                                }
                            </Text>
                        </View>
                        <View className="flex-row items-center space-x-2">
                            <TouchableOpacity onPress={() => handlePickMedia('images')} className="p-2 bg-[#202c33] rounded-full">
                                <Ionicons name="camera" size={22} color="#60a5fa" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowTextModal(true)} className="p-2 bg-[#202c33] rounded-full">
                                <Ionicons name="pencil" size={22} color="#60a5fa" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Others Status Updates */}
                <View className="mt-6 px-4">
                    <Text className="text-[#8696a0] text-sm font-bold uppercase tracking-wider mb-4">Recent updates</Text>
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <View key={i} className="flex-row items-center mb-4">
                                <Skeleton width={56} height={56} borderRadius={28} backgroundColor="#202c33" />
                                <View className="ml-4 flex-1"><Skeleton width={120} height={18} borderRadius={9} backgroundColor="#202c33" className="mb-2" /><Skeleton width={150} height={14} borderRadius={7} backgroundColor="#202c33" /></View>
                            </View>
                        ))
                    ) : othersStatuses.length > 0 ? (
                        othersStatuses.map((group) => (
                            <TouchableOpacity key={group.userId} className="flex-row items-center mb-4" onPress={() => openViewer(group)}>
                                <View className={`w-14 h-14 rounded-full p-[2px] border-2 ${isGroupSeen(group) ? 'border-gray-600' : 'border-green-500'} items-center justify-center`}>
                                    {group.userProfilePic ? <Image source={{ uri: group.userProfilePic }} className="w-full h-full rounded-full" /> : <View className="w-full h-full rounded-full bg-[#374045] items-center justify-center"><Text className="text-white font-bold">{group.userName[0]}</Text></View>}
                                </View>
                                <View className="ml-4 flex-1">
                                    <Text className="text-white text-lg font-bold">{group.userName}</Text>
                                    <Text className="text-[#8696a0] text-sm">{formatDistanceToNow(new Date(group.items[0].createdAt))} ago</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="items-center justify-center py-10"><Ionicons name="aperture-outline" size={60} color="#202c33" /><Text className="text-gray-500 mt-4 text-center px-10">No status updates yet.</Text></View>
                    )}
                </View>
            </ScrollView>

            {/* Create Text Status Modal */}
            <Modal visible={showTextModal} animationType="slide">
                <SafeAreaView className="flex-1" style={{ backgroundColor: selectedBg }}>
                    <View className="p-4 flex-row justify-between items-center">
                        <TouchableOpacity onPress={() => setShowTextModal(false)}>
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleTextStatusUpload}
                            className="bg-white/20 px-6 py-2 rounded-full"
                        >
                            <Text className="text-white font-bold">Share</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1 justify-center px-10">
                        <TextInput
                            multiline
                            placeholder="Type a status..."
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            className="text-white text-4xl text-center font-bold"
                            value={textStatus}
                            onChangeText={setTextStatus}
                            autoFocus
                        />
                    </View>
                    <View className="p-6">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {BG_COLORS.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    onPress={() => setSelectedBg(color)}
                                    className="w-10 h-10 rounded-full mr-3 border-2 border-white/50"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Status Viewer Modal */}
            <Modal visible={!!viewingStatus} transparent animationType="fade" onRequestClose={closeViewer}>
                <View className="flex-1 bg-black" {...panResponder.panHandlers}>
                    <Animated.View style={[{ flex: 1, transform: [{ translateY: panY }] }]}>
                        <SafeAreaView className="flex-1">
                            {/* Segmented Progress Bars */}
                            <View className="flex-row px-2 pt-2 space-x-1">
                                {viewingStatus?.items.map((_, index) => (
                                    <View key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                        <Animated.View className="h-full bg-white" style={{ width: index === currentItemIndex ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) : index < currentItemIndex ? '100%' : '0%' }} />
                                    </View>
                                ))}
                            </View>

                            {/* Top Header */}
                            <View className="flex-row items-center px-4 py-4 justify-between">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                        {viewingStatus?.userProfilePic ? <Image source={{ uri: viewingStatus.userProfilePic }} className="w-full h-full" /> : <View className="w-full h-full items-center justify-center"><Text className="text-white font-bold">{viewingStatus?.userName[0]}</Text></View>}
                                    </View>
                                    <View className="ml-3">
                                        <Text className="text-white font-bold">{viewingStatus?.userName}</Text>
                                        <Text className="text-white/70 text-xs">{viewingStatus && formatDistanceToNow(new Date(viewingStatus.items[currentItemIndex].createdAt))} ago</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={closeViewer} className="p-2"><Ionicons name="close" size={28} color="white" /></TouchableOpacity>
                            </View>

                            {/* Content Viewer */}
                            <View className="flex-1 justify-center relative">
                                {viewingStatus?.items[currentItemIndex].type === 'text' ? (
                                    <View className="flex-1 items-center justify-center p-10" style={{ backgroundColor: viewingStatus.items[currentItemIndex].bgColor || '#111' }}>
                                        <Text className="text-white text-4xl text-center font-bold">{viewingStatus.items[currentItemIndex].caption}</Text>
                                    </View>
                                ) : viewingStatus?.items[currentItemIndex].type === 'video' ? (
                                    <VideoView
                                        player={player}
                                        className="w-full h-full"
                                        contentScale="contain"
                                        useNativeControls={false}
                                    />
                                ) : (
                                    <Image
                                        source={{ uri: viewingStatus?.items[currentItemIndex].mediaUrl }}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                )}

                                {/* Touch Controls Layer */}
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    flexDirection: 'row'
                                }}>
                                    <Pressable
                                        className="flex-1"
                                        onPress={prevItem}
                                        onLongPress={() => setIsPaused(true)}
                                        onPressOut={() => setIsPaused(false)}
                                        delayLongPress={200}
                                    />
                                    <Pressable
                                        className="flex-1"
                                        onPress={nextItem}
                                        onLongPress={() => setIsPaused(true)}
                                        onPressOut={() => setIsPaused(false)}
                                        delayLongPress={200}
                                    />
                                </View>
                            </View>

                            {/* Footer Interactions */}
                            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                                <View className="p-4 items-center">
                                    {viewingStatus?.userId === user?.$id ? (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setIsPaused(true);
                                                setShowViewers(true);
                                            }}
                                            className="flex-row items-center bg-white/10 px-4 py-2 rounded-full mb-4"
                                        >
                                            <Ionicons name="eye-outline" size={18} color="white" /><Text className="text-white ml-2">{viewingStatus.items[currentItemIndex].viewers?.length || 0} views</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View className="flex-row items-center w-full space-x-2 bg-white/10 p-2 rounded-full px-4 mb-2">
                                            <TextInput
                                                placeholder="Reply..."
                                                placeholderTextColor="#8696a0"
                                                className="flex-1 text-white h-10"
                                                value={replyText}
                                                onChangeText={setReplyText}
                                                onFocus={() => setIsPaused(true)}
                                                onBlur={() => setIsPaused(false)}
                                            />
                                            <TouchableOpacity onPress={handleReply}>
                                                {sendingReply ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="#60a5fa" />}
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {viewingStatus?.items[currentItemIndex].type !== 'text' && (
                                        <Text className="text-white text-lg text-center">{viewingStatus?.items[currentItemIndex].caption || ""}</Text>
                                    )}
                                </View>
                            </KeyboardAvoidingView>
                        </SafeAreaView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Viewers List Modal */}
            <Modal visible={showViewers} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-[#1c2932] rounded-t-3xl h-[60%] p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Viewed by</Text>
                            <TouchableOpacity onPress={() => {
                                setShowViewers(false);
                                setIsPaused(false);
                            }}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        {loadingViewers ? (
                            <ActivityIndicator size="large" color="#60a5fa" />
                        ) : viewerProfiles.length > 0 ? (
                            <ScrollView>
                                {viewerProfiles.map(profile => (
                                    <View key={profile.userId} className="flex-row items-center mb-4">
                                        <View className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                            {profile.profile_pic ? <Image source={{ uri: profile.profile_pic }} className="w-full h-full" /> : <View className="w-full h-full items-center justify-center"><Ionicons name="person" size={20} color="#8696a0" /></View>}
                                        </View>
                                        <View className="ml-3">
                                            <Text className="text-white font-bold">{profile.name}</Text>
                                            <Text className="text-gray-400 text-xs">@{profile.username}</Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        ) : (
                            <View className="items-center justify-center py-10">
                                <Ionicons name="eye-off-outline" size={40} color="#374045" />
                                <Text className="text-gray-400 mt-2">No views yet</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {uploading && (
                <View style={StyleSheet.absoluteFill} className="bg-black/50 items-center justify-center z-50">
                    <ActivityIndicator size="large" color="#60a5fa" /><Text className="text-white mt-4 font-bold">Uploading status...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};


