import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

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

// Connect to emulators based on build mode
// - 'emulator' mode: Always use emulators (for testing)
// - 'production' mode: Use production Firebase
// - 'development' mode: Use emulators (npm run dev)
const useEmulators = import.meta.env.MODE === 'emulator' || import.meta.env.DEV;

if (useEmulators) {
  console.log(`🔧 Using Firebase emulators (mode: ${import.meta.env.MODE})`);
  
  try {
    // Only connect if not already connected
    if (!auth.emulatorConfig) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('✅ Connected to Auth emulator');
    }
  } catch (error) {
    console.log('❌ Auth emulator connection failed:', error);
  }

  try {
    // Check if Firestore emulator is not already connected
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('✅ Connected to Firestore emulator');
  } catch (error) {
    console.log('❌ Firestore emulator connection failed (may already be connected):', error);
  }
} else {
  console.log(`🚀 Using production Firebase (mode: ${import.meta.env.MODE})`);
}

export default app;