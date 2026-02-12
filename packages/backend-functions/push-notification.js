const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    const { req, res, log, error } = context;

    // 1. Validate the event
    // Expected Event: databases.[ID].collections.[MESSAGES_ID].documents.create
    const payload = req.body;
    if (!payload || !payload.chatId || !payload.senderId) {
        log('Invalid payload or missing fields.');
        return res.json({ success: false, message: 'Invalid payload' });
    }

    const client = new sdk.Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    const databases = new sdk.Databases(client);

    try {
        const databaseId = process.env.APPWRITE_DATABASE_ID;
        const chatMembersCollectionId = process.env.APPWRITE_CHAT_MEMBERS_COLLECTION_ID;
        const usersCollectionId = process.env.APPWRITE_USERS_COLLECTION_ID;

        // 2. Find the receiver
        const members = await databases.listDocuments(databaseId, chatMembersCollectionId, [
            sdk.Query.equal('chatId', payload.chatId),
            sdk.Query.notEqual('userId', payload.senderId)
        ]);

        if (members.total === 0) {
            log('No other members found in chat.');
            return res.json({ success: true, message: 'No receiver' });
        }

        const receiverId = members.documents[0].userId;

        // 3. Get Receiver's push token and Sender's name in parallel
        const [receiver, senderProfile] = await Promise.all([
            databases.getDocument(databaseId, usersCollectionId, receiverId),
            databases.getDocument(databaseId, usersCollectionId, payload.senderId)
        ]);

        const pushToken = receiver.pushToken;
        const senderName = senderProfile.name || 'someone';

        if (!pushToken) {
            log(`No push token found for user ${receiverId}`);
            return res.json({ success: true, message: 'No push token' });
        }

        // 4. Send the notification via Expo
        const notification = {
            to: pushToken,
            sound: 'default',
            title: `New Message from ${senderName}`,
            body: payload.type === 'text' ? payload.content : '📷 Photo',
            data: {
                chatId: payload.chatId,
                type: 'message'
            },
        };

        log(`Sending notification to token: ${pushToken}`);

        await axios.post('https://exp.host/--/api/v2/push/send', notification, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });

        log('✅ Notification sent successfully.');
        return res.json({ success: true });

    } catch (err) {
        error(`❌ Error in push-notification function: ${err.message}`);
        return res.json({ success: false, error: err.message });
    }
};
