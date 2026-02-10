import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@chatterapp/store/useAuthStore';
import { useNotificationStore } from '@chatterapp/store/useNotificationStore';
import { getReceivedRequests, updateRequestStatus } from '@chatterapp/services/request.service';
import { subscribeRequests } from '@chatterapp/services/realtime.service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import bgColor from '../../components/ui/bgColor';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

const Requests = () => {
    const user = useAuthStore((s) => s.user);
    const showAlert = useAlertStore((s) => s.showAlert);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const fetchRequests = useCallback(async (isRefresh = false, isSilent = false) => {
        if (!user?.$id) return;
        if (isRefresh) setRefreshing(true);
        else if (!isSilent) setLoading(true);

        try {
            const data = await getReceivedRequests(user.$id);
            setRequests(data);
            useNotificationStore.getState().setPendingRequestsCount(data.length);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.$id]);

    useEffect(() => {
        if (!user?.$id) return;
        fetchRequests();

        // Subscribe to real-time request updates
        const unsubscribe = subscribeRequests(() => {
            fetchRequests(false, true); // Silent refresh
        });

        return () => unsubscribe();
    }, [fetchRequests, user?.$id]);

    const handleAction = async (requestId, status) => {
        setProcessingId(requestId);
        try {
            await updateRequestStatus(requestId, status);
            showAlert("Success", `Request ${status === 'accepted' ? 'accepted' : 'ignored'}.`);
            fetchRequests();
        } catch (error) {
            showAlert("Error", "Failed to update request.");
        } finally {
            setProcessingId(null);
        }
    };

    const renderRequestItem = ({ item }) => {
        const sender = item.sender;
        const nameHash = sender?.name ? sender.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
        const colorIndex = nameHash % (bgColor.length || 1);

        return (
            <View className="flex-row items-center px-4 py-3 border-b border-white/5 bg-surface/30">
                {/* Avatar */}
                <View className={`w-12 h-12 rounded-full items-center justify-center overflow-hidden ${bgColor[colorIndex]}`}>
                    {sender?.profile_pic ? (
                        <Image source={{ uri: sender.profile_pic }} className="w-full h-full" />
                    ) : sender?.avatar ? (
                        <Image source={{ uri: sender.avatar }} className="w-full h-full" />
                    ) : (
                        <Text className="text-black text-lg font-bold">
                            {sender?.name?.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>

                {/* Info */}
                <View className="flex-1 ml-3">
                    <Text className="text-white font-bold text-base">{sender?.name}</Text>
                    <Text className="text-gray-400 text-sm">@{sender?.username || 'user'}</Text>
                </View>

                {/* Actions */}
                <View className="flex-row">
                    <TouchableOpacity
                        onPress={() => handleAction(item.$id, 'accepted')}
                        disabled={!!processingId}
                        className="bg-secondary px-3 py-1.5 rounded-lg mr-2 flex-row items-center"
                    >
                        {processingId === item.$id ? (
                            <ActivityIndicator size="small" color="#f3f3f3" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={18} color="#f3f3f3" />
                                <Text className="text-[#f3f3f3] font-bold ml-1">Accept</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleAction(item.$id, 'rejected')}
                        disabled={!!processingId}
                        className="bg-surface border border-red-500/50 px-3 py-1.5 rounded-lg flex-row items-center"
                    >
                        <Ionicons name="close" size={18} color="#ef4444" />
                        {/* <Text className="text-red-500 font-bold ml-1">Ignore</Text> */}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#111b21]">
            <View className="px-4 py-3 border-b border-white/5">
                <Text className="text-white text-2xl font-bold">Chat Requests</Text>
                <Text className="text-gray-400 text-sm mt-1">Accept requests to start chatting</Text>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.$id}
                    renderItem={renderRequestItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchRequests(true)}
                            tintColor="#2563eb"
                        />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center pt-20 px-10">
                            <Ionicons name="mail-unread-outline" size={80} color="#202c33" />
                            <Text className="text-white text-xl font-bold mt-4 text-center">
                                No pending requests
                            </Text>
                            <Text className="text-gray-400 text-center mt-2">
                                When someone wants to chat with you, their request will appear here.
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

export default Requests;
