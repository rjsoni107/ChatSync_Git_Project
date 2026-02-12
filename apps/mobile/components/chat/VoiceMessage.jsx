import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getMobileFilePreview } from '@chatterapp/services/storage.service';

const VoiceMessage = ({ fileId, duration, isMe }) => {
    const audioUrl = getMobileFilePreview(fileId);
    const player = useAudioPlayer(audioUrl);
    const status = useAudioPlayerStatus(player);

    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        setIsPlaying(status.playing);
    }, [status.playing]);

    const togglePlayback = () => {
        if (status.playing) {
            player.pause();
        } else {
            if (status.playbackState === 'ended') {
                player.seekTo(0);
            }
            player.play();
        }
    };

    const formatTime = (millis) => {
        const totalSeconds = millis / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = status.duration > 0 ? (status.currentTime / status.duration) : 0;

    return (
        <View className="flex-row items-center py-2 px-1 min-w-[200px]">
            <TouchableOpacity
                onPress={togglePlayback}
                className={`w-10 h-10 rounded-full items-center justify-center ${isMe ? 'bg-white/20' : 'bg-primary/20'}`}
            >
                {status.isBuffering ? (
                    <ActivityIndicator size="small" color={isMe ? "white" : "#00a884"} />
                ) : (
                    <Ionicons
                        name={status.playing ? "pause" : "play"}
                        size={24}
                        color={isMe ? "white" : "#00a884"}
                        style={{ marginLeft: status.playing ? 0 : 3 }}
                    />
                )}
            </TouchableOpacity>

            <View className="flex-1 ml-3 justify-center">
                {/* Waveform placeholder / Progress bar */}
                <View className="h-1 bg-gray-500/30 rounded-full overflow-hidden">
                    <View
                        style={{ width: `${progress * 100}%` }}
                        className={`h-full ${isMe ? 'bg-white' : 'bg-primary'}`}
                    />
                </View>

                <View className="flex-row justify-between mt-1">
                    <Text className="text-[10px] text-[#bcc4bc]">
                        {formatTime(status.currentTime)}
                    </Text>
                    <Text className="text-[10px] text-[#bcc4bc]">
                        {formatTime(status.duration || duration)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default VoiceMessage;
