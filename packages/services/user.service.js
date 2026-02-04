import { databases, account, Query, Permission, Role, ID } from "@chatterapp/api/appwrite";
import { appwriteConfig } from '../api/config';

const DB_ID = appwriteConfig.databaseId;
const USERS_ID = appwriteConfig.userCollectionId;

export const checkUsernameAvailability = async (username) => {
    try {
        const res = await databases.listDocuments(DB_ID, USERS_ID, [
            Query.equal("username", username.toLowerCase())
        ]);
        return res.total === 0;
    } catch (err) {
        return false;
    }
};

export const generateUniqueUsername = async (name) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    let username = `${base}${Math.floor(Math.random() * 900) + 100}`;

    // Check if exists, if so try again (max 3 tries for simplicity in generation)
    let isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
        username = `${base}${Math.floor(Math.random() * 9000) + 1000}`;
    }
    return username;
};

export const createUserProfile = async (user) => {
    const now = new Date().toISOString();
    const userId = user.$id;

    try {
        // 1️⃣ Try get existing profile
        const existing = await databases.getDocument(DB_ID, USERS_ID, userId);

        const updates = {
            name: existing.name || user.name,
            email: existing.email || user.email,
            isOnline: true,
            lastSeen: now,
            lastActiveAt: now,
        };

        // ✨ Generate username for old users if missing
        if (!existing.username) {
            updates.username = await generateUniqueUsername(user.name);
        }

        // Merge updates safely
        return await databases.updateDocument(DB_ID, USERS_ID, userId, updates);

    } catch (err) {
        if (err.code !== 404) throw err;

        try {
            // 2️⃣ Generate a unique username for the first time
            const username = await generateUniqueUsername(user.name);

            // 3️⃣ Create new profile
            return await databases.createDocument(
                DB_ID,
                USERS_ID,
                userId,
                {
                    userId,
                    name: user.name,
                    email: user.email,
                    username: username, // ✨ NEW
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
    if (!keyword) return [];

    try {
        const res = await databases.listDocuments(DB_ID, USERS_ID, [
            Query.or([
                Query.startsWith("name", keyword),
                Query.startsWith("username", keyword),
                Query.contains("name", keyword),
                Query.contains("username", keyword),
            ]),
            Query.notEqual("userId", currentUserId),
            Query.limit(20)
        ]);

        return res.documents;
    } catch (err) {
        console.error("Search failed:", err);
        return [];
    }
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

