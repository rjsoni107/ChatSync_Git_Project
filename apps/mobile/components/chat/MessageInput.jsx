import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard, ActivityIndicator, PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '@chatterapp/services/storage.service';
import { EmojiKeyboard } from 'rn-emoji-keyboard';

import { useAlertStore } from '@chatterapp/store/useAlertStore';

const EMOJI_HEIGHT = 320;

const MessageInput = ({ onSendMessage, onTyping }) => {
    const showAlert = useAlertStore(s => s.showAlert);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);

    /* ---------------- emoji ---------------- */

    const addEmoji = (emojiObject) => {
        setMessage(prev => prev + emojiObject.emoji);
    };

    const toggleEmojis = () => {
        Keyboard.dismiss();
        if (showEmojis) {
            // Close with animation
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

    const panY = useRef(new Animated.Value(0)).current;

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
                    // Swipe down threshold met
                    Animated.timing(panY, {
                        toValue: 300,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        setShowEmojis(false);
                        panY.setValue(0);
                    });
                } else {
                    // Return to original position
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

    /* ---------------- send ---------------- */

    const handleSend = () => {
        if (!message.trim()) return;
        onSendMessage(message.trim());
        setMessage('');
    };

    /* ---------------- UI ---------------- */

    return (
        <View className="bg-[#111b21] relative">
            {/* INPUT BAR */}
            <View className="flex-row items-center p-2 bg-[#111b21] z-20" >
                <View className="flex-row flex-1 items-center bg-surface rounded-3xl px-3 h-12">
                    <TouchableOpacity onPress={toggleEmojis} className="mr-2">
                        <Ionicons
                            name={showEmojis ? 'keypad-outline' : 'happy-outline'}
                            size={24}
                            color={showEmojis ? '#3b82f6' : '#8696a0'}
                        />
                    </TouchableOpacity>

                    <TextInput
                        className="flex-1 text-white text-base"
                        placeholder="Type a message"
                        placeholderTextColor="#8696a0"
                        value={message}
                        onChangeText={(t) => {
                            setMessage(t);
                            onTyping?.();
                        }}
                        onFocus={() => setShowEmojis(false)}
                        multiline
                    />

                    <TouchableOpacity onPress={handlePickImage} className="ml-2">
                        <Ionicons
                            name="attach-outline"
                            size={24}
                            color="#8696a0"
                            className="rotate-45"
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
                </View>

                <TouchableOpacity
                    onPress={handleSend}
                    disabled={uploading}
                    className={`ml-2 w-12 h-12 rounded-full items-center justify-center ${uploading ? 'bg-gray-600' : 'bg-primary'}`}
                >
                    <Ionicons
                        name={message.trim() ? 'send' : 'mic'}
                        size={24}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            {/* EMOJI PANEL */}
            {showEmojis && (
                <Animated.View
                    style={{ transform: [{ translateY: panY }] }}
                    {...panResponder.panHandlers}
                    className="h-[300px] bg-[#111b21] rounded-t-2xl overflow-hidden z-10"
                >
                    {/* drag knob area */}
                    <View className="items-center justify-center">
                        <View className="h-1 w-12 bg-[#2a3942] rounded-full" />
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
