import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard, ActivityIndicator, PanResponder, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { uploadFile } from '@chatterapp/services/storage.service';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import { useAudioRecorder, Audio } from 'expo-audio';
import GiphyPicker from './GiphyPicker';

import { useAlertStore } from '@chatterapp/store/useAlertStore';

const EMOJI_HEIGHT = 320;

const MessageInput = ({ onSendMessage, onTyping, editingMessage, onCancelEdit, chatId }) => {
    const router = useRouter();
    const showAlert = useAlertStore(s => s.showAlert);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [showGifs, setShowGifs] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordingPosX, setRecordingPosX] = useState(new Animated.Value(0));
    const [isCancelled, setIsCancelled] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const timerRef = useRef(null);
    const panY = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (editingMessage) {
            setMessage(editingMessage.content);
            setShowEmojis(false);
            Keyboard.dismiss();
        }
    }, [editingMessage]);

    /* ---------------- emoji ---------------- */

    const addEmoji = (emojiObject) => {
        setMessage(prev => prev + emojiObject.emoji);
    };

    const toggleEmojis = () => {
        Keyboard.dismiss();
        setShowGifs(false);
        setShowAttachments(false);
        if (showEmojis) {
            Animated.timing(panY, {
                toValue: 300,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setShowEmojis(false);
                panY.setValue(0);
            });
        } else {
            setShowEmojis(true);
        }
    };

    /* ---------------- drag to close ---------------- */

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 80) {
                    Animated.timing(panY, {
                        toValue: 300,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        setShowEmojis(false);
                        panY.setValue(0);
                    });
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    /* ---------------- media ---------------- */

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission Denied', 'Gallery access is required');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0]);
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
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0]);
        }
    };

    const uploadImage = async (asset) => {
        setUploading(true);
        try {
            const file = {
                name: asset.uri.split('/').pop() || 'image.jpg',
                type: 'image/jpeg',
                size: asset.fileSize || 0,
                uri: asset.uri,
            };

            const uploaded = await uploadFile(file);
            if (uploaded?.$id) {
                onSendMessage('', 'image', uploaded.$id);
            }
        } catch (err) {
            showAlert('Upload Failed', 'Please try again');
        } finally {
            setUploading(false);
        }
    };

    /* ---------------- voice recording ---------------- */

    const recorder = useAudioRecorder({
        bitRate: 128000,
        sampleRate: 44100,
        channels: 1,
    });

    const handleStartRecording = async () => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission Denied', 'Microphone access is required to record voice messages.');
            return;
        }

        try {
            await recorder.prepareToRecordAsync();
            recorder.record();
            setIsRecording(true);
            setIsCancelled(false);
            setRecordingDuration(0);
            recordingPosX.setValue(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Failed to start recording:", error);
            showAlert('Error', 'Could not start recording.');
        }
    };

    const handleStopRecording = async (shouldSend = true) => {
        if (!isRecording) return;

        clearInterval(timerRef.current);
        setIsRecording(false);

        try {
            await recorder.stop();
            if (shouldSend && !isCancelled && recorder.uri) {
                uploadVoiceMessage(recorder.uri, recorder.durationMillis);
            }
        } catch (error) {
            console.error("Failed to stop recording:", error);
        }
    };

    const uploadVoiceMessage = async (uri, durationMillis) => {
        setUploading(true);
        try {
            const file = {
                name: `voice_${Date.now()}.m4a`,
                type: 'audio/m4a',
                size: 0,
                uri: uri,
            };

            const uploaded = await uploadFile(file);
            if (uploaded?.$id) {
                onSendMessage('', 'voice', uploaded.$id, null, durationMillis);
            }
        } catch (err) {
            showAlert('Upload Failed', 'Failed to send voice message.');
        } finally {
            setUploading(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const recPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                handleStartRecording();
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < -10) {
                    recordingPosX.setValue(gestureState.dx);
                    if (gestureState.dx < -100) {
                        setIsCancelled(true);
                    } else {
                        setIsCancelled(false);
                    }
                }
            },
            onPanResponderRelease: () => {
                if (isCancelled) {
                    handleStopRecording(false);
                } else {
                    handleStopRecording(true);
                }
                Animated.spring(recordingPosX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    /* ---------------- send ---------------- */

    const handleSend = () => {
        if (!message.trim()) return;
        onSendMessage(message.trim(), 'text', null, editingMessage?.$id);
        setMessage('');
    };

    const handleSelectGif = (url, type = 'gif') => {
        onSendMessage(url, type);
        setShowGifs(false);
    };

    return (
        <View className="bg-[#111b21] relative">
            {/* EDITING HEADER */}
            {editingMessage && (
                <View className="flex-row items-center px-4 py-2 bg-[#202c33] border-b border-[#374248]">
                    <Ionicons name="pencil" size={16} color="#3b82f6" />
                    <View className="ml-3 flex-1">
                        <Text className="text-[#3b82f6] text-xs font-bold">Edit Message</Text>
                        <Text className="text-[#8696a0] text-xs" numberOfLines={1}>
                            {editingMessage.content}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onCancelEdit}>
                        <Ionicons name="close-circle" size={20} color="#8696a0" />
                    </TouchableOpacity>
                </View>
            )}

            {/* INPUT BAR */}
            <View className="flex-row items-center p-2 bg-[#111b21] z-20" >
                <View className="flex-row flex-1 items-center bg-[#202c33] rounded-3xl px-3 min-h-[48px]">
                    {isRecording ? (
                        <View className="flex-1 flex-row items-center">
                            <Ionicons name="mic" size={20} color="#ff4b4b" />
                            <Text className="text-[#ff4b4b] font-bold ml-2">
                                {formatDuration(recordingDuration)}
                            </Text>
                            <Animated.View
                                style={{ transform: [{ translateX: recordingPosX }] }}
                                className="flex-1 items-center"
                            >
                                <Text className={isCancelled ? "text-red-500 font-bold" : "text-[#8696a0]"}>
                                    {isCancelled ? "Release to cancel" : "Slide to cancel <"}
                                </Text>
                            </Animated.View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity onPress={toggleEmojis} className="mr-2">
                                <Ionicons
                                    name={showEmojis ? 'keypad-outline' : 'happy-outline'}
                                    size={24}
                                    color={showEmojis ? '#3b82f6' : '#8696a0'}
                                />
                            </TouchableOpacity>

                            <TextInput
                                className="flex-1 text-white text-base py-2"
                                placeholder="Type a message"
                                placeholderTextColor="#8696a0"
                                value={message}
                                onChangeText={(t) => {
                                    setMessage(t);
                                    onTyping?.();
                                }}
                                onFocus={() => {
                                    setShowEmojis(false);
                                    setShowGifs(false);
                                    setShowAttachments(false);
                                }}
                                multiline
                            />

                            <TouchableOpacity
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setShowEmojis(false);
                                    setShowGifs(false);
                                    setShowAttachments(!showAttachments);
                                }}
                                className="ml-2"
                            >
                                <Ionicons
                                    name="add-outline"
                                    size={28}
                                    color={showAttachments ? '#3b82f6' : '#8696a0'}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setShowEmojis(false);
                                    setShowAttachments(false);
                                    setShowGifs(!showGifs);
                                }}
                                className="ml-2"
                            >
                                <Ionicons
                                    name="images-outline"
                                    size={24}
                                    color={showGifs ? '#3b82f6' : '#8696a0'}
                                />
                            </TouchableOpacity>

                            {!message.trim() && !uploading && (
                                <TouchableOpacity onPress={handleTakePhoto} className="ml-3">
                                    <Ionicons name="camera-outline" size={24} color="#8696a0" />
                                </TouchableOpacity>
                            )}

                            {uploading && (
                                <View className="ml-3">
                                    <ActivityIndicator size="small" color="#3b82f6" />
                                </View>
                            )}
                        </>
                    )}
                </View>

                {message.trim() ? (
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={uploading}
                        className={`ml-2 w-12 h-12 rounded-full items-center justify-center ${uploading ? 'bg-gray-600' : 'bg-primary'}`}
                    >
                        <Ionicons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <Animated.View
                        {...recPanResponder.panHandlers}
                        className={`ml-2 w-12 h-12 rounded-full items-center justify-center ${isRecording ? 'bg-red-500 scale-125' : 'bg-primary'}`}
                    >
                        <Ionicons name="mic" size={24} color="#fff" />
                    </Animated.View>
                )}
            </View>

            {/* ATTACHMENT MENU */}
            {showAttachments && (
                <View className="flex-row justify-around p-4 bg-[#202c33] border-t border-[#374248]">
                    <TouchableOpacity
                        onPress={() => { setShowAttachments(false); handlePickImage(); }}
                        className="items-center"
                    >
                        <View className="w-12 h-12 rounded-full bg-purple-600 items-center justify-center mb-1">
                            <Ionicons name="images" size={24} color="white" />
                        </View>
                        <Text className="text-white text-[10px]">Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => { setShowAttachments(false); handleTakePhoto(); }}
                        className="items-center"
                    >
                        <View className="w-12 h-12 rounded-full bg-pink-600 items-center justify-center mb-1">
                            <Ionicons name="camera" size={24} color="white" />
                        </View>
                        <Text className="text-white text-[10px]">Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setShowAttachments(false);
                            if (!chatId) {
                                showAlert('Error', 'Chat ID is missing');
                                return;
                            }
                            router.push({
                                pathname: '/chat/poll/create',
                                params: { chatId }
                            });
                        }}
                        className="items-center"
                    >
                        <View className="w-12 h-12 rounded-full bg-orange-500 items-center justify-center mb-1">
                            <Ionicons name="stats-chart" size={24} color="white" />
                        </View>
                        <Text className="text-white text-[10px]">Poll</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* GIPHY PANEL */}
            {showGifs && (
                <View className="h-[350px] bg-[#111b21] z-10">
                    <GiphyPicker onSelectGif={handleSelectGif} />
                </View>
            )}

            {/* EMOJI PANEL */}
            {showEmojis && (
                <Animated.View
                    style={{ transform: [{ translateY: panY }] }}
                    {...panResponder.panHandlers}
                    className="h-[320px] bg-[#111b21] rounded-t-2xl overflow-hidden z-10"
                >
                    <View className="items-center justify-center py-2 bg-[#111b21]">
                        <View className="h-1.5 w-12 bg-[#2a3942] rounded-full" />
                    </View>

                    <EmojiKeyboard
                        onEmojiSelected={addEmoji}
                        enableSearchBar={true}
                        categoryPosition="bottom"
                        theme={{
                            container: '#0f172a',
                            backdrop: '#0f172a',
                            knob: '#3b82f6',
                            header: '#ffffff',
                            skinTonesContainer: '#202c33',
                            search: {
                                placeholder: '#8696a0',
                                placeholderTextColor: '#8696a0',
                                text: '#ffffff',
                                background: '#202c33',
                                icon: '#8696a0',
                            },
                            category: {
                                icon: '#8696a0',
                                iconActive: '#3b82f6',
                                container: '#0f172a',
                                containerActive: '#1e293b',
                            },
                        }}
                    />
                </Animated.View>
            )}
        </View>
    );
};

export default MessageInput;
