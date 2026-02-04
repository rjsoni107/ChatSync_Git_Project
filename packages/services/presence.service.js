import { databases } from "@chatterapp/api/appwrite";
import { appwriteConfig } from "@chatterapp/api/config";

const DB_ID = appwriteConfig.databaseId;
const USERS_ID = appwriteConfig.userCollectionId;

export const setUserOnline = async (userId) => {
    const now = new Date().toISOString();
    return databases.updateDocument(DB_ID, USERS_ID, userId, {
        isOnline: true,
        lastSeen: now,
        lastActiveAt: now,
    });
};

export const setUserOffline = async (userId) => {
    const now = new Date().toISOString();
    return databases.updateDocument(DB_ID, USERS_ID, userId, {
        isOnline: false,
        lastSeen: now,
        lastActiveAt: now,
    });
};

export const heartbeat = async (userId) => {
    const now = new Date().toISOString();
    return databases.updateDocument(DB_ID, USERS_ID, userId, {
        lastActiveAt: now,
        lastSeen: now,
        isOnline: true,
    });
};

