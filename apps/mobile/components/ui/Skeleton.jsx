import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { styled } from 'nativewind';

const SkeletonComponent = ({ width, height, borderRadius = 4, style, backgroundColor = "#202c33" }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                { width, height, borderRadius, backgroundColor: backgroundColor },
                style,
                { opacity }
            ]}
        />
    );
};

export default styled(SkeletonComponent);
