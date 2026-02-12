import { View, Text, ScrollView, TouchableOpacity, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getChatMedia } from '@chatterapp/services/message.service';
import { getMobileFilePreview } from '@chatterapp/services/storage.service';
import { Image } from 'expo-image';
import { useImagePreviewStore } from '@chatterapp/store/useImagePreviewStore';
import VoiceMessage from '../../components/chat/VoiceMessage';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 3;

const MediaGallery = () => {
    const { chatId, chatName } = useLocalSearchParams();
    const router = useRouter();
    const showImage = useImagePreviewStore(s => s.showImage);

    const [activeTab, setActiveTab] = useState('media'); // media, docs, links
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedia = async () => {
            if (!chatId) return;
            try {
                const results = await getChatMedia(chatId);
                setMediaItems(results);
            } catch (err) {
                console.error('Error fetching chat media:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMedia();
    }, [chatId]);

    const renderMediaItem = ({ item }) => {
        if (item.type === 'image') {
            const previewUrl = getMobileFilePreview(item.fileId);
            return (
                <TouchableOpacity
                    onPress={() => showImage(previewUrl)}
                    style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH }}
                    className="p-[1px]"
                >
                    <Image
                        source={previewUrl}
                        className="w-full h-full"
                        contentFit="cover"
                        transition={200}
                    />
                </TouchableOpacity>
            );
        }

        if (item.type === 'voice') {
            return (
                <View
                    style={{ width: width - 32 }}
                    className="mx-4 my-2 bg-[#202c33] rounded-xl p-2"
                >
                    <VoiceMessage
                        fileId={item.fileId}
                        duration={parseInt(item.content || "0")}
                        isMe={false} // Neutral presentation in gallery
                    />
                    <Text className="text-[#8696a0] text-[10px] absolute bottom-2 right-4">
                        {new Date(item.createdAt || item.$createdAt).toLocaleDateString()}
                    </Text>
                </View>
            );
        }

        return null;
    };

    const filteredMedia = mediaItems.filter(item => {
        if (activeTab === 'media') return item.type === 'image' || item.type === 'video';
        if (activeTab === 'voice') return item.type === 'voice';
        return false;
    });

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-[#202c33]">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#60a5fa" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-lg font-bold">Media, links and docs</Text>
                    <Text className="text-[#8696a0] text-xs">{chatName || 'Chat'}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="flex-row bg-[#111b21] border-b border-[#202c33]">
                <TabButton
                    label="Media"
                    active={activeTab === 'media'}
                    onPress={() => setActiveTab('media')}
                />
                <TabButton
                    label="Voice"
                    active={activeTab === 'voice'}
                    onPress={() => setActiveTab('voice')}
                />
                <TabButton
                    label="Docs"
                    active={activeTab === 'docs'}
                    onPress={() => setActiveTab('docs')}
                />
                <TabButton
                    label="Links"
                    active={activeTab === 'links'}
                    onPress={() => setActiveTab('links')}
                />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#60a5fa" />
                </View>
            ) : filteredMedia.length === 0 ? (
                <View className="flex-1 items-center justify-center p-10">
                    <Ionicons
                        name={activeTab === 'media' ? 'images-outline' : 'musical-notes-outline'}
                        size={64}
                        color="#202c33"
                    />
                    <Text className="text-[#8696a0] text-center mt-4">
                        No {activeTab} shared in this chat yet.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredMedia}
                    renderItem={renderMediaItem}
                    keyExtractor={(item) => item.$id}
                    numColumns={activeTab === 'media' ? 3 : 1}
                    key={activeTab === 'media' ? 'grid' : 'list'}
                    contentContainerStyle={{ paddingVertical: 8 }}
                />
            )}
        </SafeAreaView>
    );
};

const TabButton = ({ label, active, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`flex-1 py-3 items-center border-b-2 ${active ? 'border-primary' : 'border-transparent'}`}
    >
        <Text className={`font-bold ${active ? 'text-primary' : 'text-[#8696a0]'}`}>
            {label}
        </Text>
    </TouchableOpacity>
);

export default MediaGallery;
