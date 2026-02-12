import { databases, storage, Query, ID, Permission, Role } from "@chatterapp/api/appwrite";
import { appwriteConfig } from '../api/config';

const DB_ID = appwriteConfig.databaseId;
const BUCKET_ID = appwriteConfig.bucketId;
const STATUS_ID = appwriteConfig.statusCollectionId;

/**
 * Upload a media file and create a status document
 */
export const createStatus = async ({ userId, userName, userProfilePic, file, caption = "", type = "image", bgColor = "" }) => {
    try {
        let mediaUrl = "";
        let fileId = "";

        // 1. Upload file if it's an image or video
        if (file && (type === "image" || type === "video")) {
            const uploadedFile = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                file
            );
            fileId = uploadedFile.$id;
            // Mobile-specific preview URL construction
            mediaUrl = `${appwriteConfig.endpoint}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;
        }

        // 2. Create document
        const now = new Date();
        return await databases.createDocument(
            DB_ID,
            STATUS_ID,
            ID.unique(),
            {
                userId,
                userName,
                userProfilePic,
                mediaUrl,
                fileId,
                caption,
                type,
                bgColor,
                viewers: [], // Initialize empty viewers list
                createdAt: now.toISOString(),
                expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // 24 hours later
            },
            [
                Permission.read(Role.any()),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ]
        );
    } catch (error) {
        console.error("Error creating status:", error);
        throw error;
    }
};

/**
 * Mark a status as seen by a user
 */
export const markStatusSeen = async (statusId, userId) => {
    try {
        // We use a try-catch for the case where the user is already in the array
        // Appwrite doesn't have a built-in 'if not exists' for updateDocument easily in some SDKs
        // But for viewers list, we can fetch first or just try to append.
        const doc = await databases.getDocument(DB_ID, STATUS_ID, statusId);
        if (doc.viewers && doc.viewers.includes(userId)) return;

        return await databases.updateDocument(
            DB_ID,
            STATUS_ID,
            statusId,
            {
                viewers: [...(doc.viewers || []), userId]
            }
        );
    } catch (error) {
        console.error("Error marking status seen:", error);
    }
};

/**
 * Get all active statuses (from last 24 hours)
 */
export const getRecentStatuses = async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
        const res = await databases.listDocuments(
            DB_ID,
            STATUS_ID,
            [
                Query.greaterThan("createdAt", yesterday),
                Query.orderDesc("createdAt"),
                Query.limit(100)
            ]
        );

        // Group by userId so one user shows as one "bubble" in UI
        const grouped = {};
        res.documents.forEach(doc => {
            if (!grouped[doc.userId]) {
                grouped[doc.userId] = {
                    userId: doc.userId,
                    userName: doc.userName,
                    userProfilePic: doc.userProfilePic,
                    items: []
                };
            }
            grouped[doc.userId].items.push(doc);
        });

        return Object.values(grouped);
    } catch (error) {
        console.error("Error fetching statuses:", error);
        return [];
    }
};

/**
 * Delete a status
 */
export const deleteStatus = async (statusId, fileId) => {
    try {
        await databases.deleteDocument(DB_ID, STATUS_ID, statusId);
        if (fileId) {
            await storage.deleteFile(BUCKET_ID, fileId);
        }
        return true;
    } catch (error) {
        console.error("Error deleting status:", error);
        throw error;
    }
};
/**
 * Add a status to a highlight
 */
export const addToHighlight = async (statusId, highlightName) => {
    try {
        return await databases.updateDocument(
            DB_ID,
            STATUS_ID,
            statusId,
            {
                isHighlight: true,
                highlightName: highlightName
            }
        );
    } catch (error) {
        console.error("Error adding to highlight:", error);
        throw error;
    }
};

/**
 * Get all highlights for a user
 */
export const getUserHighlights = async (userId) => {
    try {
        const res = await databases.listDocuments(
            DB_ID,
            STATUS_ID,
            [
                Query.equal("userId", userId),
                Query.equal("isHighlight", true),
                Query.orderDesc("createdAt")
            ]
        );

        // Group by highlightName
        const grouped = {};
        res.documents.forEach(doc => {
            const name = doc.highlightName || "Highlights";
            if (!grouped[name]) {
                grouped[name] = {
                    name: name,
                    coverUrl: doc.mediaUrl || "", // Use last added item as cover
                    items: []
                };
            }
            grouped[name].items.push(doc);
        });

        return Object.values(grouped);
    } catch (error) {
        console.error("Error fetching highlights:", error);
        return [];
    }
};
