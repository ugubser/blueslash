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

// Connect to emulators in development
if (import.meta.env.DEV) {
  // Check if we're running with Firebase emulators
  const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
  
  if (useEmulators) {
    try {
      // Only connect if not already connected
      if (!auth.emulatorConfig) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log('Connected to Auth emulator');
      }
    } catch (error) {
      console.log('Auth emulator connection failed:', error);
    }

    try {
      // Check if Firestore emulator is not already connected
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      console.log('Connected to Firestore emulator');
    } catch (error) {
      console.log('Firestore emulator connection failed (may already be connected):', error);
    }
  }
}

export default app;