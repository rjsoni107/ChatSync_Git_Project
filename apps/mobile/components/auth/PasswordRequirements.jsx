import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PasswordRequirements = ({ password }) => {
    const requirements = [
        { label: 'At least 8 characters', test: (p) => p.length >= 8 },
        { label: 'At least one number', test: (p) => /\d/.test(p) },
        { label: 'At least one special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];

    if (!password) return null;

    return (
        <View className="mb-4 px-1">
            {requirements.map((req, index) => {
                const isMet = req.test(password);
                return (
                    <View key={index} className="flex-row items-center mt-1">
                        <Ionicons
                            name={isMet ? "checkmark-circle" : "close-circle"}
                            size={14}
                            color={isMet ? "#2ecc71" : "#e74c3c"}
                        />
                        <Text className={`ml-2 text-xs ${isMet ? 'text-[#2ecc71]' : 'text-[#e74c3c]'}`}>
                            {req.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

export default PasswordRequirements;
