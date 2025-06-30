import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { messaging, db } from './firebase';

export interface NotificationPermissionResult {
  granted: boolean;
  token?: string;
  error?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private currentToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermissionResult> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        return { granted: false, error: 'Notifications not supported in this browser' };
      }

      // Check current permission status
      let permission = Notification.permission;

      // Request permission if not already granted
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        return { granted: false, error: 'Notification permission denied' };
      }

      // Get FCM token
      const token = await this.getMessagingToken();
      
      return { granted: true, token };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { granted: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async getMessagingToken(): Promise<string> {
    try {
      // Use VAPID key if available in environment
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      const token = await getToken(messaging, {
        vapidKey: vapidKey || undefined,
        serviceWorkerRegistration: await this.getServiceWorkerRegistration()
      });

      if (!token) {
        throw new Error('No registration token available');
      }

      this.currentToken = token;
      console.log('FCM Token generated:', token);
      return token;
    } catch (error) {
      console.error('Error getting messaging token:', error);
      throw error;
    }
  }

  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
    if ('serviceWorker' in navigator) {
      try {
        // Check if we already have a registration for messaging
        const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (existingRegistration && existingRegistration.active) {
          console.log('Using existing messaging service worker');
          return existingRegistration;
        }
        
        // Register the messaging service worker (config is injected at build time)
        console.log('Registering messaging service worker');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Messaging service worker ready');
        
        return registration;
      } catch (error) {
        console.error('Service worker registration failed:', error);
        return undefined;
      }
    }
    return undefined;
  }

  async saveTokenToUser(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationToken: token,
        tokenUpdatedAt: new Date()
      });
      console.log('Token saved to user profile');
    } catch (error) {
      console.error('Error saving token to user:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(userId: string, preferences: {
    push: boolean;
    taskReminders: boolean;
    verificationRequests: boolean;
  }): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationPreferences: preferences
      });
      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  setupForegroundMessageHandler(): void {
    onMessage(messaging, (payload: MessagePayload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification if app is in foreground
      if (payload.notification) {
        this.showNotification(payload.notification.title || 'BlueSlash', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/vite.svg',
          badge: '/vite.svg',
          tag: payload.data?.taskId || 'general',
          data: payload.data
        });
      }
    });
  }

  private showNotification(title: string, options: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, options);
      
      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigate to task if taskId is provided
        if (options.data?.taskId) {
          window.location.href = `/#/tasks/${options.data.taskId}`;
        }
        
        notification.close();
      };
    }
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  async refreshToken(): Promise<string | null> {
    try {
      const token = await this.getMessagingToken();
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}

export const notificationService = NotificationService.getInstance();