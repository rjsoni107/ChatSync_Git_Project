import React from 'react';
import { View, Image, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const StatusAvatar = ({
    imageUrl,
    itemsCount = 0,
    isSeen = false,
    size = 56,
    strokeWidth = 2.5,
    fallbackText = "?"
}) => {
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const innerSize = size - (strokeWidth * 2) - 4; // Margin for the ring

    // Calculation for segments
    const renderSegments = () => {
        if (itemsCount <= 1) {
            return (
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={isSeen ? "#374045" : "#25d366"}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
            );
        }

        const segments = [];
        const gap = itemsCount > 1 ? 5 : 0; // Gap in degrees
        const anglePerSegment = (360 / itemsCount);
        const activeAngle = anglePerSegment - gap;

        for (let i = 0; i < itemsCount; i++) {
            const startAngle = i * anglePerSegment - 90; // Start from top
            const endAngle = startAngle + activeAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);

            const largeArcFlag = activeAngle <= 180 ? 0 : 1;

            const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

            segments.push(
                <Path
                    key={i}
                    d={d}
                    stroke={isSeen ? "#374045" : "#25d366"}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />
            );
        }
        return segments;
    };

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                {renderSegments()}
            </Svg>
            <View
                style={{
                    width: innerSize,
                    height: innerSize,
                    borderRadius: innerSize / 2,
                    overflow: 'hidden',
                    backgroundColor: '#1a2226'
                }}
            >
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} />
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: innerSize * 0.4 }}>
                            {fallbackText[0]}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default StatusAvatar;
