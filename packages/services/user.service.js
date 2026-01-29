import { databases, account, Query, Permission, Role, ID } from "@chatsync/api/appwrite";
import { appwriteConfig } from '../api/config';

const DB_ID = appwriteConfig.databaseId;
const USERS_ID = appwriteConfig.userCollectionId;

export const createUserProfile = async (user) => {
    const now = new Date().toISOString();
    console.log("user", user);
    const userId = user.$id;

    try {
        // 1️⃣ Try get existing profile
        const existing = await databases.getDocument(DB_ID, USERS_ID, userId);

        // Merge updates safely
        return await databases.updateDocument(DB_ID, USERS_ID, userId, {
            name: existing.name || user.name, // 🛡️ Keep DB name if it exists
            email: existing.email || user.email,
            isOnline: true,
            lastSeen: now,
            lastActiveAt: now,
            // DO NOT include about or profile_pic here to avoid overwriting them with undefined
        });

    } catch (err) {
        if (err.code !== 404) throw err;

        try {
            // 2️⃣ Try create new profile
            return await databases.createDocument(
                DB_ID,
                USERS_ID,
                userId,
                {
                    userId,
                    name: user.name,
                    email: user.email,
                    profile_pic: "",
                    about: "",
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
            // 🧠 VERY IMPORTANT: Concurrent creation handling
            if (createErr.code === 409) {
                await new Promise(r => setTimeout(r, 200));
                const existing = await databases.getDocument(DB_ID, USERS_ID, userId);

                return await databases.updateDocument(DB_ID, USERS_ID, userId, {
                    name: existing.name || user.name,
                    email: existing.email || user.email,
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
    // 1️⃣ Update database profile
    const profile = await databases.updateDocument(DB_ID, USERS_ID, userId, updates);

    // 2️⃣ Sync name with Appwrite Account if changed
    if (updates.name) {
        try {
            await account.updateName(updates.name);
        } catch (err) {
            console.warn("Could not sync name with Appwrite account:", err.message);
        }
    }

    return profile;
};

export const logout = async () => {
    return await account.deleteSession("current");
};

