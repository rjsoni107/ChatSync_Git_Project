import React from 'react';
import { View } from 'react-native';
import Skeleton from '../ui/Skeleton';

const ChatListSkeleton = () => {
    return (
        <View className="flex-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <View key={i} className="flex-row items-center px-4 py-3 border-b border-[#202c33]/50">
                    {/* Avatar */}
                    <Skeleton width={56} height={56} borderRadius={28} />

                    <View className="flex-1 ml-4 justify-center">
                        <View className="flex-row justify-between items-center mb-2">
                            {/* Name */}
                            <Skeleton width={120} height={16} borderRadius={8} />
                            {/* Time */}
                            <Skeleton width={40} height={12} borderRadius={6} />
                        </View>

                        {/* Last Message */}
                        <Skeleton width="80%" height={14} borderRadius={7} />
                    </View>
                </View>
            ))}
        </View>
    );
};

export default ChatListSkeleton;
