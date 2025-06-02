import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    console.log('Starting Google sign-in...');
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
        role: 'member',
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
          break;
        case 'auth/cancelled-popup-request':
          console.log('Popup request was cancelled');
          return null;
        default:
          console.error('Auth error code:', error.code);
      }
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

export const getCurrentUser = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() as User : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};