import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec);

// Custom plugin to process Firebase messaging service worker
const processMessagingPlugin = (mode: string) => ({
  name: 'process-messaging-sw',
  closeBundle: async () => {
    try {
      await execAsync(`node scripts/process-messaging-sw.js --mode ${mode}`);
    } catch (error) {
      console.error('Failed to process messaging service worker:', error);
    }
  }
});

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'production' || mode === 'emulator' ? [VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
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
                maxAgeSeconds: 60 * 60 * 24 * 60 // 2 months
              }
            }
          }
        ]
      },
      manifest: {
        name: 'BlueSlash',
        short_name: 'BlueSlash',
        description: 'Gamified household task and information management',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }), processMessagingPlugin(mode)] : [])
  ],
  // Copy static assets including notification icons

  assetsInclude: ['**/*.png', '**/*.svg'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep notification icons at root level
          if (assetInfo.name && (assetInfo.name.includes('icon-') || assetInfo.name.includes('badge-'))) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
}))
