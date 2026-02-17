import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin to serve the landing page at the root URL
function landingPagePlugin() {
    const landingPagePath = path.resolve(__dirname, '../landing_page/index.html');
    return {
        name: 'landing-page',
        configureServer(server) {
            // Serve landing page for root and non-app routes
            server.middlewares.use((req, res, next) => {
                // If the request is for the app subpath, let Vite handle it
                if (req.url.startsWith('/apps/londoncrime')) {
                    return next();
                }
                // If it's a Vite internal request (HMR, etc.), let it through
                if (req.url.startsWith('/@') || req.url.startsWith('/node_modules') || req.url.startsWith('/src')) {
                    return next();
                }
                // Serve the landing page for root and other top-level routes
                if (req.url === '/' || req.url === '/index.html' || req.url === '/about' || req.url === '/research' || req.url === '/previous-work' || req.url === '/contact') {
                    const html = fs.readFileSync(landingPagePath, 'utf-8');
                    res.setHeader('Content-Type', 'text/html');
                    res.end(html);
                    return;
                }
                next();
            });
        },
    }
}

export default defineConfig({
    plugins: [react(), landingPagePlugin()],
    base: '/apps/londoncrime/',
    server: {
        port: 5173,
        proxy: {
            '/apps/londoncrime/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/apps\/londoncrime/, ''),
            },
        },
    },
})
