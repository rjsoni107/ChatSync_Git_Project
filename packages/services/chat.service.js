import { databases, Query, ID } from "@chatterapp/api/appwrite";
import { appwriteConfig } from '../api/config';

const DB_ID = appwriteConfig.databaseId;
const CHATS_ID = appwriteConfig.chatCollectionId;
const MEMBERS_ID = appwriteConfig.chatMembersCollectionId;
const USERS_ID = appwriteConfig.userCollectionId;

export const getUserChats = async (userId) => {
    // 1️⃣ find memberships for the current user
    const memberships = await databases.listDocuments(
        DB_ID,
        MEMBERS_ID,
        [Query.equal("userId", userId), Query.limit(100)]
    );

    const chatIds = memberships.documents.map((m) => m.chatId);
    if (!chatIds.length) return [];

    // 2️⃣ fetch chats objects
    const chatsRes = await databases.listDocuments(
        DB_ID,
        CHATS_ID,
        [Query.equal("$id", chatIds), Query.limit(100)]
    );

    // 3️⃣ Batch fetch ALL members for ALL these chats
    const allMembersRes = await databases.listDocuments(
        DB_ID,
        MEMBERS_ID,
        [Query.equal("chatId", chatIds), Query.limit(100)]
    );

    // Group members by chatId and find other userIds
    const otherUserIds = [];
    const membersByChat = {};
    allMembersRes.documents.forEach(m => {
        if (!membersByChat[m.chatId]) membersByChat[m.chatId] = [];
        membersByChat[m.chatId].push(m);
        if (m.userId !== userId) {
            otherUserIds.push(m.userId);
        }
    });

    // 4️⃣ Batch fetch ALL other user profiles
    let usersMap = {};
    if (otherUserIds.length > 0) {
        const uniqueOtherUserIds = [...new Set(otherUserIds)];
        const usersRes = await databases.listDocuments(
            DB_ID,
            USERS_ID,
            [Query.equal("$id", uniqueOtherUserIds), Query.limit(100)]
        );
        usersRes.documents.forEach(u => {
            usersMap[u.$id] = u;
        });
    }

    // 5️⃣ Final assembly with unread counts
    const chatsWithUser = await Promise.all(
        chatsRes.documents.map(async (chat) => {
            const chatMembers = membersByChat[chat.$id] || [];
            const otherMember = chatMembers.find(m => m.userId !== userId);
            const otherUser = otherMember ? usersMap[otherMember.userId] : null;

            // unread counts still need individual queries because of complex filters
            const unreadRes = await databases.listDocuments(
                DB_ID,
                appwriteConfig.messageCollectionId,
                [
                    Query.equal("chatId", chat.$id),
                    Query.equal("isSeen", false),
                    Query.notEqual("senderId", userId),
                    Query.limit(1), // Just total needed
                ]
            );

            const lastMsgRes = await databases.listDocuments(
                DB_ID,
                appwriteConfig.messageCollectionId,
                [
                    Query.equal("chatId", chat.$id),
                    Query.orderDesc("createdAt"),
                    Query.limit(1),
                ]
            );
            const lastMsg = lastMsgRes.documents[0];

            // Overwrite stale chat document data with actual latest message data
            // Case-insensitive check for image and manual override for preview
            let preview = (chat.lastMessage || "").includes('📷') ? chat.lastMessage : "";
            if (lastMsg) {
                if (lastMsg.type?.toLowerCase() === 'image') {
                    preview = '📷 Photo';
                } else {
                    preview = (lastMsg.body || lastMsg.content || chat.lastMessage || "");
                }
            }

            return {
                ...chat,
                otherUser,
                unreadCount: unreadRes.total,
                lastMessageSeen: lastMsg ? lastMsg.isSeen : false,
                lastMessageDelivered: lastMsg ? lastMsg.isDelivered : false,
                lastSenderId: lastMsg ? lastMsg.senderId : chat.lastSenderId,
                lastMessage: preview || "Start a conversation...",
                lastMessageAt: lastMsg ? lastMsg.createdAt : chat.lastMessageAt,
                lastMessageType: lastMsg ? lastMsg.type : "text"
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
