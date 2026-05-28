import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    base: '/dashboard/',
    root: '.',
    publicDir: 'public',
    resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5174,
        strictPort: true,
        fs: {
            allow: ['..']
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
});
