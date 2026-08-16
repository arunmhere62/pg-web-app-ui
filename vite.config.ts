import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { sitemapPlugin } from './vite-plugin-sitemap'

const HOSTNAME = 'https://www.indianpgmanagement.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sitemapPlugin({
      hostname: HOSTNAME,
      routes: [
        { path: '/home', priority: 1.0, changefreq: 'daily' },
        { path: '/pg-directory', priority: 0.9, changefreq: 'daily' },
        { path: '/subscriptions', priority: 0.8, changefreq: 'weekly' },
        { path: '/about', priority: 0.7, changefreq: 'monthly' },
        { path: '/contact', priority: 0.7, changefreq: 'monthly' },
        { path: '/faq', priority: 0.6, changefreq: 'monthly' },
        { path: '/software-services', priority: 0.6, changefreq: 'monthly' },
        { path: '/terms', priority: 0.3, changefreq: 'yearly' },
        { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
        { path: '/refund-policy', priority: 0.3, changefreq: 'yearly' },
      ],
    }),
  ],
  server: {
    port: 5100,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Copy public folder files (robots.txt, manifest.json, sitemap.xml) to dist
    copyPublicDir: true,
  },
})
