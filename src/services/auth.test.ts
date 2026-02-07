import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User as FirebaseUser, Unsubscribe } from 'firebase/auth';
import type { User } from '../types';

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(function() {
    this.addScope = vi.fn();
    this.setCustomParameters = vi.fn();
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  onSnapshot: vi.fn(),
}));

vi.mock('./firebase', () => ({
  auth: {},
  db: {},
}));

import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { signInWithGoogle, signOutUser, getCurrentUser, updateUserGems, onAuthStateChangeRealtime } from './auth';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('should sign in with Google and create/update user', async () => {
      const mockFirebaseUser: Partial<FirebaseUser> = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const mockUserCredential = {
        user: mockFirebaseUser,
      };

      const mockUserDoc = {
        exists: () => false,
      };

      vi.mocked(signInWithPopup).mockResolvedValue(mockUserCredential as any);
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockUserDoc as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await signInWithGoogle();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      });
    });

    it('should handle sign-in errors', async () => {
      const error = new Error('Sign in failed');
      vi.mocked(signInWithPopup).mockRejectedValue(error);

      await expect(signInWithGoogle()).rejects.toThrow('Sign in failed');
    });

    it('should handle popup closed by user', async () => {
      const error = { code: 'auth/popup-closed-by-user' };
      vi.mocked(signInWithPopup).mockRejectedValue(error);

      const result = await signInWithGoogle();

      expect(result).toBeNull();
    });
  });

  describe('signOutUser', () => {
    it('should sign out successfully', async () => {
      vi.mocked(firebaseSignOut).mockResolvedValue(undefined);

      await signOutUser();

      expect(firebaseSignOut).toHaveBeenCalled();
    });

    it('should handle sign-out errors', async () => {
      const error = new Error('Sign out failed');
      vi.mocked(firebaseSignOut).mockRejectedValue(error);

      await expect(signOutUser()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when user exists', async () => {
      const mockUser: User = {
        id: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        gems: 100,
        households: [],
        createdAt: new Date(),
      };

      const mockDocSnapshot = {
        exists: () => true,
        data: () => mockUser,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);

      const result = await getCurrentUser('test-uid');

      expect(result).toEqual(mockUser);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should return null when user does not exist', async () => {
      const mockDocSnapshot = {
        exists: () => false,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnapshot as any);

      const result = await getCurrentUser('non-existent-uid');

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Firestore error'));

      const result = await getCurrentUser('test-uid');

      expect(result).toBeNull();
    });
  });

  describe('updateUserGems', () => {
    it('should update user gems by adding positive amount', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({ gems: 100 }),
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockUserDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateUserGems('test-uid', 50);

      expect(getDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith({}, { gems: 150 });
    });

    it('should handle negative gem amounts', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({ gems: 100 }),
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockUserDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateUserGems('test-uid', -25);

      expect(getDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith({}, { gems: 75 });
    });

    it('should throw error when update fails', async () => {
      const mockUserDoc = {
        exists: () => true,
        data: () => ({ gems: 100 }),
      };

      const error = new Error('Update failed');
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockUserDoc as any);
      vi.mocked(updateDoc).mockRejectedValue(error);

      await expect(updateUserGems('test-uid', 50)).rejects.toThrow('Update failed');
    });
  });

  describe('onAuthStateChangeRealtime', () => {
    it('should call callback with user data when authenticated', () => {
      const mockFirebaseUser = {
        uid: 'test-uid',
      } as FirebaseUser;

      const mockUser: User = {
        id: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        gems: 100,
        households: [],
        createdAt: new Date(),
      };

      const mockDocSnapshot = {
        exists: () => true,
        data: () => mockUser,
      };

      let authCallback: (user: FirebaseUser | null) => void;
      let snapshotCallback: (snapshot: any) => void;

      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn(); // unsubscribe function
      });

      vi.mocked(onSnapshot).mockImplementation((docRef, callback) => {
        snapshotCallback = callback as any;
        return vi.fn(); // unsubscribe function
      });

      const userCallback = vi.fn();
      const unsubscribe = onAuthStateChangeRealtime(userCallback);

      // Simulate auth state change
      authCallback!(mockFirebaseUser);

      // Simulate snapshot
      snapshotCallback!(mockDocSnapshot);

      expect(userCallback).toHaveBeenCalledWith(mockUser);

      unsubscribe();
    });

    it('should call callback with null when not authenticated', () => {
      let authCallback: (user: FirebaseUser | null) => void;

      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      const userCallback = vi.fn();
      onAuthStateChangeRealtime(userCallback);

      // Simulate auth state change to null
      authCallback!(null);

      expect(userCallback).toHaveBeenCalledWith(null);
    });

    it('should cleanup subscriptions when unsubscribe is called', () => {
      const authUnsubscribe = vi.fn();
      const userUnsubscribe = vi.fn();

      vi.mocked(onAuthStateChanged).mockReturnValue(authUnsubscribe as any);
      vi.mocked(onSnapshot).mockReturnValue(userUnsubscribe as any);

      const userCallback = vi.fn();
      const unsubscribe = onAuthStateChangeRealtime(userCallback);

      unsubscribe();

      expect(authUnsubscribe).toHaveBeenCalled();
    });

    it('should prevent race conditions with cleanup flag', () => {
      const mockFirebaseUser = {
        uid: 'test-uid',
      } as FirebaseUser;

      let authCallback: (user: FirebaseUser | null) => void;
      let snapshotCallback: (snapshot: any) => void;

      vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      vi.mocked(onSnapshot).mockImplementation((docRef, callback) => {
        snapshotCallback = callback as any;
        return vi.fn();
      });

      const userCallback = vi.fn();
      const unsubscribe = onAuthStateChangeRealtime(userCallback);

      // Unsubscribe immediately
      unsubscribe();

      // Try to trigger callbacks after cleanup
      authCallback!(mockFirebaseUser);

      // Callback should not be called after cleanup
      expect(userCallback).not.toHaveBeenCalled();
    });
  });
});
