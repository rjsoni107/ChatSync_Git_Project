import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'ChatterApp',
                short_name: 'ChatterApp',
                description: 'ChatterApp – Real-time Chat Application',
                start_url: '/',
                display: 'standalone',
                background_color: '#0b1220',
                theme_color: '#0b1220',
                icons: [
                    {
                        src: '/img/logo192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/img/logo512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
        }),
    ],

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@chatterapp': path.resolve(__dirname, '../../packages'),
        },
    },

    server: {
        host: true,
        port: 5173,
    },
});
