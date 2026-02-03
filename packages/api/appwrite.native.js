console.log('Appwrite: Initializing Native SDK');
import { Client, Account, Databases, Storage, Query, ID, Permission, Role } from 'react-native-appwrite';
import { appwriteConfig } from './config';

export const client = new Client();

const endpoint = appwriteConfig.endpoint;
const projectId = appwriteConfig.projectId;

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setPlatform('host.exp.exponent');

// Try to use AsyncStorage for mobile persistence
let storageSet = false;
try {
    // For React Native / Expo, this is the standard way to import AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage) {
        client.setStorage(AsyncStorage);
        storageSet = true;
        console.log('Appwrite: AsyncStorage initialized');
    } else {
        // Fallback for some environments
        const AsyncStorageAlt = require('@react-native-async-storage/async-storage');
        if (AsyncStorageAlt) {
            client.setStorage(AsyncStorageAlt);
            storageSet = true;
            console.log('Appwrite: AsyncStorage (alt) initialized');
        }
    }
} catch (e) {
    console.warn('Appwrite: AsyncStorage not found, sessions will not persist across restarts');
}

if (!storageSet) {
    console.warn('Appwrite: No storage provider set. Realtime might fail if not authenticated.');
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { Query, ID, Permission, Role };
