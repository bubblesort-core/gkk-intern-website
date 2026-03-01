import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Plugin to route requests to appropriate sub-apps
function unifiedRouting() {
    return {
        name: 'unified-routing',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url?.split('?')[0] || '/';

                // Redirect /apply to /dashboard/apply
                if (url === '/apply' || url === '/apply/') {
                    res.writeHead(301, { Location: '/dashboard/apply/' });
                    res.end();
                    return;
                }

                // Route /dashboard/apply requests to gkk-bento-form
                if (url.startsWith('/dashboard/apply')) {
                    const subPath = url.slice('/dashboard/apply'.length) || '/';
                    const filePath = resolve(__dirname, 'gkk-bento-form', subPath.slice(1));

                    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                        req.url = '/gkk-bento-form' + subPath + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
                        return next();
                    }
                    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                        const indexPath = resolve(filePath, 'index.html');
                        if (fs.existsSync(indexPath)) {
                            req.url = '/gkk-bento-form' + subPath + (subPath.endsWith('/') ? '' : '/') + 'index.html';
                            return next();
                        }
                    }
                    // SPA fallback for Apply form
                    req.url = '/gkk-bento-form/index.html';
                    return next();
                }

                // Route /dashboard requests (EXCLUDING apply) to Dashboard directory
                if (url.startsWith('/dashboard')) {
                    const subPath = url.slice('/dashboard'.length) || '/';
                    const filePath = resolve(__dirname, 'Dashboard', subPath.slice(1));

                    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                        req.url = '/Dashboard' + subPath + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
                        return next();
                    }
                    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                        const indexPath = resolve(filePath, 'index.html');
                        if (fs.existsSync(indexPath)) {
                            req.url = '/Dashboard' + subPath + (subPath.endsWith('/') ? '' : '/') + 'index.html';
                            return next();
                        }
                    }
                    // SPA fallback for Dashboard
                    req.url = '/Dashboard/index.html';
                    return next();
                }

                next();
            });
        },
    };
}

// Plugin to serve public files from all apps
function multiPublicDir() {
    return {
        name: 'multi-public-dir',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url?.split('?')[0] || '/';

                // Check specific prefixes first
                if (url.startsWith('/assets/')) {
                    const filePath = resolve(__dirname, 'Dashboard/public', url.slice(1));
                    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                        return res.end(fs.readFileSync(filePath));
                    }
                }

                // Fallback to searching root public dirs in order
                const mainPublicFile = resolve(__dirname, 'GKK-HIRE-MAIN/public', url.slice(1));
                if (url !== '/' && fs.existsSync(mainPublicFile) && fs.statSync(mainPublicFile).isFile()) {
                    return res.end(fs.readFileSync(mainPublicFile));
                }

                const bentoPublicFile = resolve(__dirname, 'gkk-bento-form/public', url.slice(1));
                if (url !== '/' && fs.existsSync(bentoPublicFile) && fs.statSync(bentoPublicFile).isFile()) {
                    return res.end(fs.readFileSync(bentoPublicFile));
                }

                next();
            });
        },
    };
}

// Custom plugin to resolve '@' alias based on importer context
function contextAlias() {
    return {
        name: 'context-alias',
        async resolveId(source, importer, options) {
            if (source.startsWith('@/')) {
                const relativePath = source.slice(2);
                let targetBase = '';

                // Determine base path based on importer
                if (importer) {
                    if (importer.includes('gkk-bento-form')) {
                        targetBase = resolve(__dirname, 'gkk-bento-form/src');
                    } else if (importer.includes('Dashboard')) {
                        targetBase = resolve(__dirname, 'Dashboard/src');
                    } else {
                        targetBase = resolve(__dirname, 'GKK-HIRE-MAIN/src');
                    }
                } else {
                    return null;
                }

                const targetPath = resolve(targetBase, relativePath);

                // Use Vite's internal resolution to handle extensions (.ts, .tsx, etc.)
                const resolved = await this.resolve(targetPath, importer, {
                    skipSelf: true,
                    ...options
                });

                if (resolved) return resolved;

                // Fallback: return the raw path if resolution failed (might catch some edge cases)
                return targetPath;
            }
            return null;
        }
    }
}

export default defineConfig({
    root: '.',
    plugins: [
        react(),
        unifiedRouting(),
        multiPublicDir(),
        contextAlias(),
    ],
    resolve: {
        dialects: ['web', 'ios', 'android', 'native'],
        alias: {
            'react-native': 'react-native-web',
            'react': resolve(__dirname, './node_modules/react'),
            'react-dom': resolve(__dirname, './node_modules/react-dom'),
            'react/jsx-runtime': resolve(__dirname, './node_modules/react/jsx-runtime'),
            'react/jsx-dev-runtime': resolve(__dirname, './node_modules/react/jsx-dev-runtime'),
        },
        dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    optimizeDeps: {
        include: ['react-native-web'],
    },
    css: {
        postcss: resolve(__dirname, 'GKK-HIRE-MAIN'),
    },
    server: {
        port: 5173,
        open: true,
        fs: {
            strict: false,
        },
        proxy: {
            '/supabase-main': {
                target: 'https://hjpsyxqakzrhvzegehtm.supabase.co',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/supabase-main/, ''),
            },
            '/supabase-chat': {
                target: 'https://mwnpwuxrbaousgwgoyco.supabase.co',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/supabase-chat/, ''),
            },
        }
    },
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                dashboard: resolve(__dirname, 'Dashboard/index.html'),
                apply: resolve(__dirname, 'gkk-bento-form/index.html'),
            },
        },
    },
});
