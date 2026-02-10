import { View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '@chatterapp/store/useNotificationStore';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import bgColor from '../ui/bgColor';

const TabBar = ({ state, descriptors, navigation }) => {
    const user = useAuthStore(s => s.user);
    const unreadMessagesCount = useNotificationStore(s => s.unreadMessagesCount);
    const pendingRequestsCount = useNotificationStore(s => s.pendingRequestsCount);

    const getInitials = (name) => {
        if (!name) return "";
        const splitName = name.split(" ");
        if (splitName.length > 1) {
            return (splitName[0][0] + splitName[1][0]).toUpperCase();
        }
        return splitName[0][0].toUpperCase();
    };

    const nameHash = user?.name ? user?.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const colorIndex = nameHash % (bgColor.length || 1);

    const icons = {
        chats: (props) => <Ionicons name="chatbubbles-outline" size={28} {...props} />,
        search: (props) => <Ionicons name="search-outline" size={28} {...props} />,
        requests: (props) => <Ionicons name="mail-unread-outline" size={28} {...props} />,
        profile: (props) => {
            const isFocused = props.color === '#ffff';
            if (user?.profile_pic) {
                return (
                    <View className={`w-10 h-10 rounded-full overflow-hidden border-2 ${isFocused ? 'border-white' : 'border-white/40'}`}>
                        <Image source={{ uri: user.profile_pic }} className="w-full h-full" />
                    </View>
                );
            }
            return (
                <View className={`w-10 h-10 rounded-full items-center justify-center overflow-hidden border-2 ${isFocused ? 'border-white' : 'border-transparent'} ${bgColor[colorIndex]}`}>
                    <Text className="text-[#111b21] text-[12px] font-bold">
                        {getInitials(user?.name)}
                    </Text>
                </View>
            );
        },
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
                            <View className={`items-center justify-center rounded-full overflow-hidden mb-1 ${route.name === 'profile' ? '' : 'w-12 h-12'} ${isFocused && route.name !== 'profile' ? 'bg-[#2563eb]/50' : ''}`}>
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
                            {/* {route.name !== 'profile' && (
                                <Text style={{ color: isFocused ? '#ffff' : '#8696a0', fontSize: 12, fontWeight: isFocused ? '600' : '400' }}>
                                    {label}
                                </Text>
                            )} */}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
};

export default TabBar;
