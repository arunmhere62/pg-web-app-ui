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
      // Use the public API URL for build-time sitemap generation.
      // The Docker build can't use the relative /api/v1 path, so we use the
      // absolute URL. Override with SITEMAP_API_URL env var if needed.
      apiUrl: process.env.SITEMAP_API_URL || 'https://mobapi.indianpgmanagement.com',
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
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'ui-vendor': ['lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          // State management & data
          'data-vendor': ['@reduxjs/toolkit', 'react-redux', 'react-helmet-async'],
          // Form libraries (only loaded on authenticated form screens)
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Utilities
          'util-vendor': ['date-fns', 'sonner'],
        },
      },
    },
  },
})
