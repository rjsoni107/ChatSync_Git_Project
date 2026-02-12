import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, Pressable, Animated, PanResponder, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView } from 'expo-video';
import { formatDistanceToNow } from 'date-fns';
import StatusProgressBar from './StatusProgressBar';
import QuickReactions from './QuickReactions';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const { width, height } = Dimensions.get('window');

const StatusViewer = ({
    visible,
    allStatuses,
    initialGroupIndex,
    onGroupChange,
    currentItemIndex,
    isPaused,
    setIsPaused,
    onClose,
    onNext,
    onPrev,
    onNavigateToViewers,
    user,
    progress,
    player,
    replyText,
    setReplyText,
    onReply,
    onDelete,
    onHighlight,
    sendingReply,
    animationRef,
    remainingTimeRef,
    startTimeRef,
    onMute,
    onUnmute
}) => {
    const showAlert = useAlertStore(s => s.showAlert);
    const flatListRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(initialGroupIndex);
    const viewAnim = useRef(new Animated.Value(0)).current;

    // View animation effect
    useEffect(() => {
        if (visible) {
            viewAnim.setValue(0);
            Animated.sequence([
                Animated.delay(300),
                Animated.spring(viewAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7
                })
            ]).start();
        }
    }, [visible, currentItemIndex]);

    // Sync active index when initialGroupIndex changes (e.g. when opening from list)
    useEffect(() => {
        if (visible) {
            setActiveIndex(initialGroupIndex);
            // Delay scroll to ensure FlatList is ready
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: initialGroupIndex, animated: false });
            }, 100);
        }
    }, [visible, initialGroupIndex]);

    // Swipe to Close PanResponder
    const panY = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10 && Math.abs(gesture.dx) < 10,
            onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 150) {
                    onClose();
                } else {
                    Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
                }
            }
        })
    ).current;

    const handleScroll = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        if (index !== activeIndex && index >= 0 && index < allStatuses.length) {
            setActiveIndex(index);
            onGroupChange(allStatuses[index], index);
        }
    };

    const renderStatusGroup = ({ item: group, index }) => {
        const isActive = index === activeIndex;
        const currentItem = group.items[isActive ? currentItemIndex : 0];

        return (
            <View style={{ width, height: '100%' }}>
                {/* Segmented Progress Bars (Only show for active group) */}
                <StatusProgressBar
                    items={group.items}
                    currentItemIndex={isActive ? currentItemIndex : 0}
                    progress={isActive ? progress : new Animated.Value(0)}
                />

                {/* Top Header */}
                <View className="flex-row items-center px-4 py-4 justify-between">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden border border-white/20">
                            {group.userProfilePic ? (
                                <Image source={{ uri: group.userProfilePic }} className="w-full h-full" />
                            ) : (
                                <View className="w-full h-full items-center justify-center">
                                    <Text className="text-white font-bold">{group.userName[0]}</Text>
                                </View>
                            )}
                        </View>
                        <View className="ml-3">
                            <Text className="text-white font-bold">{group.userName}</Text>
                            <Text className="text-white/70 text-xs">
                                {currentItem && formatDistanceToNow(new Date(currentItem.createdAt))} ago
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => {
                                setIsPaused(true);
                                const isMuted = group.isMuted;
                                showAlert(
                                    isMuted ? "Unmute status?" : "Mute status?",
                                    isMuted
                                        ? `Unmute ${group.userName}'s status updates?`
                                        : `Mute ${group.userName}'s status updates? They won't appear in recent updates.`,
                                    [
                                        { text: "Cancel", style: "cancel", onPress: () => setIsPaused(false) },
                                        {
                                            text: isMuted ? "Unmute" : "Mute",
                                            style: isMuted ? "default" : "destructive",
                                            onPress: () => {
                                                if (isMuted) {
                                                    onUnmute?.(group);
                                                    setIsPaused(false);
                                                } else {
                                                    onMute?.(group);
                                                    onClose();
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                            className="p-2 mr-2"
                        >
                            <Ionicons name="ellipsis-vertical" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Options (Owner Only) */}
                {isActive && group.userId === user?.$id && (
                    <View className="absolute top-20 right-4 z-10 space-y-4">
                        <TouchableOpacity
                            onPress={() => onDelete(currentItem)}
                            className="bg-black/40 p-3 rounded-full"
                        >
                            <Ionicons name="trash-outline" size={24} color="#ef4444" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => onHighlight(currentItem)}
                            className="bg-black/40 p-3 rounded-full"
                        >
                            <Ionicons name="star-outline" size={24} color="#fbbf24" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Content Viewer */}
                <View className="flex-1 justify-center relative">
                    {currentItem?.type === 'text' ? (
                        <View className="flex-1 items-center justify-center p-10" style={{ backgroundColor: currentItem.bgColor || '#111' }}>
                            <Text className="text-white text-4xl text-center font-bold">{currentItem.caption}</Text>
                        </View>
                    ) : currentItem?.type === 'video' ? (
                        isActive ? (
                            <VideoView
                                player={player}
                                className="w-full h-full"
                                contentScale="contain"
                                useNativeControls={false}
                            />
                        ) : (
                            <View className="w-full h-full bg-black items-center justify-center">
                                <ActivityIndicator color="white" />
                            </View>
                        )
                    ) : currentItem ? (
                        <Image
                            source={{ uri: currentItem.mediaUrl }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    ) : (
                        <View className="w-full h-full bg-black items-center justify-center">
                            <ActivityIndicator color="white" />
                        </View>
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
                            onPress={isActive ? onPrev : null}
                            onLongPress={() => isActive && setIsPaused(true)}
                            onPressOut={() => isActive && setIsPaused(false)}
                            delayLongPress={200}
                        />
                        <Pressable
                            className="flex-1"
                            onPress={isActive ? onNext : null}
                            onLongPress={() => isActive && setIsPaused(true)}
                            onPressOut={() => isActive && setIsPaused(false)}
                            delayLongPress={200}
                        />
                    </View>
                </View>

                {/* Footer Interactions */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <View className="p-4 items-center bg-black/40">
                        {group.userId === user?.$id ? (
                            <Animated.View
                                style={{
                                    transform: [
                                        { translateY: viewAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
                                        { scale: viewAnim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1.1, 1] }) }
                                    ],
                                    opacity: viewAnim
                                }}
                            >
                                <TouchableOpacity
                                    onPress={isActive ? onNavigateToViewers : null}
                                    className="flex-row items-center bg-white/10 px-4 py-2 rounded-full mb-4"
                                >
                                    <Ionicons name="eye-outline" size={18} color="white" />
                                    <Text className="text-white ml-2">{currentItem?.viewers?.length || 0} views</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ) : (
                            <View className="w-full">
                                {!replyText && isActive && (
                                    <QuickReactions onReact={(emoji) => onReply(emoji)} />
                                )}

                                <View className="flex-row items-center w-full space-x-2 bg-white/10 p-2 rounded-full px-4 mb-2">
                                    <TextInput
                                        placeholder="Reply..."
                                        placeholderTextColor="#8696a0"
                                        className="flex-1 text-white h-10"
                                        value={isActive ? replyText : ""}
                                        onChangeText={isActive ? setReplyText : null}
                                        onFocus={() => isActive && setIsPaused(true)}
                                        onBlur={() => isActive && setIsPaused(false)}
                                        editable={isActive}
                                    />
                                    <TouchableOpacity onPress={() => isActive && onReply()} disabled={!isActive}>
                                        {isActive && sendingReply ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Ionicons name="send" size={20} color="#60a5fa" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {currentItem?.type !== 'text' && currentItem?.caption && (
                            <View className="bg-black/60 px-6 py-3 rounded-2xl mx-4 mt-2">
                                <Text className="text-white text-lg text-center font-medium">
                                    {currentItem.caption}
                                </Text>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black" {...panResponder.panHandlers}>
                <Animated.View style={[{ flex: 1, transform: [{ translateY: panY }] }]}>
                    <FlatList
                        ref={flatListRef}
                        data={allStatuses}
                        renderItem={renderStatusGroup}
                        keyExtractor={(item) => item.userId}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleScroll}
                        onScrollBeginDrag={() => setIsPaused(true)}
                        onScrollEndDrag={() => setIsPaused(false)}
                        getItemLayout={(_, index) => ({
                            length: width,
                            offset: width * index,
                            index,
                        })}
                        initialScrollIndex={initialGroupIndex >= 0 && initialGroupIndex < allStatuses.length ? initialGroupIndex : 0}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={3}
                        windowSize={5}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

export default StatusViewer;
