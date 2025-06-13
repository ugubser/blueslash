import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Household, User } from '../types';
import { subscribeToHousehold, subscribeToHouseholdMembers, getUserHouseholds, switchHousehold } from '../services/households';
import { useAuth } from './useAuth';

interface HouseholdContextType {
  household: Household | null;
  members: User[];
  userHouseholds: Household[];
  loading: boolean;
  switchCurrentHousehold: (householdId: string) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [userHouseholds, setUserHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserHouseholds = useCallback(async () => {
    if (!user) {
      setUserHouseholds([]);
      return;
    }

    try {
      const householdsData = await getUserHouseholds(user.id);
      setUserHouseholds(householdsData);
    } catch (error) {
      console.error('Error loading user households:', error);
      setUserHouseholds([]);
    }
  }, [user]);

  const switchCurrentHousehold = async (householdId: string) => {
    if (!user) return;
    
    try {
      await switchHousehold(user.id, householdId);
      await refreshUser(); // Refresh user data to get updated currentHouseholdId
    } catch (error) {
      console.error('Error switching household:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!user?.currentHouseholdId) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to household data
    const unsubscribeHousehold = subscribeToHousehold(
      user.currentHouseholdId,
      (householdData) => {
        setHousehold(householdData);
        setLoading(false);
      }
    );

    // Subscribe to household members
    const unsubscribeMembers = subscribeToHouseholdMembers(
      user.currentHouseholdId,
      (membersData) => {
        setMembers(membersData);
      }
    );

    return () => {
      unsubscribeHousehold();
      unsubscribeMembers();
    };
  }, [user?.currentHouseholdId]);

  useEffect(() => {
    if (user) {
      loadUserHouseholds();
    } else {
      setHousehold(null);
      setMembers([]);
      setUserHouseholds([]);
      setLoading(false);
    }
  }, [user, loadUserHouseholds]);

  return (
    <HouseholdContext.Provider value={{ 
      household, 
      members, 
      userHouseholds, 
      loading, 
      switchCurrentHousehold 
    }}>
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = (): HouseholdContextType => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};