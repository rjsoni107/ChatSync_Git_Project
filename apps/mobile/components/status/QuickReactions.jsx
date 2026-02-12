import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

const REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '🔥'];

const QuickReactions = ({ onReact }) => {
    return (
        <View className="flex-row justify-around w-full py-4 px-2">
            {REACTIONS.map(emoji => (
                <TouchableOpacity
                    key={emoji}
                    onPress={() => onReact(emoji)}
                    className="bg-white/10 p-3 rounded-full"
                >
                    <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default QuickReactions;
