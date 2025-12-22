import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      vueDevTools(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.jpg', 'icon-512x512.jpg'],
        manifest: {
          name: 'Service 360 Operations',
          short_name: 'Service 360',
          description: 'Service 360 Operations - система управления заявками и ресурсами',
          theme_color: '#2b6cb0',
          background_color: '#f7fafc',
          display: 'standalone',
          orientation: 'any',
          scope: '/dtj/ops/',
          start_url: '/dtj/ops/',
          icons: [
            {
              src: 'icon-512x512.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            },
            {
              src: 'icon-512x512.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'icon-512x512.jpg',
              sizes: '384x384',
              type: 'image/jpeg'
            },
            {
              src: 'icon-512x512.jpg',
              sizes: '144x144',
              type: 'image/jpeg'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'weather-api-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 10 // 10 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    // Base path for production deployment
    base: '/dtj/ops/',

    server: {
      host: process.env.VITE_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.VITE_DEV_SERVER_PORT) || 3000,
      proxy: {
        '/auth': {
          target: `http://${process.env.VITE_LOCAL_HOST || '192.168.1.20'}:9180`,
          changeOrigin: true,
          secure: false,
        },

        '/userapi': {
          target: `http://${process.env.VITE_LOCAL_HOST || '192.168.1.20'}:9180/api`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/userapi/, ''),
          secure: false,
        },

        '/userinfo': {
          target: `http://${process.env.VITE_LOCAL_HOST || '192.168.1.20'}:9179/api`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/userinfo/, ''),
          secure: false,
        },
      },
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
  };
});
