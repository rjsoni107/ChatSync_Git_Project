import { View, TextInput } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText, placeholder = "Search chats..." }) => {
    return (
        <View className="px-4 py-2">
            <View className="flex-row items-center bg-[#202c33] rounded-full px-4 h-11 border border-transparent focus:border-[#00a884]">
                <Ionicons name="search-outline" size={20} color="#8696a0" />
                <TextInput
                    className="flex-1 text-white text-base ml-2 pt-0 pb-0"
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#8696a0"
                    selectionColor="#00a884"
                />
                {value ? (
                    <Ionicons
                        name="close-circle"
                        size={20}
                        color="#8696a0"
                        onPress={() => onChangeText('')}
                    />
                ) : null}
            </View>
        </View>
    );
};

export default SearchBar;
