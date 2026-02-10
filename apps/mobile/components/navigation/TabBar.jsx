import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '@chatterapp/store/useNotificationStore';

const TabBar = ({ state, descriptors, navigation }) => {
    const unreadMessagesCount = useNotificationStore(s => s.unreadMessagesCount);
    const pendingRequestsCount = useNotificationStore(s => s.pendingRequestsCount);

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
                            <View className={`w-14 h-8 items-center justify-center rounded-full overflow-hidden mb-1 ${isFocused ? 'bg-[#2563eb]/50' : ''}`}>
                                {icons[route.name] ? icons[route.name]({ color: isFocused ? '#ffff' : '#8696a0' }) : null}

                                {/* Badge */}
                                {((route.name === 'chats' && unreadMessagesCount > 0) ||
                                    (route.name === 'requests' && pendingRequestsCount > 0)) && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                top: -2,
                                                right: 8,
                                                backgroundColor: '#ef4444',
                                                borderRadius: 10,
                                                minWidth: 18,
                                                height: 18,
                                                paddingHorizontal: 4,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderWidth: 1.5,
                                                borderColor: '#1c2932'
                                            }}
                                        >
                                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                                {route.name === 'chats' ? unreadMessagesCount : pendingRequestsCount}
                                            </Text>
                                        </View>
                                    )}
                            </View>
                            <Text style={{ color: isFocused ? '#ffff' : '#8696a0', fontSize: 12, fontWeight: isFocused ? '600' : '400' }}>
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
