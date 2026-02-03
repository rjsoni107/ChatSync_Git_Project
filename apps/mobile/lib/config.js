// Appwrite Configuration
export const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '6820d5c9001c3f4d00b1';
export const APPWRITE_DATABASE_ID = '6820d7b6000a8d4d3b62';

// Collections
export const COLLECTIONS = {
    USERS: '6820d7c50027a3e9a8d5',
    CHATS: '6820d7d3002a0d6b8d42',
    MESSAGES: '6820d7e10012e1f0f5a3',
    PRESENCE: '6820d7f0001d5e4c4a21',
    TYPING: '6820d7fe0035b5c5e8d6',
};

// Buckets
export const BUCKETS = {
    AVATARS: '6820d80d00265f8f9b47',
    MESSAGES: '6820d81b0008c9a0c5e8',
};

// App Configuration
export const APP_CONFIG = {
    MESSAGE_PAGE_SIZE: 50,
    TYPING_TIMEOUT: 3000,
    PRESENCE_HEARTBEAT_INTERVAL: 5000,
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    IMAGE_QUALITY: 0.8,
};
