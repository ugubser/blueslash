import { describe, it, expect } from 'vitest';
import { getUserRole, getUserRoleById } from './household';
import type { User, Household } from '../types';

describe('getUserRole', () => {
  const mockHousehold: Household = {
    id: 'household-1',
    name: 'Test Household',
    headOfHousehold: 'user-1',
    members: ['user-1', 'user-2'],
    inviteLinks: [],
    createdAt: new Date(),
  };

  const mockHeadUser: User = {
    id: 'user-1',
    email: 'head@test.com',
    displayName: 'Head User',
    gems: 100,
    households: [
      {
        householdId: 'household-1',
        role: 'head',
        joinedAt: new Date(),
      },
    ],
    currentHouseholdId: 'household-1',
    createdAt: new Date(),
  };

  const mockMemberUser: User = {
    id: 'user-2',
    email: 'member@test.com',
    displayName: 'Member User',
    gems: 50,
    households: [
      {
        householdId: 'household-1',
        role: 'member',
        joinedAt: new Date(),
      },
    ],
    currentHouseholdId: 'household-1',
    createdAt: new Date(),
  };

  it('should return "head" for head of household', () => {
    const role = getUserRole(mockHeadUser, mockHousehold);
    expect(role).toBe('head');
  });

  it('should return "member" for regular member', () => {
    const role = getUserRole(mockMemberUser, mockHousehold);
    expect(role).toBe('member');
  });

  it('should return "member" when user is null', () => {
    const role = getUserRole(null, mockHousehold);
    expect(role).toBe('member');
  });

  it('should return "member" when household is null', () => {
    const role = getUserRole(mockHeadUser, null);
    expect(role).toBe('member');
  });

  it('should return "member" when both are null', () => {
    const role = getUserRole(null, null);
    expect(role).toBe('member');
  });

  it('should return "member" when user not in household', () => {
    const otherUser: User = {
      ...mockHeadUser,
      id: 'user-3',
      households: [],
    };
    const role = getUserRole(otherUser, mockHousehold);
    expect(role).toBe('member');
  });
});

describe('getUserRoleById', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@test.com',
    displayName: 'Test User',
    gems: 100,
    households: [
      {
        householdId: 'household-1',
        role: 'head',
        joinedAt: new Date(),
      },
      {
        householdId: 'household-2',
        role: 'member',
        joinedAt: new Date(),
      },
    ],
    currentHouseholdId: 'household-1',
    createdAt: new Date(),
  };

  it('should return correct role for household-1', () => {
    const role = getUserRoleById(mockUser, 'household-1');
    expect(role).toBe('head');
  });

  it('should return correct role for household-2', () => {
    const role = getUserRoleById(mockUser, 'household-2');
    expect(role).toBe('member');
  });

  it('should return "member" when user is null', () => {
    const role = getUserRoleById(null, 'household-1');
    expect(role).toBe('member');
  });

  it('should return "member" for unknown household', () => {
    const role = getUserRoleById(mockUser, 'unknown-household');
    expect(role).toBe('member');
  });
});
