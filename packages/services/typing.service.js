import { databases } from "@chatsync/api/appwrite";
import { appwriteConfig } from "@chatsync/api/config";

const DB_ID = appwriteConfig.databaseId;
const TYPING_ID = appwriteConfig.typingStatusCollectionId;

export const setTyping = async ({ chatId, userId, name, isTyping }) => {
    if (!chatId || !userId) return;
    const docId = `${chatId.slice(0, 15)}_${userId.slice(0, 15)}`;

    try {
        // try update first
        await databases.updateDocument(
            DB_ID,
            TYPING_ID,
            docId,
            {
                chatId,
                userId,
                name,
                isTyping,
                updatedAt: new Date().toISOString(),
            }
        );
    } catch (err) {
        // if not exists → create
        await databases.createDocument(
            DB_ID,
            TYPING_ID,
            docId,
            {
                chatId,
                userId,
                name,
                isTyping,
                updatedAt: new Date().toISOString(),
            },
        );
    }
};


export const removeTyping = async ({ chatId, userId }) => {
    if (!chatId || !userId) return;
    const docId = `${chatId.slice(0, 15)}_${userId.slice(0, 15)}`;

    await databases.deleteDocument(DB_ID, TYPING_ID, docId);
};
