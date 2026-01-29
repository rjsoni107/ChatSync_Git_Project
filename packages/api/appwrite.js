import { Client, Account, Databases, Storage, Query, ID, Permission, Role } from 'appwrite';
import { appwriteConfig } from './config';

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);
// .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
// .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { Query, ID, Permission, Role };

