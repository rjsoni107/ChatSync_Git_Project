//auth.service.js
import { account } from "@chatsync/api/appwrite";

export const signup = async (email, password, name) => {
    return await account.create("unique()", email, password, name);
};

export const login = async (email, password) => {
    try {
        await account.get();
        // If get() succeeds, a session exists. clear it.
        await account.deleteSession("current");
    } catch {
        // No session exists, proceed to login
    }
    return await account.createEmailPasswordSession(email, password);
};

export const getCurrentUser = async () => {
    return await account.get();
};

export const logout = async () => {
    return await account.deleteSession("current");
};

export const sendVerificationEmail = async (url) => {
    return await account.createVerification(url);
};

export const verifyEmail = async (userId, secret) => {
    return await account.updateVerification(userId, secret);
};
