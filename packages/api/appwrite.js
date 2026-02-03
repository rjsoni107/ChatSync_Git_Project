console.log('Appwrite: Initializing Web SDK');
import { Client, Account, Databases, Storage, Query, ID, Permission, Role } from 'appwrite';
import { appwriteConfig } from './config';

export const client = new Client();

const endpoint = appwriteConfig.endpoint;
const projectId = appwriteConfig.projectId;

client
    .setEndpoint(endpoint)
    .setProject(projectId);

// For React Native / Mobile
// Appwrite Cloud authorization is usually handled via headers or sessions.
// The Web SDK (appwrite) does not have a .setPlatform() method.
// That method is for the react-native-appwrite library specifically.


export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { Query, ID, Permission, Role };

