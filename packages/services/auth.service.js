import { account, ID } from "@chatterapp/api/appwrite";
import { getUserProfile } from "./user.service";

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
    try {
        const accountData = await account.get();
        if (!accountData) return null;

        try {
            const profile = await getUserProfile(accountData.$id);
            return { ...accountData, ...profile };
        } catch (profileError) {
            // Profile might not exist yet for new users or if sync failed
            return accountData;
        }
    } catch (error) {
        return null;
    }
};

export const logout = async () => {
    return await account.deleteSession("current");
};

export const sendVerificationEmail = async (url) => {
    return await account.createVerification(url);
};

export const sendVerificationOTP = async (userId, email) => {
    return await account.createEmailToken(userId, email);
};

export const verifyEmail = async (userId, secret) => {
    return await account.updateVerification(userId, secret);
};

export const verifyOTP = async (userId, otp) => {
    return await account.createSession(userId, otp);
};

export const sendPasswordRecoveryEmail = async (email, url) => {
    return await account.createRecovery(email, url);
};

export const resetPassword = async (userId, secret, password) => {
    return await account.updateRecovery(userId, secret, password, password);
};
