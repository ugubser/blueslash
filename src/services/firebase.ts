import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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

// Connect to emulators based on build mode
// - 'emulator' mode: Always use emulators (for testing)
// - 'production' mode: Use production Firebase
// - 'development' mode: Use emulators (npm run dev)
const useEmulators = import.meta.env.MODE === 'emulator' || import.meta.env.DEV;

if (useEmulators) {
  console.log(`🔧 Using Firebase emulators (mode: ${import.meta.env.MODE})`);
  
  try {
    // Connect to Auth emulator
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('✅ Connected to Auth emulator (port 9099)');
    }
  } catch (error) {
    console.log('❌ Auth emulator connection failed:', error);
  }

  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('✅ Connected to Firestore emulator (port 8080)');
  } catch (error) {
    console.log('❌ Firestore emulator connection failed (may already be connected):', error);
  }

  try {
    // Connect to Functions emulator
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log('✅ Connected to Functions emulator (port 5001)');
  } catch (error) {
    console.log('❌ Functions emulator connection failed (may already be connected):', error);
  }

  try {
    // Connect to Storage emulator
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    console.log('✅ Connected to Storage emulator (port 9199)');
  } catch (error) {
    console.log('❌ Storage emulator connection failed (may already be connected):', error);
  }

  console.log(`📋 Emulator UI available at: http://127.0.0.1:4000`);
  console.log(`🌐 Hosting emulator available at: http://127.0.0.1:5003`);
} else {
  console.log(`🚀 Using production Firebase (mode: ${import.meta.env.MODE})`);
}

export default app;