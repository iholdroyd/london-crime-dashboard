import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
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
