import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { messaging, db } from './firebase';
import type { NotificationPreferences } from '../types';

const buildTaskTargetUrl = (data?: Record<string, unknown>): string | null => {
  if (!data || typeof data.taskId !== 'string') {
    return null;
  }

  const params = new URLSearchParams({ taskId: data.taskId });
  if (typeof data.taskStatus === 'string' && data.taskStatus.length > 0) {
    params.set('taskStatus', data.taskStatus);
  }

  return `/task-board?${params.toString()}`;
};

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
        // Use the existing PWA service worker registration that includes Firebase messaging
        const existingRegistration = await navigator.serviceWorker.getRegistration('/');
        if (existingRegistration && existingRegistration.active) {
          console.log('Using existing PWA service worker with messaging');
          return existingRegistration;
        }
        
        // In development or if no registration exists, wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        const registration = await navigator.serviceWorker.getRegistration('/');
        
        if (registration) {
          console.log('PWA service worker with messaging ready');
          return registration;
        }
        
        console.warn('No service worker registration found');
        return undefined;
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

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
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
        const targetUrl = payload.data?.targetUrl || buildTaskTargetUrl(payload.data || {});
        this.showNotification(payload.notification.title || 'BlueSlash', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/vite.svg',
          badge: '/vite.svg',
          tag: payload.data?.taskId || 'general',
          data: {
            ...payload.data,
            targetUrl,
          }
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
        
        const targetUrl = options.data?.targetUrl || buildTaskTargetUrl(options.data);
        if (targetUrl) {
          window.location.href = targetUrl;
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
