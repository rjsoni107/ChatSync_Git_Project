import { databases, client, Query, ID } from "@chatterapp/api/appwrite";
import { appwriteConfig } from '../api/config';

const DB_ID = appwriteConfig.databaseId;
const MESSAGES_ID = appwriteConfig.messageCollectionId;
const CHATS_ID = appwriteConfig.chatCollectionId;

export const sendMessage = async ({ chatId, senderId, content, type = "text", fileId = null, duration = null }) => {
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
            content: type === "voice" ? (duration ? duration.toString() : "0") : content,
            fileId,
            createdAt: now,
            isSeen: false,
            isDelivered: false,
            metadata: type === "poll" ? JSON.stringify({ options: [], votes: {} }) : null,
        }
    );

    // 2️⃣ update chat last message
    const lastMsgDisplay = type === "image" ? "📷 Image" : (type === "voice" ? "🎤 Voice message" : (type === "poll" ? "📊 Poll" : content));

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
    if (!DB_ID || !MESSAGES_ID) {
        console.warn('Realtime: Missing DB_ID or MESSAGES_ID in message service');
        return () => { };
    }
    const channel = `databases.${DB_ID}.collections.${MESSAGES_ID}.documents`;
    console.log(`Subscribing to messages: ${channel}`);

    return client.subscribe(channel, (res) => {
        const events = [
            "databases.*.collections.*.documents.*.create",
            "databases.*.collections.*.documents.*.update",
            "databases.*.collections.*.documents.*.delete"
        ];

        if (res.events.some(e => e.includes('.documents.'))) {
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

export const getChatMedia = async (chatId, limit = 100) => {
    if (!chatId) return [];

    const res = await databases.listDocuments(DB_ID, MESSAGES_ID, [
        Query.equal("chatId", chatId),
        Query.equal("type", ["image", "voice", "video"]),
        Query.orderDesc("createdAt"),
        Query.limit(limit),
    ]);

    return res.documents;
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
            isDelivered: true,
        });
    }

    // 🏆 CRITICAL: Update the chat document itself to trigger a realtime refresh 
    // for all listeners (like the Chat List unread count and tab badges).
    if (res.total > 0) {
        try {
            await databases.updateDocument(DB_ID, CHATS_ID, chatId, {
                lastActionAt: new Date().toISOString() // Dynamic field to force update
            });
        } catch (err) {
            console.warn("Failed to trigger chat refresh signal:", err.message);
        }
    }
};

export const markMessagesAsDelivered = async (chatId, userId) => {
    if (!chatId || !userId) return;

    // Fetch messages delivered=false and not sent by current user
    const res = await databases.listDocuments(DB_ID, MESSAGES_ID, [
        Query.equal("chatId", chatId),
        Query.notEqual("senderId", userId),
        Query.equal("isDelivered", false),
        Query.limit(100),
    ]);

    for (const msg of res.documents) {
        await databases.updateDocument(DB_ID, MESSAGES_ID, msg.$id, {
            isDelivered: true,
        });
    }
};

export const addReactionToMessage = async (messageId, emoji, userId) => {
    if (!messageId || !emoji || !userId) return;

    try {
        const msg = await databases.getDocument(DB_ID, MESSAGES_ID, messageId);
        let reactions = [];

        try {
            reactions = msg.reactions ? JSON.parse(msg.reactions) : [];
        } catch (e) {
            reactions = [];
        }

        // Check if user already has ANY reaction
        const existingReactionIndex = reactions.findIndex(r => r.userId === userId);

        if (existingReactionIndex > -1) {
            const previousEmoji = reactions[existingReactionIndex].emoji;
            // Remove the old reaction
            reactions.splice(existingReactionIndex, 1);

            // If they clicked a DIFFERENT emoji, add the new one.
            // If they clicked the SAME emoji, we already removed it (toggle off).
            if (previousEmoji !== emoji) {
                reactions.push({ userId, emoji, createdAt: new Date().toISOString() });
            }
        } else {
            // First time reacting, just add it
            reactions.push({ userId, emoji, createdAt: new Date().toISOString() });
        }

        return await databases.updateDocument(DB_ID, MESSAGES_ID, messageId, {
            reactions: JSON.stringify(reactions)
        });
    } catch (error) {
        console.error("Error adding reaction:", error);
        throw error;
    }
};

export const updateMessage = async (messageId, newContent) => {
    if (!messageId || !newContent) return;
    try {
        const now = new Date().toISOString();
        const updatedMsg = await databases.updateDocument(DB_ID, MESSAGES_ID, messageId, {
            content: newContent,
            isEdited: true,
            updatedAt: now
        });

        // Update chat last message ONLY if this was the latest message
        const chat = await databases.getDocument(DB_ID, CHATS_ID, updatedMsg.chatId);
        if (chat.lastMessageAt === updatedMsg.createdAt) { // Simple check, could be more robust
            await databases.updateDocument(DB_ID, CHATS_ID, updatedMsg.chatId, {
                lastMessage: updatedMsg.type === "image" ? "📷 Image (edited)" : newContent,
            });
        }

        return updatedMsg;
    } catch (error) {
        console.error("Error updating message:", error);
        throw error;
    }
};

export const togglePinMessage = async (messageId, isPinned) => {
    if (!messageId) return;
    try {
        return await databases.updateDocument(DB_ID, MESSAGES_ID, messageId, {
            isPinned: isPinned,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error toggling pin:", error);
        throw error;
    }
};

export const deleteMessageForEveryone = async (messageId) => {
    if (!messageId) return;
    try {
        const updatedMsg = await databases.updateDocument(DB_ID, MESSAGES_ID, messageId, {
            content: "This message was deleted",
            type: "text", // Reset to text
            fileId: null, // Clear any attached file
            isDeleted: true,
            updatedAt: new Date().toISOString()
        });

        // Update chat last message if needed
        const chat = await databases.getDocument(DB_ID, CHATS_ID, updatedMsg.chatId);
        if (chat.lastMessageAt === updatedMsg.createdAt) {
            await databases.updateDocument(DB_ID, CHATS_ID, updatedMsg.chatId, {
                lastMessage: "🚫 Message deleted",
            });
        }

        return updatedMsg;
    } catch (error) {
        console.error("Error soft-deleting message:", error);
        throw error;
    }
};

export const deleteMessage = async (messageId) => {
    if (!messageId) return;
    try {
        return await databases.deleteDocument(DB_ID, MESSAGES_ID, messageId);
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
};

export const deleteMessageForUser = async (messageId, userId) => {
    if (!messageId || !userId) return;
    try {
        const msg = await databases.getDocument(DB_ID, MESSAGES_ID, messageId);
        let deletedFor = [];
        try {
            deletedFor = msg.deletedForUsers ? JSON.parse(msg.deletedForUsers) : [];
        } catch (e) {
            deletedFor = [];
        }

        if (!deletedFor.includes(userId)) {
            deletedFor.push(userId);
        }

        return await databases.updateDocument(DB_ID, MESSAGES_ID, messageId, {
            deletedForUsers: JSON.stringify(deletedFor)
        });
    } catch (error) {
        console.error("Error hiding message for user:", error);
        throw error;
    }
};
export const clearChatMessages = async (chatId) => {
    if (!chatId) return;
    try {
        // 1. Get all messages for this chat
        const res = await databases.listDocuments(DB_ID, MESSAGES_ID, [
            Query.equal("chatId", chatId),
            Query.limit(100), // Appwrite limit, might need recursion for many messages
        ]);

        // 2. Delete each message
        const deletePromises = res.documents.map(msg =>
            databases.deleteDocument(DB_ID, MESSAGES_ID, msg.$id)
        );
        await Promise.all(deletePromises);

        // 3. Update chat metadata
        await databases.updateDocument(DB_ID, CHATS_ID, chatId, {
            lastMessage: "Chat cleared",
            lastMessageAt: new Date().toISOString(),
        });

        return true;
    } catch (error) {
        console.error("Error clearing chat messages:", error);
        throw error;
    }
};
// 📊 create poll
export const createPoll = async ({ chatId, senderId, question, options }) => {
    const pollData = JSON.stringify({ question, options });
    return await sendMessage({
        chatId,
        senderId,
        content: pollData,
        type: "poll"
    });
};

// 🗳️ vote on poll (stores in metadata for real-time)
export const voteOnPoll = async (messageId, userId, optionIndex) => {
    const msg = await databases.getDocument(DB_ID, MESSAGES_ID, messageId);
    let metadata = { votes: {} };
    try {
        metadata = msg.metadata ? JSON.parse(msg.metadata) : { votes: {} };
    } catch (e) { }

    // Toggle vote: if already voted for this, remove. If voted for other, change.
    const currentVote = metadata.votes[userId];
    if (currentVote === optionIndex) {
        delete metadata.votes[userId];
    } else {
        metadata.votes[userId] = optionIndex;
    }

    return await databases.updateDocument(DB_ID, MESSAGES_ID, messageId, {
        metadata: JSON.stringify(metadata)
    });
};
