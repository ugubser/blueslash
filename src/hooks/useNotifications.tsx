import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './useAuth';
import { notificationService, type NotificationPermissionResult } from '../services/notifications';
import type { NotificationPreferences } from '../types';

interface UseNotificationsReturn {
  hasPermission: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<NotificationPermissionResult>;
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  preferences: NotificationPreferences | null;
  token: string | null;
}

const isNative = Capacitor.isNativePlatform();

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Initialize notification permission status
  useEffect(() => {
    const checkPermission = async () => {
      if (isNative) {
        const status = await notificationService.checkNativePermission();
        setHasPermission(status === 'granted');
        setIsEnabled(status === 'granted');
      } else if ('Notification' in window) {
        const permission = Notification.permission;
        setHasPermission(permission === 'granted');
        setIsEnabled(permission === 'granted');
      }
    };

    checkPermission();
  }, []);

  // Setup message handlers when permission is granted
  useEffect(() => {
    if (!hasPermission) return;

    if (isNative) {
      notificationService.setupNativeListeners();
    } else {
      notificationService.setupForegroundMessageHandler();
    }
  }, [hasPermission]);

  // Load user notification preferences
  useEffect(() => {
    const defaults: NotificationPreferences = isNative
      ? {
          email: false,
          push: true,
          taskAlerts: true,
          kitchenPosts: true,
          directMessages: true,
          taskReminders: true,
          verificationRequests: true,
        }
      : {
          email: false,
          push: false,
          taskAlerts: true,
          kitchenPosts: true,
          directMessages: true,
          taskReminders: false,
          verificationRequests: false,
        };

    if (user?.notificationPreferences) {
      const existing = user.notificationPreferences as Partial<NotificationPreferences>;
      setPreferences({
        email: existing.email ?? defaults.email,
        push: existing.push ?? defaults.push,
        taskAlerts: (existing as Record<string, unknown>).newTasks !== undefined
          ? Boolean((existing as Record<string, unknown>).newTasks)
          : existing.taskAlerts ?? defaults.taskAlerts,
        kitchenPosts: existing.kitchenPosts ?? defaults.kitchenPosts,
        directMessages: existing.directMessages ?? defaults.directMessages,
        taskReminders: existing.taskReminders ?? defaults.taskReminders,
        verificationRequests: existing.verificationRequests ?? defaults.verificationRequests,
      });
    } else {
      setPreferences(defaults);
    }
  }, [user]);

  // Auto-register token when user logs in and has permission
  useEffect(() => {
    const autoRegisterToken = async () => {
      if (user && hasPermission && !token) {
        try {
          setIsLoading(true);
          const result = await notificationService.requestPermission();
          if (result.granted && result.token) {
            setToken(result.token);
            await notificationService.saveTokenToUser(user.id, result.token);
            console.log('Notification token registered automatically');
          }
        } catch (error) {
          console.error('Auto token registration failed:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    autoRegisterToken();
  }, [user, hasPermission, token]);

  const requestPermission = async (): Promise<NotificationPermissionResult> => {
    setIsLoading(true);

    try {
      const result = await notificationService.requestPermission();

      if (result.granted) {
        setHasPermission(true);
        setIsEnabled(true);

        if (result.token) {
          setToken(result.token);

          if (user) {
            await notificationService.saveTokenToUser(user.id, result.token);
          }
        }

        // Setup message handlers
        if (isNative) {
          await notificationService.setupNativeListeners();
        } else {
          notificationService.setupForegroundMessageHandler();
        }

        // Set default preferences with push enabled
        if (user && !user.notificationPreferences?.push) {
          const defaultPrefs: NotificationPreferences = isNative
            ? {
                push: true,
                email: false,
                taskAlerts: true,
                kitchenPosts: true,
                directMessages: true,
                taskReminders: true,
                verificationRequests: true,
              }
            : {
                push: true,
                email: true,
                taskAlerts: true,
                kitchenPosts: true,
                directMessages: true,
                taskReminders: false,
                verificationRequests: false,
              };
          await notificationService.updateNotificationPreferences(user.id, defaultPrefs);
          setPreferences(defaultPrefs);
        }
      }

      return result;
    } catch (error) {
      console.error('Permission request failed:', error);
      return {
        granted: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences): Promise<void> => {
    if (!user) {
      throw new Error('User must be logged in to update preferences');
    }

    try {
      setIsLoading(true);
      await notificationService.updateNotificationPreferences(user.id, newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasPermission,
    isEnabled,
    isLoading,
    requestPermission,
    updatePreferences,
    preferences,
    token
  };
};
