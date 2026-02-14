import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { onAuthStateChangeRealtime, signInWithGoogle, signOutUser, getCurrentUser } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChangeRealtime((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (): Promise<User | null> => {
    try {
      const user = await signInWithGoogle();
      setUser(user);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      const updatedUser = await getCurrentUser(user.id);
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};