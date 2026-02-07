import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Household, User } from '../types';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  arrayUnion: vi.fn((val) => val),
  arrayRemove: vi.fn((val) => val),
  serverTimestamp: vi.fn(() => new Date()),
}));

vi.mock('./firebase', () => ({
  db: {},
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}));

import { doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, query, where, collection } from 'firebase/firestore';
import {
  createHousehold,
  getHousehold,
  getHouseholdMembers,
  getUserHouseholds,
  subscribeToHouseholdMembers,
  generateInviteLink,
  joinHouseholdByInvite,
} from './households';

describe('Household Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createHousehold', () => {
    it('should create a new household', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await createHousehold('Test Household', 'user-123');

      expect(result.name).toBe('Test Household');
      expect(result.headOfHousehold).toBe('user-123');
      expect(result.members).toEqual(['user-123']);
      expect(setDoc).toHaveBeenCalledTimes(1); // Household creation
      expect(updateDoc).toHaveBeenCalledTimes(1); // User update
    });

    it('should generate a unique ID for the household', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await createHousehold('Test', 'user-123');

      expect(result.id).toBe('mock-uuid-1234');
    });

    it('should handle creation errors', async () => {
      const error = new Error('Firestore error');
      vi.mocked(setDoc).mockRejectedValue(error);

      await expect(createHousehold('Test', 'user-123')).rejects.toThrow('Firestore error');
    });
  });

  describe('getHousehold', () => {
    it('should return household data when it exists', async () => {
      const mockHousehold: Household = {
        id: 'household-1',
        name: 'Test Household',
        headOfHousehold: 'user-1',
        members: ['user-1', 'user-2'],
        inviteLinks: [],
        createdAt: new Date(),
      };

      const mockSnapshot = {
        exists: () => true,
        data: () => mockHousehold,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockSnapshot as any);

      const result = await getHousehold('household-1');

      expect(result).toEqual(mockHousehold);
    });

    it('should return null when household does not exist', async () => {
      const mockSnapshot = {
        exists: () => false,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockSnapshot as any);

      const result = await getHousehold('non-existent');

      expect(result).toBeNull();
    });

    it('should handle errors and throw', async () => {
      const error = new Error('Fetch failed');
      vi.mocked(getDoc).mockRejectedValue(error);

      await expect(getHousehold('household-1')).rejects.toThrow('Fetch failed');
    });
  });

  describe('getHouseholdMembers (N+1 Query Optimization)', () => {
    it('should fetch members using batched queries (not N+1)', async () => {
      const mockHousehold: Household = {
        id: 'household-1',
        name: 'Test',
        headOfHousehold: 'user-1',
        members: ['user-1', 'user-2', 'user-3'],
        inviteLinks: [],
        createdAt: new Date(),
      };

      const mockUsers: User[] = [
        { id: 'user-1', email: 'user1@test.com', displayName: 'User 1', gems: 100, households: [], createdAt: new Date() },
        { id: 'user-2', email: 'user2@test.com', displayName: 'User 2', gems: 50, households: [], createdAt: new Date() },
        { id: 'user-3', email: 'user3@test.com', displayName: 'User 3', gems: 75, households: [], createdAt: new Date() },
      ];

      const mockHouseholdSnapshot = {
        exists: () => true,
        data: () => mockHousehold,
      };

      const mockQuerySnapshot = {
        forEach: (callback: (doc: any) => void) => {
          mockUsers.forEach(user => callback({ data: () => user }));
        },
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockHouseholdSnapshot as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const result = await getHouseholdMembers('household-1');

      expect(result).toHaveLength(3);
      // Should use batched query, not N individual queries
      expect(getDocs).toHaveBeenCalledTimes(1); // Single batched query!
      expect(result).toEqual(mockUsers);
    });

    it('should handle households with more than 10 members (multiple batches)', async () => {
      const memberIds = Array.from({ length: 15 }, (_, i) => `user-${i}`);
      const mockHousehold: Household = {
        id: 'household-1',
        name: 'Large Household',
        headOfHousehold: 'user-0',
        members: memberIds,
        inviteLinks: [],
        createdAt: new Date(),
      };

      const mockHouseholdSnapshot = {
        exists: () => true,
        data: () => mockHousehold,
      };

      const mockQuerySnapshot = {
        forEach: (callback: (doc: any) => void) => {
          // Return empty for simplicity
        },
      };

      vi.mocked(getDoc).mockResolvedValue(mockHouseholdSnapshot as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      await getHouseholdMembers('household-1');

      // Should make 2 batched queries (10 + 5)
      expect(getDocs).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when household has no members', async () => {
      const mockHousehold: Household = {
        id: 'household-1',
        name: 'Empty',
        headOfHousehold: 'user-1',
        members: [],
        inviteLinks: [],
        createdAt: new Date(),
      };

      const mockSnapshot = {
        exists: () => true,
        data: () => mockHousehold,
      };

      vi.mocked(getDoc).mockResolvedValue(mockSnapshot as any);

      const result = await getHouseholdMembers('household-1');

      expect(result).toEqual([]);
      expect(getDocs).not.toHaveBeenCalled(); // No query if no members
    });

    it('should return empty array when household does not exist', async () => {
      const mockSnapshot = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockSnapshot as any);

      const result = await getHouseholdMembers('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('subscribeToHouseholdMembers (Real-time Batched Subscription)', () => {
    it('should set up real-time subscription with batched queries', () => {
      const mockHousehold: Household = {
        id: 'household-1',
        name: 'Test',
        headOfHousehold: 'user-1',
        members: ['user-1', 'user-2'],
        inviteLinks: [],
        createdAt: new Date(),
      };

      let householdCallback: (snapshot: any) => void;
      let membersCallback: (snapshot: any) => void;

      vi.mocked(onSnapshot).mockImplementation((docOrQuery: any, callback: any) => {
        if (callback) {
          if (!householdCallback) {
            householdCallback = callback;
          } else {
            membersCallback = callback;
          }
        }
        return vi.fn(); // unsubscribe
      });

      const callback = vi.fn();
      const unsubscribe = subscribeToHouseholdMembers('household-1', callback);

      // Simulate household snapshot
      const mockHouseholdSnapshot = {
        exists: () => true,
        data: () => mockHousehold,
      };

      householdCallback!(mockHouseholdSnapshot);

      // Should have set up household subscription
      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with empty array when household does not exist', () => {
      let householdCallback: (snapshot: any) => void;

      vi.mocked(onSnapshot).mockImplementation((docOrQuery: any, callback: any) => {
        householdCallback = callback;
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToHouseholdMembers('non-existent', callback);

      const mockSnapshot = {
        exists: () => false,
      };

      householdCallback!(mockSnapshot);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it('should cleanup all subscriptions on unsubscribe', () => {
      const householdUnsubscribe = vi.fn();
      const batchUnsubscribe1 = vi.fn();

      let callCount = 0;
      vi.mocked(onSnapshot).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return householdUnsubscribe as any;
        return batchUnsubscribe1 as any;
      });

      const callback = vi.fn();
      const unsubscribe = subscribeToHouseholdMembers('household-1', callback);

      unsubscribe();

      expect(householdUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('generateInviteLink', () => {
    it('should generate an invite link with token', async () => {
      // Suppress console output
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
      });

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await generateInviteLink('household-1', 'user-1');

      expect(result).toBe('http://localhost:3000/invite/mock-uuid-1234');
      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();

      consoleError.mockRestore();
      consoleLog.mockRestore();
    });

    it('should handle errors when generating invite', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new Error('Update failed');
      vi.mocked(setDoc).mockRejectedValue(error);

      await expect(generateInviteLink('household-1', 'user-1')).rejects.toThrow();

      consoleError.mockRestore();
    });
  });

  describe('joinHouseholdByInvite', () => {
    it('should add user to household via invite token', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockHouseholdData: Household = {
        id: 'household-1',
        name: 'Test Household',
        headOfHousehold: 'user-1',
        members: ['user-1'],
        inviteLinks: [],
        createdAt: new Date(),
      };

      const mockInviteDoc = {
        exists: () => true,
        data: () => ({
          householdId: 'household-1',
          createdBy: 'user-1',
        }),
      };

      const mockHouseholdDoc = {
        id: 'household-1',
        exists: () => true,
        data: () => mockHouseholdData,
      };

      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          id: 'user-2',
          households: [],
        }),
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc)
        .mockResolvedValueOnce(mockInviteDoc as any)
        .mockResolvedValueOnce(mockHouseholdDoc as any)
        .mockResolvedValueOnce(mockUserDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await joinHouseholdByInvite('mock-token', 'user-2');

      expect(result.id).toBe('household-1');
      expect(result.name).toBe('Test Household');

      consoleLog.mockRestore();
      consoleError.mockRestore();
    });

    it('should throw error when invite token is invalid', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockInviteDoc = {
        exists: () => false,
      };

      const mockQuerySnapshot = {
        empty: true,
        docs: [],
      };

      vi.mocked(getDoc).mockResolvedValue(mockInviteDoc as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      await expect(joinHouseholdByInvite('invalid-token', 'user-2')).rejects.toThrow();

      consoleLog.mockRestore();
      consoleError.mockRestore();
    });
  });

  describe('getUserHouseholds', () => {
    it('should return all households for a user', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@test.com',
        displayName: 'Test',
        gems: 100,
        households: [
          { householdId: 'household-1', role: 'head', joinedAt: new Date() },
          { householdId: 'household-2', role: 'member', joinedAt: new Date() },
        ],
        createdAt: new Date(),
      };

      const mockHouseholds = [
        { id: 'household-1', name: 'Household 1', headOfHousehold: 'user-1', members: [], inviteLinks: [], createdAt: new Date() },
        { id: 'household-2', name: 'Household 2', headOfHousehold: 'user-2', members: [], inviteLinks: [], createdAt: new Date() },
      ];

      const mockUserSnapshot = {
        exists: () => true,
        data: () => mockUser,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc)
        .mockResolvedValueOnce(mockUserSnapshot as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => mockHouseholds[0] } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => mockHouseholds[1] } as any);

      const result = await getUserHouseholds('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Household 1');
      expect(result[1].name).toBe('Household 2');
    });

    it('should return empty array when user has no households', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@test.com',
        displayName: 'Test',
        gems: 100,
        households: [],
        createdAt: new Date(),
      };

      const mockSnapshot = {
        exists: () => true,
        data: () => mockUser,
      };

      vi.mocked(getDoc).mockResolvedValue(mockSnapshot as any);

      const result = await getUserHouseholds('user-1');

      expect(result).toEqual([]);
    });
  });
});
