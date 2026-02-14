import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
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
  private nativeListenersSetUp = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermissionResult> {
    if (Capacitor.isNativePlatform()) {
      return this.requestNativePermission();
    }
    return this.requestWebPermission();
  }

  private async requestNativePermission(): Promise<NotificationPermissionResult> {
    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      const permResult = await FirebaseMessaging.requestPermissions();
      if (permResult.receive !== 'granted') {
        return { granted: false, error: 'Notification permission denied' };
      }

      const { token } = await FirebaseMessaging.getToken();
      this.currentToken = token;
      console.log('Native FCM token:', token);

      return { granted: true, token };
    } catch (error) {
      console.error('Error requesting native notification permission:', error);
      return { granted: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async requestWebPermission(): Promise<NotificationPermissionResult> {
    try {
      if (!('Notification' in window)) {
        return { granted: false, error: 'Notifications not supported in this browser' };
      }

      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        return { granted: false, error: 'Notification permission denied' };
      }

      const token = await this.getMessagingToken();

      return { granted: true, token };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { granted: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async getMessagingToken(): Promise<string> {
    try {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

      if (!messaging) {
        throw new Error('Firebase Messaging not available on this platform');
      }
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
        const existingRegistration = await navigator.serviceWorker.getRegistration('/');
        if (existingRegistration && existingRegistration.active) {
          console.log('Using existing PWA service worker with messaging');
          return existingRegistration;
        }

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

  async setupNativeListeners(): Promise<void> {
    if (this.nativeListenersSetUp) return;
    this.nativeListenersSetUp = true;

    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      await FirebaseMessaging.addListener('notificationReceived', (event) => {
        console.log('Native foreground notification:', event.notification);
      });

      await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
        console.log('Native notification tapped:', event);
        const data = event.notification?.data as Record<string, unknown> | undefined;
        const targetUrl = (typeof data?.targetUrl === 'string' ? data.targetUrl : null)
          || buildTaskTargetUrl(data);
        if (targetUrl) {
          window.location.href = targetUrl;
        }
      });

      await FirebaseMessaging.addListener('tokenReceived', (event) => {
        console.log('Native FCM token refreshed:', event.token);
        this.currentToken = event.token;
      });

      console.log('Native notification listeners set up');
    } catch (error) {
      console.error('Error setting up native listeners:', error);
    }
  }

  setupForegroundMessageHandler(): void {
    if (!messaging) return;
    onMessage(messaging, (payload: MessagePayload) => {
      console.log('Foreground message received:', payload);

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

  async checkNativePermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      const result = await FirebaseMessaging.checkPermissions();
      if (result.receive === 'granted') return 'granted';
      if (result.receive === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  async refreshToken(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
        const { token } = await FirebaseMessaging.getToken();
        this.currentToken = token;
        return token;
      }
      const token = await this.getMessagingToken();
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}

export const notificationService = NotificationService.getInstance();
