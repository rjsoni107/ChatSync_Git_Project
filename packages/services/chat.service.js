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
export const createChat = async (type = "private", metadata = {}) => {
    return await databases.createDocument(DB_ID, CHATS_ID, ID.unique(), {
        type,
        isArchived: false,
        createdAt: new Date().toISOString(),
        ...metadata
    });
};

// ➕ get chat by id
export const getChat = async (chatId) => {
    return await databases.getDocument(DB_ID, CHATS_ID, chatId);
};

// 👥 create group chat
export const createGroupChat = async (name, members, description = "", avatar = "") => {
    // 1. Create chat document
    const chat = await createChat("group", {
        name,
        description,
        avatar,
        lastMessage: "Group created"
    });

    // 2. Add members
    const memberPromises = members.map(m =>
        addChatMember(chat.$id, m.userId, m.role || "member")
    );

    await Promise.all(memberPromises);
    return chat;
};

// ➕ add member
export const addChatMember = async (chatId, userId, role = "member") => {
    return await databases.createDocument(DB_ID, MEMBERS_ID, ID.unique(), {
        chatId,
        userId,
        role,
        joinedAt: new Date().toISOString(),
        isBanned: false,
    });
};

// 👥 get all members for a chat
export const getChatMembers = async (chatId) => {
    const res = await databases.listDocuments(DB_ID, MEMBERS_ID, [
        Query.equal("chatId", chatId),
        Query.limit(100)
    ]);

    // Fetch user details for each member
    const userIds = res.documents.map(m => m.userId);
    const usersRes = await databases.listDocuments(DB_ID, USERS_ID, [
        Query.equal("$id", userIds),
        Query.limit(100)
    ]);

    const usersMap = {};
    usersRes.documents.forEach(u => usersMap[u.$id] = u);

    return res.documents.map(m => ({
        ...m,
        user: usersMap[m.userId]
    }));
};

// 🛠️ update group details
export const updateGroupMetadata = async (chatId, metadata) => {
    return await databases.updateDocument(DB_ID, CHATS_ID, chatId, metadata);
};

// 👑 update member role
export const updateMemberRole = async (membershipId, role) => {
    return await databases.updateDocument(DB_ID, MEMBERS_ID, membershipId, { role });
};

// 🗑️ remove member from group
export const removeMember = async (membershipId) => {
    return await databases.deleteDocument(DB_ID, MEMBERS_ID, membershipId);
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
// 🗑️ delete chat and all related data
export const deletePrivateChat = async (chatId) => {
    if (!chatId) return;

    try {
        // 1. Get all members of this chat
        const membersRes = await databases.listDocuments(DB_ID, MEMBERS_ID, [
            Query.equal("chatId", chatId),
        ]);

        // 2. Delete all members
        const memberDeletions = membersRes.documents.map(m =>
            databases.deleteDocument(DB_ID, MEMBERS_ID, m.$id)
        );

        // 3. Delete messages (handled individually to avoid large batch issues, but Promise.all is fine for 100)
        const messagesRes = await databases.listDocuments(DB_ID, appwriteConfig.messageCollectionId, [
            Query.equal("chatId", chatId),
            Query.limit(100),
        ]);

        const messageDeletions = messagesRes.documents.map(msg =>
            databases.deleteDocument(DB_ID, appwriteConfig.messageCollectionId, msg.$id)
        );

        // 4. Delete the chat document itself
        const chatDeletion = databases.deleteDocument(DB_ID, CHATS_ID, chatId);

        await Promise.all([...memberDeletions, ...messageDeletions, chatDeletion]);
        return true;
    } catch (error) {
        console.error("Error deleting private chat:", error);
        throw error;
    }
};
