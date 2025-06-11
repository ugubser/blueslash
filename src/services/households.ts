import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import type { Household, InviteLink, User, UserHousehold } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createHousehold = async (name: string, headOfHouseholdId: string): Promise<Household> => {
  try {
    const householdId = uuidv4();
    const household: Household = {
      id: householdId,
      name,
      headOfHousehold: headOfHouseholdId,
      members: [headOfHouseholdId],
      inviteLinks: [],
      createdAt: new Date()
    };

    await setDoc(doc(db, 'households', householdId), household);
    
    // Add household to user's households array and set as current
    const userHousehold: UserHousehold = {
      householdId,
      role: 'head',
      joinedAt: new Date()
    };
    
    await updateDoc(doc(db, 'users', headOfHouseholdId), {
      households: arrayUnion(userHousehold),
      currentHouseholdId: householdId
    });

    return household;
  } catch (error) {
    console.error('Error creating household:', error);
    throw error;
  }
};

export const generateInviteLink = async (householdId: string): Promise<string> => {
  try {
    const token = uuidv4();
    const inviteLink: InviteLink = {
      memberId: uuidv4(),
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    await updateDoc(doc(db, 'households', householdId), {
      inviteLinks: arrayUnion(inviteLink)
    });

    return `${window.location.origin}/invite/${token}`;
  } catch (error) {
    console.error('Error generating invite link:', error);
    throw error;
  }
};

export const joinHouseholdByInvite = async (token: string, userId: string): Promise<Household> => {
  try {
    // Get all households and search for the token manually
    // This is needed because Firestore doesn't support complex queries on array elements
    const householdsSnapshot = await getDocs(collection(db, 'households'));
    
    let targetHousehold: Household | null = null;
    let targetInviteLink: InviteLink | null = null;
    
    for (const doc of householdsSnapshot.docs) {
      const household = doc.data() as Household;
      const inviteLink = household.inviteLinks?.find(link => link.token === token);
      
      if (inviteLink) {
        targetHousehold = household;
        targetInviteLink = inviteLink;
        break;
      }
    }
    
    if (!targetHousehold || !targetInviteLink) {
      throw new Error('Invalid or expired invite link');
    }
    
    // Check if invite link is expired
    if (targetInviteLink.expiresAt) {
      const expirationDate = targetInviteLink.expiresAt instanceof Date 
        ? targetInviteLink.expiresAt 
        : new Date(targetInviteLink.expiresAt);
        
      if (expirationDate < new Date()) {
        throw new Error('Invalid or expired invite link');
      }
    }

    // Check if user is already a member of this household
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data() as User;
    const isAlreadyMember = userData.households?.some(h => h.householdId === targetHousehold.id);
    
    if (!isAlreadyMember) {
      // Add user to household members list
      await updateDoc(doc(db, 'households', targetHousehold.id), {
        members: arrayUnion(userId)
      });

      // Add household to user's households array and set as current
      const userHousehold: UserHousehold = {
        householdId: targetHousehold.id,
        role: 'member',
        joinedAt: new Date()
      };
      
      await updateDoc(doc(db, 'users', userId), {
        households: arrayUnion(userHousehold),
        currentHouseholdId: targetHousehold.id
      });
    } else {
      // User is already a member, just set it as their current household
      await updateDoc(doc(db, 'users', userId), {
        currentHouseholdId: targetHousehold.id
      });
    }

    return targetHousehold;
  } catch (error) {
    console.error('Error joining household:', error);
    throw error;
  }
};

export const getHousehold = async (householdId: string): Promise<Household | null> => {
  try {
    const householdDoc = await getDoc(doc(db, 'households', householdId));
    return householdDoc.exists() ? householdDoc.data() as Household : null;
  } catch (error) {
    console.error('Error getting household:', error);
    throw error;
  }
};

export const getHouseholdMembers = async (householdId: string): Promise<User[]> => {
  try {
    const household = await getHousehold(householdId);
    if (!household) return [];

    const memberPromises = household.members.map(async (memberId) => {
      const userDoc = await getDoc(doc(db, 'users', memberId));
      return userDoc.exists() ? userDoc.data() as User : null;
    });

    const members = await Promise.all(memberPromises);
    return members.filter(member => member !== null) as User[];
  } catch (error) {
    console.error('Error getting household members:', error);
    throw error;
  }
};

export const removeInviteLink = async (householdId: string, token: string): Promise<void> => {
  try {
    const household = await getHousehold(householdId);
    if (!household) return;

    const linkToRemove = household.inviteLinks.find(link => link.token === token);
    if (linkToRemove) {
      await updateDoc(doc(db, 'households', householdId), {
        inviteLinks: arrayRemove(linkToRemove)
      });
    }
  } catch (error) {
    console.error('Error removing invite link:', error);
    throw error;
  }
};

export const switchHousehold = async (userId: string, householdId: string): Promise<void> => {
  try {
    // Verify user is a member of this household
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data() as User;
    const isMember = userData.households?.some(h => h.householdId === householdId);
    
    if (!isMember) {
      throw new Error('User is not a member of this household');
    }
    
    await updateDoc(doc(db, 'users', userId), {
      currentHouseholdId: householdId
    });
  } catch (error) {
    console.error('Error switching household:', error);
    throw error;
  }
};

export const removeMemberFromHousehold = async (householdId: string, memberId: string, requesterId: string): Promise<void> => {
  try {
    const household = await getHousehold(householdId);
    if (!household) {
      throw new Error('Household not found');
    }
    
    // Only head of household can remove members
    if (household.headOfHousehold !== requesterId) {
      throw new Error('Only the head of household can remove members');
    }
    
    // Cannot remove the head of household
    if (memberId === household.headOfHousehold) {
      throw new Error('Cannot remove the head of household');
    }
    
    // Remove user from household members list
    await updateDoc(doc(db, 'households', householdId), {
      members: arrayRemove(memberId)
    });
    
    // Remove household from user's households array
    const userDoc = await getDoc(doc(db, 'users', memberId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const userHouseholds = userData.households || [];
      const updatedHouseholds = userHouseholds.filter(h => h.householdId !== householdId);
      
      const updateData: { households: UserHousehold[]; currentHouseholdId?: string | null } = {
        households: updatedHouseholds
      };
      
      // If this was their current household, clear it
      if (userData.currentHouseholdId === householdId) {
        updateData.currentHouseholdId = updatedHouseholds.length > 0 ? updatedHouseholds[0].householdId : null;
      }
      
      await updateDoc(doc(db, 'users', memberId), updateData);
    }
  } catch (error) {
    console.error('Error removing member from household:', error);
    throw error;
  }
};

export const getUserHouseholds = async (userId: string): Promise<Household[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data() as User;
    
    if (!userData.households || userData.households.length === 0) {
      return [];
    }
    
    const householdPromises = userData.households.map(async (userHousehold) => {
      const householdDoc = await getDoc(doc(db, 'households', userHousehold.householdId));
      return householdDoc.exists() ? householdDoc.data() as Household : null;
    });
    
    const households = await Promise.all(householdPromises);
    return households.filter(household => household !== null) as Household[];
  } catch (error) {
    console.error('Error getting user households:', error);
    throw error;
  }
};