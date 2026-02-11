import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateUserProfile } from '@chatterapp/services/user.service';
import { useAlertStore } from '@chatterapp/store/useAlertStore';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const registerForPushNotificationsAsync = async (userId) => {
    let token;

    if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        useAlertStore.getState().showAlert('Failed to get push token for push notification!');
        return;
    }

    try {
        token = (await Notifications.getExpoPushTokenAsync({
            // projectId: 'your-project-id', // Optional: Add if using EAS
        })).data;

        console.log('Push Token:', token);

        if (userId) {
            try {
                await updateUserProfile(userId, { pushToken: token });
                console.log('Push token successfully saved to Appwrite profile');
            } catch (err) {
                console.error('Failed to save push token to Appwrite profile. Please ensure the "pushToken" attribute exists in your Users collection:', err.message);
            }
        }
    } catch (error) {
        console.error('Error getting push token:', error);
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
};

export const setupNotificationListeners = (onNotificationTap) => {
    // This is called when a notification is received while the app is in the foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification Received:', notification);
    });

    // This is called when a user taps on or interacts with a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification Response:', response);
        const chatId = response.notification.request.content.data?.chatId;
        if (chatId && onNotificationTap) {
            onNotificationTap(chatId);
        }
    });

    return () => {
        notificationListener.remove();
        responseListener.remove();
    };
};
