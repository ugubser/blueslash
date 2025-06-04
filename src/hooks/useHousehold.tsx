import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Household, User } from '../types';
import { getHousehold, getHouseholdMembers, getUserHouseholds, switchHousehold } from '../services/households';
import { useAuth } from './useAuth';

interface HouseholdContextType {
  household: Household | null;
  members: User[];
  userHouseholds: Household[];
  loading: boolean;
  refreshHousehold: () => Promise<void>;
  switchCurrentHousehold: (householdId: string) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [userHouseholds, setUserHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshHousehold = async () => {
    if (!user?.currentHouseholdId) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [householdData, membersData, householdsData] = await Promise.all([
        getHousehold(user.currentHouseholdId),
        getHouseholdMembers(user.currentHouseholdId),
        getUserHouseholds(user.id)
      ]);
      
      setHousehold(householdData);
      setMembers(membersData);
      setUserHouseholds(householdsData);
    } catch (error) {
      console.error('Error loading household:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchCurrentHousehold = async (householdId: string) => {
    if (!user) return;
    
    try {
      await switchHousehold(user.id, householdId);
      await refreshUser(); // Refresh user data to get updated currentHouseholdId
      await refreshHousehold(); // Refresh household data
    } catch (error) {
      console.error('Error switching household:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      refreshHousehold();
    } else {
      setHousehold(null);
      setMembers([]);
      setUserHouseholds([]);
      setLoading(false);
    }
  }, [user]);

  return (
    <HouseholdContext.Provider value={{ 
      household, 
      members, 
      userHouseholds, 
      loading, 
      refreshHousehold, 
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