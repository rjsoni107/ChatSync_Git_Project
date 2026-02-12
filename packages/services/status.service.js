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
export const getRecentStatuses = async (currentUserId, mutedUserIds = []) => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
        // 1. Fetch all recent statuses
        const res = await databases.listDocuments(
            DB_ID,
            STATUS_ID,
            [
                Query.greaterThan("createdAt", yesterday),
                Query.orderDesc("createdAt"),
                Query.limit(100)
            ]
        );

        if (res.total === 0) return [];

        const statusDocs = res.documents;
        const potentialOwnerIds = [...new Set(statusDocs.map(d => d.userId))];

        // 2. Fetch privacy settings for these owners
        const ownersRes = await databases.listDocuments(
            DB_ID,
            appwriteConfig.userCollectionId,
            [
                Query.equal("userId", potentialOwnerIds),
                Query.limit(potentialOwnerIds.length)
            ]
        );
        const ownersMap = {};
        ownersRes.documents.forEach(o => ownersMap[o.userId] = o);

        // 3. Fetch current user's contacts (people they have chats with)
        const memberships = await databases.listDocuments(
            DB_ID,
            appwriteConfig.chatMembersCollectionId,
            [Query.equal("userId", currentUserId), Query.limit(100)]
        );
        const myChatIds = memberships.documents.map(m => m.chatId);

        let contactIds = [];
        if (myChatIds.length > 0) {
            const allMemberships = await databases.listDocuments(
                DB_ID,
                appwriteConfig.chatMembersCollectionId,
                [Query.equal("chatId", myChatIds), Query.limit(100)]
            );
            contactIds = [...new Set(allMemberships.documents.map(m => m.userId))];
        }

        // 4. Process and Filter
        const grouped = {};
        statusDocs.forEach(doc => {
            const owner = ownersMap[doc.userId];
            const privacy = owner?.statusPrivacy || "everyone";

            // Privacy check:
            // - IT'S ME
            // - OR it's EVERYONE
            // - OR it's CONTACTS and I'm a contact
            const canSee = doc.userId === currentUserId ||
                privacy === "everyone" ||
                (privacy === "contacts" && contactIds.includes(doc.userId));

            if (!canSee) return;

            if (!grouped[doc.userId]) {
                grouped[doc.userId] = {
                    userId: doc.userId,
                    userName: doc.userName,
                    userProfilePic: doc.userProfilePic,
                    isMuted: mutedUserIds.includes(doc.userId),
                    items: []
                };
            }
            grouped[doc.userId].items.push(doc);
        });

        return Object.values(grouped);
    } catch (error) {
        console.error("Error fetching statuses with privacy:", error);
        return [];
    }
};

export const muteUserStatus = async (currentUserId, targetUserId) => {
    try {
        const userDoc = await databases.getDocument(DB_ID, appwriteConfig.userCollectionId, currentUserId);
        let muted = [];
        try {
            muted = userDoc.mutedStatusUsers ? JSON.parse(userDoc.mutedStatusUsers) : [];
        } catch (e) {
            muted = [];
        }

        if (!muted.includes(targetUserId)) {
            muted.push(targetUserId);
        }

        return await databases.updateDocument(DB_ID, appwriteConfig.userCollectionId, currentUserId, {
            mutedStatusUsers: JSON.stringify(muted)
        });
    } catch (error) {
        console.error("Error muting user status:", error);
        throw error;
    }
};

export const unmuteUserStatus = async (currentUserId, targetUserId) => {
    try {
        const userDoc = await databases.getDocument(DB_ID, appwriteConfig.userCollectionId, currentUserId);
        let muted = [];
        try {
            muted = userDoc.mutedStatusUsers ? JSON.parse(userDoc.mutedStatusUsers) : [];
        } catch (e) {
            muted = [];
        }

        muted = muted.filter(id => id !== targetUserId);

        return await databases.updateDocument(DB_ID, appwriteConfig.userCollectionId, currentUserId, {
            mutedStatusUsers: JSON.stringify(muted)
        });
    } catch (error) {
        console.error("Error unmuting user status:", error);
        throw error;
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
