import { client } from "@chatterapp/api/appwrite";
import { appwriteConfig } from "@chatterapp/api/config";

const DB_ID = appwriteConfig.databaseId;
const CHATS_ID = appwriteConfig.chatCollectionId;
const TYPING_STATUS_ID = appwriteConfig.typingStatusCollectionId;
const USERS_ID = appwriteConfig.userCollectionId;
const MEMBERS_ID = appwriteConfig.chatMembersCollectionId;

export const subscribeChatsRealtime = (callback) => {
    const channel = `databases.${DB_ID}.collections.${CHATS_ID}.documents`;
    console.log(`Subscribing to channel: ${channel}`);
    return client.subscribe(
        channel,
        (event) => {
            callback(event);
        }
    );
};

export const subscribeTyping = (callback) => {
    if (!DB_ID || !TYPING_STATUS_ID) {
        console.warn('Realtime: Missing DB_ID or TYPING_STATUS_ID');
        return () => { };
    }
    const channel = `databases.${DB_ID}.collections.${TYPING_STATUS_ID}.documents`;
    console.log(`Subscribing to typing: ${channel}`);
    return client.subscribe(channel, (event) => callback(event));
};

export const subscribeUserPresence = (callback) => {
    if (!DB_ID || !USERS_ID) {
        console.warn('Realtime: Missing DB_ID or USERS_ID');
        return () => { };
    }
    const channel = `databases.${DB_ID}.collections.${USERS_ID}.documents`;
    console.log(`Subscribing to presence: ${channel}`);
    return client.subscribe(channel, (event) => callback(event));
};

export const subscribeSingleUserPresence = (userId, callback) => {
    return client.subscribe(
        `databases.${DB_ID}.collections.${USERS_ID}.documents.${userId}`,
        (event) => {
            callback(event.payload);
        }
    );
};

export const subscribeChatTyping = (chatId, otherUserId, callback) => {
    if (!DB_ID || !TYPING_STATUS_ID || !chatId || !otherUserId) return () => { };

    const docId = `${chatId.slice(0, 15)}_${otherUserId.slice(0, 15)}`;
    const channel = `databases.${DB_ID}.collections.${TYPING_STATUS_ID}.documents.${docId}`;

    console.log(`Subscribing to specific typing: ${channel}`);
    return client.subscribe(channel, (event) => {
        callback(event.payload);
    });
};

export const subscribeRequests = (callback) => {
    if (!DB_ID || !appwriteConfig.chatRequestCollectionId) {
        console.warn('Realtime: Missing DB_ID or chatRequestCollectionId');
        return () => { };
    }
    const channel = `databases.${DB_ID}.collections.${appwriteConfig.chatRequestCollectionId}.documents`;
    console.log(`Subscribing to requests: ${channel}`);
    return client.subscribe(channel, (event) => callback(event));
};
