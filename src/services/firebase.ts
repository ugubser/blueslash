import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
// Firebase Messaging requires service workers — not available in native WKWebView
export const messaging: Messaging | null = Capacitor.isNativePlatform() ? null : getMessaging(app);

// Connect to emulators based on build mode
// - 'emulator' mode: Always use emulators (for testing)
// - 'production' mode: Use production Firebase
// - 'development' mode: Use emulators (npm run dev)
const useEmulators = import.meta.env.MODE === 'emulator' || import.meta.env.DEV;

if (useEmulators) {
  console.log(`🔧 Using Firebase emulators (mode: ${import.meta.env.MODE})`);
  console.log(`📦 Project ID: ${firebaseConfig.projectId}`);
  console.log(`🌍 Environment:`, {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    useEmulators
  });
  
  // Check if we're already connected to emulators
  const alreadyConnected = {
    auth: !!auth.emulatorConfig,
    firestore: false,
    functions: false,
    storage: false
  };

  try {
    // Connect to Auth emulator
    if (!alreadyConnected.auth) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('✅ Connected to Auth emulator (port 9099)');
      console.log('🔍 Auth emulator config:', auth.emulatorConfig);
    } else {
      console.log('🔄 Auth emulator already connected');
      console.log('🔍 Existing auth emulator config:', auth.emulatorConfig);
    }
  } catch (error) {
    console.error('❌ Auth emulator connection failed:', error);
    console.error('⚠️  WARNING: Will use production Firebase Auth!');
  }

  try {
    // Connect to Firestore emulator (port 8081 based on firebase.json)
    connectFirestoreEmulator(db, '127.0.0.1', 8081);
    console.log('✅ Connected to Firestore emulator (port 8081)');
    alreadyConnected.firestore = true;
  } catch (error) {
    console.error('❌ Firestore emulator connection failed:', error);
    console.error('   Make sure Firebase emulators are running: firebase emulators:start');
    console.error('   Expected Firestore emulator on port 8081');
  }

  try {
    // Connect to Functions emulator
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log('✅ Connected to Functions emulator (port 5001)');
    alreadyConnected.functions = true;
  } catch (error) {
    console.error('❌ Functions emulator connection failed:', error);
  }

  try {
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    console.log('✅ Connected to Storage emulator (port 9199)');
    alreadyConnected.storage = true;
  } catch (error) {
    console.error('❌ Storage emulator connection failed:', error);
  }

  // Verify connections
  console.log('🔍 Emulator connection status:', alreadyConnected);
  console.log(`📋 Emulator UI: http://127.0.0.1:4000`);
  console.log(`🌐 Hosting emulator: http://127.0.0.1:5003`);
  console.log(`🗄️ Firestore emulator: http://127.0.0.1:8081`);
  
  // Warn if Firestore connection failed
  if (!alreadyConnected.firestore) {
    console.warn('⚠️  WARNING: Firestore emulator connection failed - you may be using PRODUCTION database!');
  }
} else {
  console.log(`🚀 Using production Firebase (mode: ${import.meta.env.MODE})`);
  console.log(`📦 Project ID: ${firebaseConfig.projectId}`);
}

export default app;
