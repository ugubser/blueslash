import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Household, User } from '../types';
import { getHousehold, getHouseholdMembers } from '../services/households';
import { useAuth } from './useAuth';

interface HouseholdContextType {
  household: Household | null;
  members: User[];
  loading: boolean;
  refreshHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshHousehold = async () => {
    if (!user?.householdId) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [householdData, membersData] = await Promise.all([
        getHousehold(user.householdId),
        getHouseholdMembers(user.householdId)
      ]);
      
      setHousehold(householdData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading household:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHousehold();
  }, [user]);

  return (
    <HouseholdContext.Provider value={{ household, members, loading, refreshHousehold }}>
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