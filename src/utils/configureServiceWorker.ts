// Utility to configure the service worker with runtime Firebase config
export const configureFirebaseMessagingServiceWorker = async () => {
  try {
    // Get the Firebase config from your app
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    // Register the service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // Send config to service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig
        });
      }
      
      console.log('Firebase messaging service worker registered successfully');
      return registration;
    }
  } catch (error) {
    console.error('Service worker registration failed:', error);
    throw error;
  }
};

export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};