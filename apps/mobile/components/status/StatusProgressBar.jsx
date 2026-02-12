import React from 'react';
import { View, Animated } from 'react-native';

const StatusProgressBar = ({ items, currentItemIndex, progress }) => {
    return (
        <View className="flex-row px-2 pt-2 space-x-1">
            {items.map((_, index) => (
                <View key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <Animated.View
                        className="h-full bg-white"
                        style={{
                            width: index === currentItemIndex
                                ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                                : index < currentItemIndex ? '100%' : '0%'
                        }}
                    />
                </View>
            ))}
        </View>
    );
};

export default StatusProgressBar;
