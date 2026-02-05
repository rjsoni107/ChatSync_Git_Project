import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import React from 'react';

const AuthButton = ({ title, onPress, loading, disabled, variant = 'primary' }) => {
    const isPrimary = variant === 'primary';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading || disabled}
            className={`w-full h-14 rounded-xl items-center justify-center mb-4 ${isPrimary
                ? (loading || disabled ? 'bg-primary/50' : 'bg-primary')
                : 'bg-transparent'
                }`}
        >
            {loading ? (
                <ActivityIndicator color="#ffffff" />
            ) : (
                <Text className={`text-base font-bold ${isPrimary ? 'text-white' : 'text-secondary'}`}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

export default AuthButton;
