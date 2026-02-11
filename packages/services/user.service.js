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

export const getUserByUsername = async (username) => {
    try {
        const res = await databases.listDocuments(DB_ID, USERS_ID, [
            Query.equal("username", username.toLowerCase())
        ]);
        if (res.total > 0) return res.documents[0];
        return null;
    } catch (err) {
        console.error("Error finding user by username:", err);
        return null;
    }
};

export const generateUniqueUsername = async (name) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    let username = `${base}${Math.floor(Math.random() * 900) + 100}`;

    // Check if exists, if so try again
    let isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
        username = `${base}${Math.floor(Math.random() * 9000) + 1000}`;
    }
    return username;
};

export const getUsernameSuggestions = async (username) => {
    const base = username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    const suggestions = new Set();

    while (suggestions.size < 3) {
        const variant = Math.random() > 0.5
            ? `${base}_${Math.floor(Math.random() * 99) + 1}`
            : `${base}.${Math.floor(Math.random() * 99) + 1}`;

        const isAvailable = await checkUsernameAvailability(variant);
        if (isAvailable) suggestions.add(variant);
    }

    return Array.from(suggestions);
};

export const createUserProfile = async (user, customUsername) => {
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
            // 2️⃣ Use custom username or generate a unique one
            const finalUsername = customUsername || await generateUniqueUsername(user.name);

            // 3️⃣ Create new profile
            return await databases.createDocument(
                DB_ID,
                USERS_ID,
                userId,
                {
                    userId,
                    name: user.name,
                    email: user.email,
                    username: finalUsername, // ✨ NEW
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

export const deleteUserProfile = async (userId) => {
    return await databases.deleteDocument(DB_ID, USERS_ID, userId);
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
const BLOCKS_ID = appwriteConfig.blocksCollectionId;

export const blockUser = async (userId, blockedUserId) => {
    if (!userId || !blockedUserId) return;
    try {
        return await databases.createDocument(
            DB_ID,
            BLOCKS_ID,
            ID.unique(),
            {
                userId,
                blockedUserId,
                createdAt: new Date().toISOString(),
            }
        );
    } catch (error) {
        console.error("Error blocking user:", error);
        throw error;
    }
};

export const unblockUser = async (userId, blockedUserId) => {
    if (!userId || !blockedUserId) return;
    try {
        const res = await databases.listDocuments(DB_ID, BLOCKS_ID, [
            Query.equal("userId", userId),
            Query.equal("blockedUserId", blockedUserId),
        ]);

        if (res.total > 0) {
            await databases.deleteDocument(DB_ID, BLOCKS_ID, res.documents[0].$id);
        }
        return true;
    } catch (error) {
        console.error("Error unblocking user:", error);
        throw error;
    }
};

export const isUserBlocked = async (userId, blockedUserId) => {
    if (!userId || !blockedUserId) return false;
    try {
        const res = await databases.listDocuments(DB_ID, BLOCKS_ID, [
            Query.equal("userId", userId),
            Query.equal("blockedUserId", blockedUserId),
        ]);
        return res.total > 0;
    } catch (error) {
        console.error("Error checking block status:", error);
        return false;
    }
};
