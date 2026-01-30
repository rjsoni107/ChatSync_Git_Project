import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@chatsync': path.resolve(__dirname, '../../packages'), // ✅ IMPORTANT
        },
    },
    server: {
        host: true,
        port: 5173,
    },
});
