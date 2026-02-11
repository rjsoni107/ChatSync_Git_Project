import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const AuthInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize = 'none',
    error,
    containerClassName,
    icon,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View className="mb-4 w-full">
            {label && <Text className="text-gray-300 mb-2 font-medium">{label}</Text>}
            <View className={`flex-row items-center border ${error ? 'border-red-500' : 'border-transparent'} rounded-xl px-4 ${containerClassName || 'bg-surface h-14'}`}>
                {icon && <View className="mr-1">{icon}</View>}
                <TextInput
                    className="flex-1 text-white text-base"
                    style={secureTextEntry && !showPassword && value ? { letterSpacing: 5, fontSize: 20, paddingBottom: 8 } : {}}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#8696a0"
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    {...props}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="ml-2"
                    >
                        <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={24}
                            color="#8696a0"
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
        </View>
    );
};

export default AuthInput;
