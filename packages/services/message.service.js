import { databases, client, Query, ID } from "@chatsync/api/appwrite";
import { appwriteConfig } from '../api/config';

const DB_ID = appwriteConfig.databaseId;
const MESSAGES_ID = appwriteConfig.messageCollectionId;
const CHATS_ID = appwriteConfig.chatCollectionId;

export const sendMessage = async ({ chatId, senderId, content, type = "text", fileId = null }) => {
    if (!chatId) {
        throw new Error("chatId is required to send a message");
    }
    console.log("sendMessage to chat:", chatId);
    const now = new Date().toISOString();

    const msg = await databases.createDocument(
        DB_ID,
        MESSAGES_ID,
        ID.unique(),
        {
            chatId,
            senderId,
            type,
            content,
            fileId,
            createdAt: now,
            isSeen: false,
        }
    );

    // 2️⃣ update chat last message
    const lastMsgDisplay = type === "image" ? "📷 Image" : content;

    try {
        await databases.updateDocument(DB_ID, CHATS_ID, chatId, {
            lastMessage: lastMsgDisplay,
            lastMessageAt: now,
            lastSenderId: senderId,
        });
    } catch (err) {
        console.warn("Failed to update chat metadata:", err.message);
        // Fallback update
        try {
            await databases.updateDocument(DB_ID, CHATS_ID, chatId, {
                lastMessage: lastMsgDisplay,
                lastMessageAt: now,
            });
        } catch (innerErr) {
            console.error("Could not update chat metadata even with fallback:", innerErr);
        }
    }

    return msg;
};

export const subscribeMessages = (callback) => {
    return client.subscribe(`databases.${DB_ID}.collections.${MESSAGES_ID}.documents`, (res) => {
        const events = [
            "databases.*.collections.*.documents.*.create",
            "databases.*.collections.*.documents.*.update",
            "databases.*.collections.*.documents.*.delete" // Added delete event explicitly
        ];

        // Pass full response so consumers can check event type (create/update/delete)
        if (res.events.some(e => events.some(pattern => {
            // Simple match or regex match could be better, but for now exact or wildcard logic
            // The events array usually contains specific strings. 
            // Appwrite wildcard subscription returns specific events.
            return e.includes('.documents.') // Simple check that it's a document event
        }))) {
            callback(res);
        }
    });
};

export const getMessagesByChat = async (chatId) => {
    if (!chatId) return [];

    // Fetch latest 100 messages (newest first)
    const res = await databases.listDocuments(DB_ID, MESSAGES_ID, [
        Query.equal("chatId", chatId),
        Query.orderDesc("createdAt"),
        Query.limit(100),
    ]);

    // Reverse them so they are in chronological order for the UI
    return res.documents.reverse();
};

export const markMessagesAsSeen = async (chatId, userId) => {
    if (!chatId || !userId) return;

    // Fetch up to 100 unread messages
    const res = await databases.listDocuments(DB_ID, MESSAGES_ID, [
        Query.equal("chatId", chatId),
        Query.notEqual("senderId", userId),
        Query.equal("isSeen", false),
        Query.limit(100),
    ]);

    // Update them sequentially (could be parallel but Appwrite might rate limit)
    for (const msg of res.documents) {
        await databases.updateDocument(DB_ID, MESSAGES_ID, msg.$id, {
            isSeen: true,
        });
    }
};

