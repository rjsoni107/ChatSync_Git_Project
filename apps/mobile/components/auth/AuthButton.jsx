import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import React from 'react';

const AuthButton = ({ title, onPress, loading, disabled, variant = 'primary' }) => {
    const isPrimary = variant === 'primary';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading || disabled}
            className={`w-full h-14 rounded-xl items-center justify-center mb-4 ${isPrimary
                    ? (loading || disabled ? 'bg-[#00a884]/50' : 'bg-[#00a884]')
                    : 'bg-transparent'
                }`}
        >
            {loading ? (
                <ActivityIndicator color="#ffffff" />
            ) : (
                <Text className={`text-base font-bold ${isPrimary ? 'text-[#111b21]' : 'text-[#00a884]'}`}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

export default AuthButton;
