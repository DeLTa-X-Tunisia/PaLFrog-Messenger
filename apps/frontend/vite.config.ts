/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const isElectron = process.env.ELECTRON === 'true';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
    },
    server: {
        port: 5173,
    },
    build: {
        outDir: 'dist',
        assetsDir: '.',
        rollupOptions: {
            output: {
                format: 'es',
            },
        },
    },
    base: isElectron ? './' : '/',
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
