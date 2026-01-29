//auth.service.js
import { account } from "@chatsync/api/appwrite";

export const signup = async (email, password, name) => {
    return await account.create("unique()", email, password, name);
};

export const login = async (email, password) => {
    return await account.createEmailPasswordSession(email, password);
};

export const getCurrentUser = async () => {
    return await account.get();
};

export const logout = async () => {
    return await account.deleteSession("current");
};
