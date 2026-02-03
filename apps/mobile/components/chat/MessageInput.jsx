import { View, TextInput, TouchableOpacity, Keyboard, ActivityIndicator, Alert, ScrollView, Text } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '@chatsync/services/storage.service';

const MessageInput = ({ onSendMessage, onTyping }) => {
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);

    const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '❤️', '👍', '🔥', '✨', '✔️'];

    const addEmoji = (emoji) => {
        setMessage(prev => prev + emoji);
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery access is required to send images.');
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
            Alert.alert('Permission Denied', 'Camera access is required to take photos.');
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
            // Appwrite RN SDK expects an object like this for files
            const file = {
                name: asset.uri.split('/').pop() || 'image.jpg',
                type: 'image/jpeg', // Appwrite will detect if we leave it or use a default
                size: asset.fileSize || 0,
                uri: asset.uri,
            };

            const uploadedFile = await uploadFile(file);
            if (uploadedFile?.$id) {
                onSendMessage('', 'image', uploadedFile.$id);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSend = () => {
        if (!message.trim()) return;
        onSendMessage(message.trim());
        setMessage('');
    };

    const handleChangeText = (text) => {
        setMessage(text);
        if (onTyping) onTyping();
    };

    return (
        <View className="bg-[#111b21]">
            {showEmojis && (
                <View className="h-12 border-b border-[#202c33]">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 10, alignItems: 'center' }}
                    >
                        {emojis.map((emoji, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => addEmoji(emoji)}
                                className="mr-4"
                            >
                                <Text className="text-2xl">{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View className="flex-row items-center p-2">
                <View className="flex-row flex-1 items-center bg-[#202c33] rounded-3xl px-3 h-12">
                    <TouchableOpacity
                        className="mr-2"
                        onPress={() => setShowEmojis(!showEmojis)}
                    >
                        <Ionicons
                            name={showEmojis ? "keypad-outline" : "happy-outline"}
                            size={24}
                            color={showEmojis ? "#00a884" : "#8696a0"}
                        />
                    </TouchableOpacity>

                    <TextInput
                        className="flex-1 text-white text-base pt-0 pb-0"
                        placeholder="Type a message"
                        placeholderTextColor="#8696a0"
                        value={message}
                        onChangeText={handleChangeText}
                        onFocus={() => setShowEmojis(false)}
                        multiline
                    />

                    <TouchableOpacity className="ml-2" onPress={handlePickImage}>
                        <Ionicons name="attach-outline" size={24} color="#8696a0" className="rotate-45" />
                    </TouchableOpacity>

                    {(!message.trim() && !uploading) && (
                        <TouchableOpacity className="ml-3" onPress={handleTakePhoto}>
                            <Ionicons name="camera-outline" size={24} color="#8696a0" />
                        </TouchableOpacity>
                    )}

                    {uploading && (
                        <View className="ml-3">
                            <ActivityIndicator size="small" color="#00a884" />
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    onPress={handleSend}
                    disabled={uploading}
                    className={`ml-2 w-12 h-12 rounded-full items-center justify-center shadow-md ${uploading ? 'bg-gray-600' : 'bg-[#00a884]'}`}
                >
                    <Ionicons
                        name={message.trim() ? "send" : "mic"}
                        size={24}
                        color="#ffffff"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default MessageInput;
