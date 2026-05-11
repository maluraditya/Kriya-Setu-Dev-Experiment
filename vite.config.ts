import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', 'VITE_');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'html-transform',
          transformIndexHtml(html) {
            const siteUrl = env.VITE_SITE_URL || 'https://excellent-academy.demo';
            return html.replace(/%SITE_URL%/g, siteUrl);
          }
        },
        VitePWA({
          registerType: 'prompt',
          includeAssets: ['logo.png', 'favicon.ico', 'images/social-preview.jpg'],
          manifest: {
            id: '/',
            start_url: '/',
            scope: '/',
            name: 'Excellent Academy Digital Textbook',
            short_name: 'Excellent Academy',
            description: 'Immersive, experiential learning platform for Science',
            theme_color: '#B3202F',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: 'logo.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'logo.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          workbox: {
            globPatterns: [
              '**/*.{js,css,html,ico,json,manifest,webmanifest}',
              'images/social-preview.jpg'
            ],
            maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: false, // Changed to false for 'prompt' strategy
            navigateFallback: 'index.html',
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-online',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tailwind-cdn-cache',
                  expiration: {
                    maxEntries: 5,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        rollupOptions: {
          output: {
            manualChunks(id) {
              const normalizedId = id.replace(/\\/g, '/');
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('node_modules/lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('node_modules/recharts')) {
                return 'vendor-charts';
              }
              if (normalizedId.includes('/components/grade-11/biology/')) {
                return 'grade-11-biology';
              }
              if (normalizedId.includes('/components/grade-11/physics/')) {
                const chunkName = path.basename(normalizedId, path.extname(normalizedId)).toLowerCase();
                return `grade-11-physics-${chunkName}`;
              }
              if (normalizedId.includes('/components/grade-11/chemistry/')) {
                return 'grade-11-chemistry';
              }
              if (normalizedId.includes('/components/grade-12/biology/')) {
                return 'grade-12-biology';
              }
              if (normalizedId.includes('/components/grade-12/physics/')) {
                return 'grade-12-physics';
              }
              if (normalizedId.includes('/components/grade-12/chemistry/')) {
                return 'grade-12-chemistry';
              }
            }
          }
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
