import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const TabBar = ({ state, descriptors, navigation }) => {
    const icons = {
        chats: (props) => <Ionicons name="chatbubbles-outline" size={24} {...props} />,
        search: (props) => <Ionicons name="search-outline" size={24} {...props} />,
        requests: (props) => <Ionicons name="mail-unread-outline" size={24} {...props} />,
        profile: (props) => <Ionicons name="person-outline" size={24} {...props} />,
    };

    return (
        <SafeAreaView edges={['bottom']} className="bg-surface border-t border-white/5">
            <View className="flex-row h-16 items-center justify-around px-4">
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.name}
                            onPress={onPress}
                            className="items-center justify-center flex-1"
                        >
                            <View className={`w-14 h-8 items-center justify-center rounded-full mb-1 ${isFocused ? 'bg-[#2563eb]/30' : ''}`}>
                                {icons[route.name] ? icons[route.name]({ color: isFocused ? '#3b82f6' : '#8696a0' }) : null}
                            </View>
                            <Text style={{ color: isFocused ? '#3b82f6' : '#8696a0', fontSize: 12, fontWeight: isFocused ? '600' : '400' }}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
};

export default TabBar;
