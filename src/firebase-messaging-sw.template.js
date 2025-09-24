// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase config will be injected during build
const firebaseConfig = {
  apiKey: "{{VITE_FIREBASE_API_KEY}}",
  authDomain: "{{VITE_FIREBASE_AUTH_DOMAIN}}",
  projectId: "{{VITE_FIREBASE_PROJECT_ID}}",
  storageBucket: "{{VITE_FIREBASE_STORAGE_BUCKET}}",
  messagingSenderId: "{{VITE_FIREBASE_MESSAGING_SENDER_ID}}",
  appId: "{{VITE_FIREBASE_APP_ID}}"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

const buildTaskTargetUrl = (data = {}) => {
  if (!data.taskId) {
    return '/';
  }

  try {
    const params = new URLSearchParams({ taskId: data.taskId });
    if (data.taskStatus) {
      params.set('taskStatus', data.taskStatus);
    }
    return `/task-board?${params.toString()}`;
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Failed to build task target URL:', error);
    return '/';
  }
};

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'BlueSlash';
  const targetUrl = buildTaskTargetUrl(payload.data);
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.taskId || 'general',
    data: {
      ...payload.data,
      targetUrl,
    },
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

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
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
      const targetUrl = data?.targetUrl || buildTaskTargetUrl(data);
      
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('navigate' in client && targetUrl) {
          client.navigate(targetUrl).catch((error) => {
            console.error('[firebase-messaging-sw.js] Failed to navigate client:', error);
          });
        }
        if ('focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow && targetUrl) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle push event (additional handling for custom logic)
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[firebase-messaging-sw.js] Push data:', payload);
      
      // Firebase messaging will handle the notification display
      // This is just for additional custom logic if needed
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error parsing push data:', error);
    }
  }
});
