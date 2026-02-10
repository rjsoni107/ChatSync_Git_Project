import { databases, Query, ID, Permission, Role } from "@chatterapp/api/appwrite";
import { appwriteConfig } from '../api/config';
import { createChat, addChatMember } from './chat.service';

const DB_ID = appwriteConfig.databaseId;
const REQUESTS_ID = appwriteConfig.chatRequestCollectionId;

/**
 * Send a chat request from one user to another
 */
export const sendChatRequest = async (senderId, receiverId) => {
    // Check if a request already exists
    const existing = await databases.listDocuments(DB_ID, REQUESTS_ID, [
        Query.equal("senderId", senderId),
        Query.equal("receiverId", receiverId),
        Query.equal("status", "pending")
    ]);

    if (existing.total > 0) {
        throw new Error("A pending request already exists.");
    }

    return await databases.createDocument(
        DB_ID,
        REQUESTS_ID,
        ID.unique(),
        {
            senderId,
            receiverId,
            status: "pending",
            createdAt: new Date().toISOString()
        },
        [
            Permission.read(Role.user(senderId)),
            Permission.read(Role.users()),
            Permission.update(Role.user(senderId)),
            Permission.update(Role.users()),
        ]
    );
};

/**
 * Get all pending requests received by a user
 */
export const getReceivedRequests = async (userId) => {
    const res = await databases.listDocuments(DB_ID, REQUESTS_ID, [
        Query.equal("receiverId", userId),
        Query.equal("status", "pending")
    ]);

    if (res.total === 0) return [];

    // Fetch sender profiles
    const senderIds = res.documents.map(r => r.senderId);
    const usersRes = await databases.listDocuments(DB_ID, appwriteConfig.userCollectionId, [
        Query.equal("$id", senderIds)
    ]);

    const usersMap = {};
    usersRes.documents.forEach(u => usersMap[u.$id] = u);

    return res.documents.map(req => ({
        ...req,
        sender: usersMap[req.senderId]
    }));
};

/**
 * Accept or Reject a chat request
 */
export const updateRequestStatus = async (requestId, status) => {
    const request = await databases.getDocument(DB_ID, REQUESTS_ID, requestId);

    if (status === "accepted") {
        // 1. Create the actual chat
        const newChat = await createChat();
        const chatId = newChat.$id;

        // 2. Add both members
        await Promise.all([
            addChatMember(chatId, request.senderId),
            addChatMember(chatId, request.receiverId)
        ]);
    }

    // 3. Update request status
    return await databases.updateDocument(DB_ID, REQUESTS_ID, requestId, {
        status: status
    });
};

/**
 * Check if there is any existing relationship (chat or pending request)
 */
export const checkExistingRelationship = async (senderId, receiverId) => {
    // 1. Check pending request from sender to receiver
    const outgoing = await databases.listDocuments(DB_ID, REQUESTS_ID, [
        Query.equal("senderId", senderId),
        Query.equal("receiverId", receiverId),
        Query.equal("status", "pending")
    ]);

    if (outgoing.total > 0) return { type: 'request_sent', id: outgoing.documents[0].$id };

    // 2. Check pending request from receiver to sender
    const incoming = await databases.listDocuments(DB_ID, REQUESTS_ID, [
        Query.equal("senderId", receiverId),
        Query.equal("receiverId", senderId),
        Query.equal("status", "pending")
    ]);

    if (incoming.total > 0) return { type: 'request_received', id: incoming.documents[0].$id };

    return null;
};

/**
 * Cancel/Delete a chat request
 */
export const cancelChatRequest = async (requestId) => {
    return await databases.deleteDocument(DB_ID, REQUESTS_ID, requestId);
};
/**
 * Delete all requests between two users (sent or received)
 */
export const deleteAllRequests = async (userA, userB) => {
    try {
        const res = await databases.listDocuments(DB_ID, REQUESTS_ID, [
            Query.or([
                Query.and([Query.equal("senderId", userA), Query.equal("receiverId", userB)]),
                Query.and([Query.equal("senderId", userB), Query.equal("receiverId", userA)])
            ])
        ]);

        const deletions = res.documents.map(doc => databases.deleteDocument(DB_ID, REQUESTS_ID, doc.$id));
        await Promise.all(deletions);
        return true;
    } catch (error) {
        console.error("Error deleting chat requests:", error);
        return false;
    }
};
