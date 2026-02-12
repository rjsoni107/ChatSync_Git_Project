import { databases, Query, ID, Permission, Role } from "@chatterapp/api/appwrite";
import { appwriteConfig } from "@chatterapp/api/config";

const DB_ID = appwriteConfig.databaseId;
const VIEWS_ID = appwriteConfig.profileViewsCollectionId;

/**
 * Records a profile view. 
 * If an unread record exists for this viewer on this profile, increments the count.
 * Otherwise, creates a new unread record.
 */
export const recordProfileView = async (viewerId, profileOwnerId) => {
    if (!viewerId || !profileOwnerId || viewerId === profileOwnerId) return;

    try {
        // 1. Check for an existing UNREAD notification from this viewer to this owner
        const existing = await databases.listDocuments(DB_ID, VIEWS_ID, [
            Query.equal("viewerId", viewerId),
            Query.equal("profileOwnerId", profileOwnerId),
            Query.equal("isRead", false),
            Query.limit(1)
        ]);

        if (existing.total > 0) {
            // 2. Increment count and update timestamp
            const doc = existing.documents[0];
            return await databases.updateDocument(DB_ID, VIEWS_ID, doc.$id, {
                count: (doc.count || 1) + 1,
                lastViewedAt: new Date().toISOString()
            });
        } else {
            // 3. Create a new notification
            return await databases.createDocument(
                DB_ID,
                VIEWS_ID,
                ID.unique(),
                {
                    viewerId,
                    profileOwnerId,
                    count: 1,
                    lastViewedAt: new Date().toISOString(),
                    isRead: false
                },
                [
                    Permission.read(Role.user(viewerId)),
                    Permission.read(Role.user(profileOwnerId)),
                    Permission.update(Role.user(viewerId)),
                    Permission.update(Role.user(profileOwnerId)),
                    Permission.delete(Role.user(profileOwnerId))
                ]
            );
        }
    } catch (error) {
        console.error("Error recording profile view:", error);
    }
};

/**
 * Fetches profile view notifications for the current user.
 */
export const getProfileViews = async (ownerId) => {
    if (!ownerId) return [];
    try {
        const res = await databases.listDocuments(DB_ID, VIEWS_ID, [
            Query.equal("profileOwnerId", ownerId),
            Query.orderDesc("lastViewedAt"),
            Query.limit(50)
        ]);
        return res.documents;
    } catch (error) {
        console.error("Error fetching profile views:", error);
        return [];
    }
};

/**
 * Marks a notification as read.
 */
export const markViewAsRead = async (viewId) => {
    try {
        return await databases.updateDocument(DB_ID, VIEWS_ID, viewId, {
            isRead: true
        });
    } catch (error) {
        console.error("Error marking view as read:", error);
    }
};

/**
 * Subscribes to new/updated profile views.
 */
import { client } from "@chatterapp/api/appwrite";
export const subscribeProfileViews = (callback) => {
    const channel = `databases.${DB_ID}.collections.${VIEWS_ID}.documents`;
    return client.subscribe(channel, (event) => callback(event));
};
