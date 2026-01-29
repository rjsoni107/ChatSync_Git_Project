import { client } from "@chatsync/api/appwrite";
import { appwriteConfig } from "@chatsync/api/config";

const DB_ID = appwriteConfig.databaseId;
const CHATS_ID = appwriteConfig.chatCollectionId;
const TYPING_STATUS_ID = appwriteConfig.typingStatusCollectionId;
const USERS_ID = appwriteConfig.userCollectionId;
const MEMBERS_ID = appwriteConfig.chatMembersCollectionId;

export const subscribeChatsRealtime = (callback) => {
    return client.subscribe(
        `databases.${DB_ID}.collections.${CHATS_ID}.documents`,
        (event) => {
            callback(event);
        }
    );
};

export const subscribeTyping = (callback) => {
    return client.subscribe(
        `databases.${DB_ID}.collections.${TYPING_STATUS_ID}.documents`,
        (event) => callback(event)
    );
};

export const subscribeUserPresence = (callback) => {
    return client.subscribe(
        `databases.${DB_ID}.collections.${USERS_ID}.documents.*`,
        (event) => callback(event)
    );
};

export const subscribeSingleUserPresence = (userId, callback) => {
    return client.subscribe(
        `databases.${DB_ID}.collections.${USERS_ID}.documents.${userId}`,
        (event) => {
            callback(event.payload);
        }
    );
};

