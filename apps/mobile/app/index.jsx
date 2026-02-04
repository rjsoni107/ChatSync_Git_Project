import { Redirect } from 'expo-router';

export default function Index() {
    // This file is just a bridge. 
    // The _layout.jsx will handle the actual redirect logic based on auth state.
    return <Redirect href="/(tabs)/chats" />;
}
