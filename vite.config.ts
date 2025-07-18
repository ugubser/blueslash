import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'production' ? [VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Don't fallback on assets with hash (they're immutable)
        dontCacheBustURLsMatching: /^assets\/.*\.[a-f0-9]{8}\.(js|css)$/,
        // Clean up outdated caches on activation
        cleanupOutdatedCaches: true,
        // Skip waiting and claim clients for immediate updates
        skipWaiting: true,
        clientsClaim: true,
        // Skip caching Firebase Auth related URLs to prevent conflicts
        navigateFallbackDenylist: [
          /^\/__\/auth\/.*/,
          /^\/auth\/.*/,
          /firebaseapp\.com/,
          /googleapis\.com\/identitytoolkit/
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      manifest: {
        name: 'BlueSlash',
        short_name: 'BlueSlash',
        description: 'Gamified household task management',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/'
      }
    })] : [])
  ],
}))
