import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST)

// clean old assets
cleanupOutdatedCaches()

// to allow work offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), {
  denylist: [/^\/__\/auth\/.*/, /^\/auth\/.*/, /firebaseapp\.com/, /googleapis\.com\/identitytoolkit/]
}))

// cache Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 60 // 2 months
      })
    ]
  }),
  'GET'
)

// Firebase messaging configuration
// Note: This will be replaced with actual config during build
const firebaseConfig = {
  apiKey: "{{VITE_FIREBASE_API_KEY}}",
  authDomain: "{{VITE_FIREBASE_AUTH_DOMAIN}}",
  projectId: "{{VITE_FIREBASE_PROJECT_ID}}",
  storageBucket: "{{VITE_FIREBASE_STORAGE_BUCKET}}",
  messagingSenderId: "{{VITE_FIREBASE_MESSAGING_SENDER_ID}}",
  appId: "{{VITE_FIREBASE_APP_ID}}"
};

// Detect if we're running in emulator mode
const isEmulatorMode = "{{BUILD_MODE}}" === 'emulator' || 
                      self.location.hostname === '127.0.0.1' || 
                      self.location.hostname === 'localhost';

// Initialize Firebase only if we have valid config
try {
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('{{')) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    
    if (isEmulatorMode) {
      console.log('[sw] Running in emulator mode - notifications will be simulated');
    }

    // Handle background messages
    messaging.onBackgroundMessage(function(payload) {
      console.log('[sw] Received background message:', payload);
      
      const notificationTitle = payload.notification?.title || 'BlueSlash';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: payload.data?.taskId || 'general',
        data: payload.data,
        actions: [
          {
            action: 'view',
            title: 'View Task',
            icon: '/vite.svg'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.log('[sw] Firebase config not available - running in development mode');
  }
} catch (error) {
  console.error('[sw] Firebase initialization failed:', error);
}

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[sw] Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Handle notification click - open app and navigate to task
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      const data = event.notification.data;
      const url = data?.taskId ? `/#/tasks/${data.taskId}` : '/';
      
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push event (fallback for when FCM doesn't handle it, especially in emulator mode)
self.addEventListener('push', function(event) {
  console.log('[sw] Push event received:', event);
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[sw] Push data:', payload);
      
      // In emulator mode, FCM might not handle notifications properly,
      // so we'll show them manually using the same logic as onBackgroundMessage
      if (isEmulatorMode || !payload.from) { // Show notification if in emulator or if not from FCM
        const notificationTitle = payload.notification?.title || payload.title || 'BlueSlash';
        const notificationOptions = {
          body: payload.notification?.body || payload.body || 'You have a new notification',
          icon: payload.notification?.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: payload.data?.taskId || payload.taskId || 'general',
          data: payload.data || payload,
          actions: [
            {
              action: 'view',
              title: 'View Task',
              icon: '/vite.svg'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        };
        
        console.log('[sw] Showing notification manually:', notificationTitle, notificationOptions);
        event.waitUntil(
          self.registration.showNotification(notificationTitle, notificationOptions)
        );
      }
    } catch (error) {
      console.error('[sw] Error parsing push data:', error);
      
      // If parsing fails, show a default notification in emulator mode
      if (isEmulatorMode) {
        event.waitUntil(
          self.registration.showNotification('BlueSlash', {
            body: 'You have a new notification',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: 'general'
          })
        );
      }
    }
  } else if (isEmulatorMode) {
    // If no data but in emulator mode, show a test notification
    event.waitUntil(
      self.registration.showNotification('BlueSlash', {
        body: 'Test notification received',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test'
      })
    );
  }
});