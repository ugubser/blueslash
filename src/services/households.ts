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
import type { Household, InviteLink, User } from '../types';
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
    
    await updateDoc(doc(db, 'users', headOfHouseholdId), {
      householdId,
      role: 'head'
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

    // Add user to household if not already a member
    if (!targetHousehold.members.includes(userId)) {
      await updateDoc(doc(db, 'households', targetHousehold.id), {
        members: arrayUnion(userId)
      });

      await updateDoc(doc(db, 'users', userId), {
        householdId: targetHousehold.id,
        role: 'member'
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