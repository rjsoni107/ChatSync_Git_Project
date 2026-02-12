import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ViewersList = ({ visible, onClose, viewers, loading }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-[#1c2932] rounded-t-3xl h-[60%] p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-bold">Viewed by</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#60a5fa" />
                        </View>
                    ) : viewers.length > 0 ? (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {viewers.map(profile => (
                                <View key={profile.userId} className="flex-row items-center mb-4">
                                    <View className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden">
                                        {profile.profile_pic ? (
                                            <Image source={{ uri: profile.profile_pic }} className="w-full h-full" />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center">
                                                <Ionicons name="person" size={20} color="#8696a0" />
                                            </View>
                                        )}
                                    </View>
                                    <View className="ml-3">
                                        <Text className="text-white font-bold">{profile.name}</Text>
                                        <Text className="text-gray-400 text-xs">@{profile.username}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View className="items-center justify-center py-10">
                            <Ionicons name="eye-off-outline" size={40} color="#374045" />
                            <Text className="text-gray-400 mt-2">No views yet</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default ViewersList;
