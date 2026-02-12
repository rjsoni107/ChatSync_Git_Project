import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

const WALLPAPER_KEY = 'chat_wallpaper_uri';

const PRESETS = [
    { id: 'default', color: '#0b141a', name: 'Default' },
    { id: 'blue', color: '#043d72', name: 'Midnight' },
    { id: 'green', color: '#064e3b', name: 'Forest' },
    { id: 'purple', color: '#4c1d95', name: 'Royal' },
    { id: 'wine', color: '#450a0a', name: 'Wine' },
    { id: 'grey', color: '#1f2937', name: 'Onyx' },
];

const WallpaperSettings = () => {
    const router = useRouter();
    const [selected, setSelected] = useState('default');

    useEffect(() => {
        const load = async () => {
            const saved = await SecureStore.getItemAsync(WALLPAPER_KEY);
            if (saved) setSelected(saved);
        };
        load();
    }, []);

    const handleSelect = async (id) => {
        setSelected(id);
        await SecureStore.setItemAsync(WALLPAPER_KEY, id);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="flex-row items-center px-4 py-3 border-b border-[#202c33]">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#60a5fa" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">Chat Wallpaper</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text className="text-[#8696a0] mb-4 text-sm uppercase font-bold">Solid Colors</Text>

                <View className="flex-row flex-wrap">
                    {PRESETS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => handleSelect(item.id)}
                            style={{
                                width: ITEM_SIZE,
                                height: ITEM_SIZE * 1.5,
                                backgroundColor: item.color,
                                borderRadius: 12,
                                margin: 4,
                                borderWidth: selected === item.id ? 3 : 0,
                                borderColor: '#60a5fa',
                                overflow: 'hidden'
                            }}
                            className="items-center justify-center"
                        >
                            {selected === item.id && (
                                <View className="bg-primary rounded-full p-1">
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </View>
                            )}
                            <Text
                                className="absolute bottom-2 text-white/60 text-[10px] font-bold"
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="mt-8 bg-[#202c33] p-4 rounded-2xl">
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="information-circle-outline" size={20} color="#60a5fa" />
                        <Text className="text-white ml-2 font-bold">Preview</Text>
                    </View>
                    <Text className="text-[#8696a0] text-sm">
                        Selected wallpaper will be applied across all your personal and group chats.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default WallpaperSettings;
