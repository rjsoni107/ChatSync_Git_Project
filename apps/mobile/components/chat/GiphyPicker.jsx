import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useDebounce } from 'use-debounce';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 24) / 2;
const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; // Public Beta Key (safe for dev)

const GiphyPicker = ({ onSelectGif }) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 500);
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('gifs'); // gifs or stickers

    const fetchGifs = useCallback(async (query = '', currentType = 'gifs') => {
        setLoading(true);
        try {
            const apiPath = currentType === 'stickers' ? 'stickers' : 'gifs';
            const endpoint = query
                ? `https://api.giphy.com/v1/${apiPath}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
                : `https://api.giphy.com/v1/${apiPath}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;

            const response = await fetch(endpoint);
            const json = await response.json();
            setGifs(json.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGifs(debouncedSearch, type);
    }, [debouncedSearch, type, fetchGifs]);

    const renderGifItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => onSelectGif(item.images.fixed_height.url, type === 'stickers' ? 'sticker' : 'gif')}
            style={{ width: COLUMN_WIDTH, height: 120 }}
            className="m-1 rounded-lg overflow-hidden bg-[#202c33]"
        >
            <Image
                source={item.images.fixed_height.url}
                className="w-full h-full"
                contentFit="cover"
            />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#111b21]">
            <View className="flex-row items-center px-4 py-2 bg-[#202c33] rounded-full mx-4 my-2">
                <Ionicons name="search" size={20} color="#8696a0" />
                <TextInput
                    className="flex-1 ml-2 text-white text-base"
                    placeholder="Search Giphy"
                    placeholderTextColor="#8696a0"
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color="#8696a0" />
                    </TouchableOpacity>
                )}
            </View>

            <View className="flex-row px-4 mb-2">
                <TouchableOpacity
                    onPress={() => setType('gifs')}
                    className={`px-4 py-1 rounded-full mr-2 ${type === 'gifs' ? 'bg-primary' : 'bg-[#202c33]'}`}
                >
                    <Text className={`font-bold ${type === 'gifs' ? 'text-white' : 'text-[#8696a0]'}`}>GIFs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setType('stickers')}
                    className={`px-4 py-1 rounded-full ${type === 'stickers' ? 'bg-primary' : 'bg-[#202c33]'}`}
                >
                    <Text className={`font-bold ${type === 'stickers' ? 'text-white' : 'text-[#8696a0]'}`}>Stickers</Text>
                </TouchableOpacity>
            </View>

            {loading && gifs.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="small" color="#60a5fa" />
                </View>
            ) : (
                <FlatList
                    data={gifs}
                    renderItem={renderGifItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20 }}
                    ListEmptyComponent={
                        !loading && (
                            <View className="items-center justify-center mt-10">
                                <Text className="text-[#8696a0]">No GIFs found</Text>
                            </View>
                        )
                    }
                />
            )}
        </View>
    );
};

export default GiphyPicker;
