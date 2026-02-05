import { View, TextInput } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText, placeholder = "Search chats..." }) => {
    return (
        <View className="px-4 py-2">
            <View className="flex-row items-center bg-surface rounded-full px-4 h-11 border border-transparent focus:border-primary">
                <Ionicons name="search" size={18} color="#8696a0" />
                <TextInput
                    className="flex-1 ml-2 text-white text-base"
                    placeholder={placeholder}
                    placeholderTextColor="#8696a0"
                    value={value}
                    onChangeText={onChangeText}
                    selectionColor="#2563eb"
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
