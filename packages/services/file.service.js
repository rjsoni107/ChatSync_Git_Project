import { storage, ID } from "@chatterapp/api/appwrite";
import { appwriteConfig } from '../api/config';

const BUCKET_ID = appwriteConfig.bucketId;

export const uploadFile = async (file) => {
    try {
        const response = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            file
        );
        return response;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

export const getFileView = (fileId) => {
    return storage.getFileView(BUCKET_ID, fileId);
};
