import { useEffect } from 'react';
import { realtimeService } from '@chatterapp/services/realtime.service';

export const useRealtime = () => {
    useEffect(() => {
        const unsubscribe = realtimeService.subscribeToMessages((message) => {
            console.log('New message:', message);
        });
        return () => unsubscribe();
    }, []);
};
