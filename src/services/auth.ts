import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

const googleProvider = new GoogleAuthProvider();
// Add additional scopes and custom parameters for better auth handling
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    console.log('Starting Google sign-in...');
    
    // Check if we're in a secure context (required for Firebase Auth)
    if (!window.isSecureContext && import.meta.env.PROD) {
      throw new Error('Firebase Auth requires HTTPS in production');
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    console.log('Google sign-in successful:', firebaseUser.uid);
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.log('Creating new user document...');
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        households: [],
        gems: 0,
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      console.log('New user created:', newUser);
      return newUser;
    }
    
    const userData = userDoc.data() as User;
    console.log('Existing user found:', userData);
    return userData;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific Firebase Auth errors
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          console.log('User closed the popup');
          return null;
        case 'auth/popup-blocked':
          console.error('Popup was blocked by browser');
          throw new Error('Popup blocked. Please enable popups for this site and try again.');
        case 'auth/cancelled-popup-request':
          console.log('Popup request was cancelled');
          return null;
        case 'auth/unauthorized-domain':
          console.error('Unauthorized domain for Firebase Auth');
          throw new Error('This domain is not authorized for Firebase Auth. Please check your Firebase console settings.');
        case 'auth/operation-not-allowed':
          console.error('Google sign-in not enabled');
          throw new Error('Google sign-in is not enabled. Please contact support.');
        default:
          console.error('Auth error code:', error.code);
      }
    }
    
    // Handle storage access errors specifically
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('storage')) {
      console.error('Storage access error - possibly due to service worker or browser restrictions');
      throw new Error('Authentication failed due to browser restrictions. Please try clearing your browser cache or disabling extensions.');
    }
    
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        callback(userDoc.data() as User);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

export const updateUserGems = async (userId: string, gemsToAdd: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentGems = userDoc.data().gems || 0;
      await updateDoc(userRef, {
        gems: currentGems + gemsToAdd
      });
    }
  } catch (error) {
    console.error('Error updating user gems:', error);
    throw error;
  }
};

export const onAuthStateChangeRealtime = (callback: (user: User | null) => void): Unsubscribe => {
  let userUnsubscribe: Unsubscribe | null = null;
  let isCleanedUp = false; // Flag to prevent race conditions

  const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    // Early exit if already cleaned up
    if (isCleanedUp) return;

    // Clean up previous user subscription
    if (userUnsubscribe) {
      userUnsubscribe();
      userUnsubscribe = null;
    }

    if (firebaseUser) {
      // Subscribe to real-time user document updates
      userUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
        // Check cleanup flag before invoking callback
        if (isCleanedUp) return;

        if (userDoc.exists()) {
          callback(userDoc.data() as User);
        } else {
          callback(null);
        }
      }, (error) => {
        if (isCleanedUp) return;
        console.error('Error subscribing to user document:', error);
        callback(null);
      });
    } else {
      callback(null);
    }
  });

  // Return cleanup function that unsubscribes from both auth and user document
  return () => {
    isCleanedUp = true; // Set flag first to prevent callbacks
    authUnsubscribe();
    if (userUnsubscribe) {
      userUnsubscribe();
    }
  };
};

export const getCurrentUser = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() as User : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};