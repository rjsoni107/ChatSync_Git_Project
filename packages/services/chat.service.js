import { databases, Query, ID } from "@chatsync/api/appwrite";
import { appwriteConfig } from '../api/config';

const DB_ID = appwriteConfig.databaseId;
const CHATS_ID = appwriteConfig.chatCollectionId;
const MEMBERS_ID = appwriteConfig.chatMembersCollectionId;
const USERS_ID = appwriteConfig.userCollectionId;

export const getUserChats = async (userId) => {
    // 1️⃣ find memberships
    const memberships = await databases.listDocuments(
        DB_ID,
        MEMBERS_ID,
        [Query.equal("userId", userId), Query.limit(100)]
    );

    const chatIds = memberships.documents.map((m) => m.chatId);

    if (!chatIds.length) return [];

    // 2️⃣ fetch chats
    const chatsRes = await databases.listDocuments(
        DB_ID,
        CHATS_ID,
        [Query.equal("$id", chatIds), Query.limit(100)]
    );

    // 3️⃣ for each chat → find OTHER member
    const chatsWithUser = await Promise.all(
        chatsRes.documents.map(async (chat) => {
            const members = await databases.listDocuments(
                DB_ID,
                MEMBERS_ID,
                [Query.equal("chatId", chat.$id)]
            );

            console.log("getUserChats find other member for chat:", chat.$id, "current userId:", userId);
            const otherMember = members.documents.find(
                (m) => String(m.userId) !== String(userId)
            );
            console.log("Found otherMember:", otherMember);

            let otherUser = null;

            if (otherMember) {
                otherUser = await databases.getDocument(
                    DB_ID,
                    USERS_ID,
                    otherMember.userId
                );
            }

            // 4️⃣ count unread messages
            const unreadRes = await databases.listDocuments(
                DB_ID,
                appwriteConfig.messageCollectionId,
                [
                    Query.equal("chatId", chat.$id),
                    Query.equal("isSeen", false),
                    Query.notEqual("senderId", userId),
                    Query.limit(100),
                ]
            );

            return {
                ...chat,
                otherUser,
                unreadCount: unreadRes.total,
            };
        })
    );

    return chatsWithUser;
};

// 🔍 check if private chat already exists
export const findPrivateChat = async (userA, userB) => {
    const res = await databases.listDocuments(DB_ID, MEMBERS_ID, [
        Query.equal("userId", userA),
    ]);

    for (const member of res.documents) {
        const sameChat = await databases.listDocuments(DB_ID, MEMBERS_ID, [
            Query.equal("chatId", member.chatId),
            Query.equal("userId", userB),
        ]);

        if (sameChat.total > 0) {
            return member.chatId;
        }
    }

    return null;
};

// ➕ create new chat
export const createChat = async () => {
    return await databases.createDocument(DB_ID, CHATS_ID, ID.unique(), {
        type: "private",
        isArchived: false,
        createdAt: new Date().toISOString(),
    });
};

// ➕ add member
export const addChatMember = async (chatId, userId) => {
    return await databases.createDocument(DB_ID, MEMBERS_ID, ID.unique(), {
        chatId,
        userId,
        role: "member",
        joinedAt: new Date().toISOString(),
        isBanned: false,
    });
};

export const getOtherUserFromChat = async (chatId, currentUserId) => {
    // 1️⃣ chat ke saare members lao
    const membersRes = await databases.listDocuments(DB_ID, MEMBERS_ID, [
        Query.equal("chatId", chatId),
    ]);

    // 2️⃣ jo current user nahi hai → other user
    const otherMember = membersRes.documents.find(
        (m) => m.userId !== currentUserId
    );

    if (!otherMember) return null;

    // 3️⃣ uski profile lao
    const otherUser = await databases.getDocument(
        DB_ID,
        USERS_ID,
        otherMember.userId
    );

    return otherUser;
};