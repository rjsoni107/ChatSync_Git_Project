import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createPoll } from '@chatterapp/services/message.service';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const CreatePoll = () => {
    const { chatId } = useLocalSearchParams();
    const router = useRouter();
    const user = useAuthStore(s => s.user);
    const showAlert = useAlertStore(s => s.showAlert);

    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [loading, setLoading] = useState(false);

    const handleAddOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (text, index) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const handleCreatePoll = async () => {
        const validOptions = options.filter(o => o.trim().length > 0);

        if (!question.trim()) {
            showAlert('Error', 'Please enter a question');
            return;
        }
        if (validOptions.length < 2) {
            showAlert('Error', 'Please provide at least 2 options');
            return;
        }

        setLoading(true);
        try {
            await createPoll({
                chatId,
                senderId: user.$id,
                question: question.trim(),
                options: validOptions
            });
            router.back();
        } catch (error) {
            console.error('Failed to create poll:', error);
            showAlert('Error', 'Failed to create poll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="flex-row items-center px-4 py-3 border-b border-[#202c33]">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="close" size={24} color="#60a5fa" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold flex-1">Create Poll</Text>
                <TouchableOpacity
                    onPress={handleCreatePoll}
                    disabled={loading}
                    className="bg-primary px-4 py-1.5 rounded-full"
                >
                    {loading ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-bold">Create</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                <Text className="text-[#8696a0] text-xs font-bold uppercase mb-2">Question</Text>
                <TextInput
                    className="bg-[#202c33] text-white p-4 rounded-xl text-base mb-6"
                    placeholder="Enter pool question"
                    placeholderTextColor="#8696a0"
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                />

                <Text className="text-[#8696a0] text-xs font-bold uppercase mb-2">Options</Text>
                {options.map((opt, index) => (
                    <View key={index} className="flex-row items-center mb-3">
                        <View className="flex-1 bg-[#202c33] rounded-xl flex-row items-center px-4">
                            <TextInput
                                className="flex-1 text-white py-3 text-base"
                                placeholder={`Option ${index + 1}`}
                                placeholderTextColor="#8696a0"
                                value={opt}
                                onChangeText={(text) => updateOption(text, index)}
                            />
                            {options.length > 2 && (
                                <TouchableOpacity onPress={() => handleRemoveOption(index)}>
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}

                {options.length < 10 && (
                    <TouchableOpacity
                        onPress={handleAddOption}
                        className="flex-row items-center p-3 mt-2"
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#60a5fa" />
                        <Text className="color-[#60a5fa] font-bold ml-2">Add Option</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default CreatePoll;
