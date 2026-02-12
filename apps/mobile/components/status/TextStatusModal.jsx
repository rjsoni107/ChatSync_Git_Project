import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BG_COLORS = ['#1a2a33', '#833ab4', '#fd1d1d', '#fcb045', '#405de6', '#5851db', '#34a853', '#ea4335', '#25d366'];

const TextStatusModal = ({
    visible,
    onClose,
    text,
    onTextChange,
    selectedBg,
    onBgChange,
    onUpload
}) => {
    return (
        <Modal visible={visible} animationType="slide">
            <SafeAreaView className="flex-1" style={{ backgroundColor: selectedBg }}>
                <View className="p-4 flex-row justify-between items-center">
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onUpload}
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
                        value={text}
                        onChangeText={onTextChange}
                        autoFocus
                    />
                </View>
                <View className="p-6">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {BG_COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                onPress={() => onBgChange(color)}
                                className="w-10 h-10 rounded-full mr-3 border-2 border-white/50"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default TextStatusModal;
