/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/DigiBook/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/nominatim': {
          target: 'https://nominatim.openstreetmap.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
          headers: {
            'User-Agent': 'DigiBook-Store/1.0 (contact@digibook.com)'
          }
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'sitemap.xml'],
        manifest: {
          name: 'DigiBook Website',
          short_name: 'DigiBook',
          description: 'Nhà sách trực tuyến hiện đại nhất Việt Nam',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/DigiBook/',
          scope: '/DigiBook/',
          lang: 'vi',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '64x64 32x32 24x24 16x16',
              type: 'image/x-icon'
            },
            {
              src: 'https://placehold.co/192x192/4f46e5/ffffff?text=DB',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://placehold.co/512x512/4f46e5/ffffff?text=DigiBook',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'external-images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 Days
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Tách Firebase thành chunk riêng
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            // Tách Framer Motion thành chunk riêng
            'framer-motion': ['framer-motion'],
            // Tách React Hot Toast
            'react-hot-toast': ['react-hot-toast'],
            // Tách React Router
            'react-router': ['react-router-dom'],
          }
        }
      },
      // Tăng chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    }
  };
});
