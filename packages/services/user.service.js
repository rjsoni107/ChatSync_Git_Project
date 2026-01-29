//user.service.js
import { databases, Query, Permission, Role, ID } from "@chatsync/api/appwrite";
import { appwriteConfig } from '../api/config';

const DB_ID = appwriteConfig.databaseId;
const USERS_ID = appwriteConfig.userCollectionId;

export const createUserProfile = async (user) => {
    const now = new Date().toISOString();
    console.log("user", user);
    const userId = user.$id;

    try {
        // 1️⃣ Try get
        await databases.getDocument(DB_ID, USERS_ID, userId);

        return await databases.updateDocument(DB_ID, USERS_ID, userId, {
            name: user.name,
            email: user.email,
            isOnline: true,
            lastSeen: now,
            lastActiveAt: now,
        });

    } catch (err) {
        if (err.code !== 404) throw err;

        try {
            // 2️⃣ Try create
            return await databases.createDocument(
                DB_ID,
                USERS_ID,
                userId,
                {
                    userId,
                    name: user.name,
                    email: user.email,
                    avatar: "",
                    isOnline: true,
                    lastSeen: now,
                    lastActiveAt: now,
                    createdAt: now,
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                ]
            );
        } catch (createErr) {
            // 🧠 VERY IMPORTANT
            if (createErr.code === 409) {
                // wait a bit for permissions to settle
                await new Promise(r => setTimeout(r, 200));

                await databases.getDocument(DB_ID, USERS_ID, userId);

                return await databases.updateDocument(DB_ID, USERS_ID, userId, {
                    name: user.name,
                    email: user.email,
                    isOnline: true,
                    lastSeen: now,
                    lastActiveAt: now,
                });
            }

            throw createErr;
        }
    }
};

export const searchUsers = async (keyword, currentUserId) => {
    const res = await databases.listDocuments(DB_ID, USERS_ID, [
        Query.search("name", keyword),
        Query.notEqual("userId", currentUserId),
    ]);

    return res.documents;
};

export const getUserProfile = async (userId) => {
    return await databases.getDocument(DB_ID, USERS_ID, userId);
};

export const updateUserProfile = async (userId, updates) => {
    return await databases.updateDocument(DB_ID, USERS_ID, userId, updates);
};

export const logout = async () => {
    return await account.deleteSession("current");
};

