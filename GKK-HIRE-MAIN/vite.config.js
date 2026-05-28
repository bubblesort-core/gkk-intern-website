import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'framer-motion'],
    alias: {
      'react-native': 'react-native-web',
      // Files imported from ../shared (monorepo sibling) must resolve deps
      // against THIS workspace's node_modules. Without these, framer-motion
      // and React resolutions fail at build time.
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  optimizeDeps: {
    include: ['react-native-web'],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        clients: path.resolve(__dirname, 'clients.html'),
      },
    },
  },
})
// Force restart
