import React, { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react';
import { notificationService } from '../services/notifications';
import { useAuth } from '../hooks/useAuth';

interface NotificationPermissionProps {
  onPermissionChange?: (granted: boolean) => void;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({ onPermissionChange }) => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (notificationService.isSupported()) {
      setPermission(notificationService.getPermissionStatus());
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await notificationService.getSubscriptionToken(user.id);
      if (token) {
        setPermission('granted');
        setSuccess('Notifications enabled successfully!');
        onPermissionChange?.(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to enable notifications:', err);
      setError(err.message || 'Failed to enable notifications');
      setPermission(notificationService.getPermissionStatus());
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await notificationService.unsubscribe(user.id);
      setPermission('default'); // Reset permission state
      setSuccess('Notifications disabled successfully!');
      onPermissionChange?.(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to disable notifications:', err);
      setError(err.message || 'Failed to disable notifications');
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!notificationService.isSupported()) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="font-bold text-yellow-800">Notifications Not Supported</h3>
            <p className="text-sm text-yellow-700">
              Your browser doesn't support push notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <Bell className="w-5 h-5 text-green-600" />,
          title: 'Notifications Enabled',
          description: 'You\'ll receive reminders for upcoming task due dates.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'denied':
        return {
          icon: <BellOff className="w-5 h-5 text-red-600" />,
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings to receive task reminders.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      default:
        return {
          icon: <Bell className="w-5 h-5 text-mario-blue" />,
          title: 'Enable Task Reminders',
          description: 'Get notified 1 week, 4 days, 2 days, and 1 day before your tasks are due.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-mario-blue',
          textColor: 'text-mario-blue'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`${statusInfo.bgColor} border-2 ${statusInfo.borderColor} rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {statusInfo.icon}
          <div className="flex-1">
            <h3 className={`font-bold ${statusInfo.textColor}`}>
              {statusInfo.title}
            </h3>
            <p className={`text-sm ${statusInfo.textColor.replace('800', '700')} mt-1`}>
              {statusInfo.description}
            </p>
            
            {/* Reminder schedule info */}
            {permission === 'default' && (
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <h4 className="font-semibold text-gray-800 text-sm mb-2">Reminder Schedule:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 1 week before due date</li>
                  <li>• 4 days before due date</li>
                  <li>• 2 days before due date</li>
                  <li>• 1 day before due date</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="ml-4 flex flex-col gap-2">
          {permission === 'default' && (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="mario-button mario-button-blue text-sm px-4 py-2 disabled:opacity-50"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </button>
          )}

          {permission === 'granted' && (
            <button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              className="mario-button mario-button-red text-sm px-4 py-2 disabled:opacity-50"
            >
              {isLoading ? 'Disabling...' : 'Disable'}
            </button>
          )}

          {permission === 'denied' && (
            <div className="text-xs text-red-600 max-w-24 text-center">
              Check browser settings
            </div>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}
    </div>
  );
};

export default NotificationPermission;