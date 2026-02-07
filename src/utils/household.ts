import type { User, Household } from '../types';

/**
 * Determines the user's role in a household.
 * Returns 'head' if the user is the head of household, otherwise 'member'.
 */
export function getUserRole(
  user: User | null,
  household: Household | null
): 'head' | 'member' {
  if (!user || !household) return 'member';
  const userHousehold = user.households?.find(h => h.householdId === household.id);
  return userHousehold?.role || 'member';
}

/**
 * Determines the user's role in a household by household ID.
 * Returns 'head' if the user is the head of household, otherwise 'member'.
 */
export function getUserRoleById(
  user: User | null,
  householdId: string
): 'head' | 'member' {
  if (!user) return 'member';
  const userHousehold = user.households?.find(h => h.householdId === householdId);
  return userHousehold?.role || 'member';
}
