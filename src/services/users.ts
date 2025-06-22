import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User, NotificationPreferences } from '../types';

export class UserService {
  static async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Get current preferences first
      const userDoc = await getDoc(userRef);
      const currentUser = userDoc.data() as User;
      const currentPreferences = currentUser?.notificationPreferences || {
        email: false,
        push: false,
        taskReminders: true,
        verificationRequests: true
      };

      // Merge with new preferences
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };

      await updateDoc(userRef, {
        notificationPreferences: updatedPreferences,
        updatedAt: serverTimestamp()
      });

      console.log('Notification preferences updated:', updatedPreferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  static async updateNotificationToken(
    userId: string, 
    token: string | null
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        notificationToken: token,
        notificationTokenUpdatedAt: serverTimestamp()
      });

      console.log('Notification token updated for user:', userId);
    } catch (error) {
      console.error('Error updating notification token:', error);
      throw error;
    }
  }

  static async enablePushNotifications(userId: string): Promise<void> {
    await this.updateNotificationPreferences(userId, { push: true });
  }

  static async disablePushNotifications(userId: string): Promise<void> {
    await this.updateNotificationPreferences(userId, { push: false });
    await this.updateNotificationToken(userId, null);
  }

  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data() as User;
      
      return userData?.notificationPreferences || null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  static async ensureNotificationPreferences(userId: string): Promise<void> {
    const preferences = await this.getNotificationPreferences(userId);
    
    if (!preferences) {
      // Set default preferences if they don't exist
      await this.updateNotificationPreferences(userId, {
        email: false,
        push: false,
        taskReminders: false,
        verificationRequests: false
      });
    }
  }
}

export const userService = UserService;