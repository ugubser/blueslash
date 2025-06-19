import { getToken, onMessage } from 'firebase/messaging';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { messaging, initializeMessaging, db } from './firebase';
import { userService } from './users';

export interface PushSubscription {
  token: string;
  userId: string;
  createdAt: Date;
  lastUsed: Date;
  deviceInfo?: {
    userAgent: string;
    platform: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  taskId?: string;
  userId?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await initializeMessaging();
    
    if (messaging) {
      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        this.showForegroundNotification(payload);
      });
    }

    this.isInitialized = true;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission denied');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async getSubscriptionToken(userId: string): Promise<string | null> {
    try {
      await this.initialize();
      
      if (!messaging) {
        throw new Error('Firebase messaging not supported');
      }

      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Check if we're in emulator mode
      const useEmulators = import.meta.env.MODE === 'emulator' || import.meta.env.DEV;
      
      let token: string;
      
      if (useEmulators) {
        // In emulator mode, create a mock token
        token = `emulator-token-${userId}-${Date.now()}`;
        console.log('🔧 Using emulator mode - generated mock token:', token);
      } else {
        // In production, get real FCM token
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          throw new Error('VAPID public key not configured');
        }

        const realToken = await getToken(messaging, {
          vapidKey: vapidKey
        });

        if (!realToken) {
          console.log('No registration token available.');
          return null;
        }
        
        token = realToken;
      }

      // Save token to user's document
      await this.saveSubscriptionToken(userId, token);
      return token;
    } catch (error) {
      console.error('Error getting subscription token:', error);
      throw error;
    }
  }

  private async saveSubscriptionToken(userId: string, token: string): Promise<void> {
    try {
      // Update user's notification token and enable push notifications
      await userService.updateNotificationToken(userId, token);
      await userService.enablePushNotifications(userId);

      // Also save to a separate subscriptions collection for easier querying
      await addDoc(collection(db, 'pushSubscriptions'), {
        token,
        userId,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      });

      console.log('Subscription token saved successfully');
    } catch (error) {
      console.error('Error saving subscription token:', error);
      throw error;
    }
  }

  private showForegroundNotification(payload: any): void {
    const { notification, data } = payload;
    
    if (Notification.permission === 'granted') {
      const notificationTitle = notification?.title || 'Task Reminder';
      const notificationOptions = {
        body: notification?.body || 'You have a task due soon!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: data,
        tag: 'task-reminder',
        requireInteraction: true
      };

      const notif = new Notification(notificationTitle, notificationOptions);
      
      notif.onclick = () => {
        window.focus();
        if (data?.taskId) {
          // Navigate to task - you'll need to implement this based on your routing
          window.location.href = `/?taskId=${data.taskId}`;
        }
        notif.close();
      };

      // Auto-close after 5 seconds if not interacted with
      setTimeout(() => {
        notif.close();
      }, 5000);
    }
  }

  async unsubscribe(userId: string): Promise<void> {
    try {
      await userService.disablePushNotifications(userId);
      console.log('Successfully unsubscribed from notifications');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  }

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const notificationService = NotificationService.getInstance();