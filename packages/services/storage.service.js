import { storage, ID } from "@chatterapp/api/appwrite";
import { appwriteConfig } from "../api/config";

const BUCKET_ID = appwriteConfig.bucketId;

/**
 * Upload a file to Appwrite storage
 * @param {File} file 
 * @returns {Promise<Object>} The uploaded file document
 */
export const uploadFile = async (file) => {
    try {
        const response = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            file
        );
        return response;
    } catch (error) {
        console.error("Storage upload failed:", error);
        throw error;
    }
};

/**
 * Get a preview URL for an image file
 * @param {string} fileId 
 * @returns {URL}
 */
export const getFilePreview = (fileId) => {
    try {
        const url = storage.getFileView(BUCKET_ID, fileId);
        return url.href || url.toString();
    } catch (error) {
        console.error("Storage preview failed:", error);
        return null;
    }
};

/**
 * Mobile-specific preview that might use different SDK methods if needed.
 */
export const getMobileFilePreview = (fileId) => {
    try {
        // Construct URL manually to avoid SDK object stringification issues in RN/Hermes
        // https://{endpoint}/storage/buckets/{bucketId}/files/{fileId}/view?project={projectId}
        const baseUrl = appwriteConfig.endpoint;
        const finalUrl = `${baseUrl}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
        return finalUrl;
    } catch (error) {
        console.error("Mobile storage preview failed:", error);
        return getFilePreview(fileId); // Fallback
    }
};

/**
 * Get a download URL for a file
 * @param {string} fileId 
 * @returns {string}
 */
export const getFileDownload = (fileId) => {
    try {
        const url = storage.getFileDownload(BUCKET_ID, fileId);
        return url.href || url.toString();
    } catch (error) {
        console.error("Storage download failed:", error);
        return null;
    }
};

/**
 * Delete a file from Appwrite storage
 * @param {string} fileId 
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileId) => {
    try {
        await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
        console.error("Storage delete failed:", error);
        throw error;
    }
};
