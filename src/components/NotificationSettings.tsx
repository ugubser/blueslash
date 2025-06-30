import React, { useState } from 'react';
import { Bell, BellOff, CheckCircle, AlertCircle, Loader, TestTube } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import type { NotificationPreferences } from '../types';

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const {
    hasPermission,
    isLoading,
    requestPermission,
    updatePreferences,
    preferences
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testingNotifications, setTestingNotifications] = useState(false);

  React.useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handlePermissionRequest = async () => {
    try {
      const result = await requestPermission();
      if (!result.granted) {
        setSaveMessage(result.error || 'Permission denied');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('Notifications enabled successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch {
      setSaveMessage('Failed to enable notifications');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    if (!localPreferences) return;
    
    setLocalPreferences({
      ...localPreferences,
      [key]: value
    });
  };

  const handleSavePreferences = async () => {
    if (!localPreferences) return;

    try {
      setIsSaving(true);
      await updatePreferences(localPreferences);
      setSaveMessage('Preferences saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to save preferences');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(localPreferences);

  const handleTestNotification = async () => {
    if (!user) {
      setSaveMessage('You must be logged in to test notifications');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setTestingNotifications(true);
    try {
      const sendTest = httpsCallable(functions, 'sendTestNotification');
      await sendTest({
        userId: user.id,
        title: 'Test Notification',
        body: 'This is a test notification from BlueSlash!'
      });
      setSaveMessage('Test notification sent! Check your browser notifications.');
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('Test notification failed:', error);
      setSaveMessage('Failed to send test notification');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setTestingNotifications(false);
    }
  };

  const handleTriggerScheduled = async () => {
    setTestingNotifications(true);
    try {
      const triggerScheduled = httpsCallable(functions, 'triggerScheduledNotifications');
      const result = await triggerScheduled();
      console.log('Scheduled notifications result:', result);
      setSaveMessage(`Triggered scheduled notifications. Check functions logs for details.`);
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('Trigger scheduled failed:', error);
      setSaveMessage('Failed to trigger scheduled notifications');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setTestingNotifications(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border-4 border-mario-blue shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-mario-blue" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Notification Settings</h2>
      </div>

      {/* Permission Status */}
      <div className="mb-6 p-4 rounded-lg border-2 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hasPermission ? (
              <>
                <CheckCircle className="text-green-500" size={20} />
                <span className="text-green-700 font-medium">Notifications Enabled</span>
              </>
            ) : (
              <>
                <BellOff className="text-red-500" size={20} />
                <span className="text-red-700 font-medium">Notifications Disabled</span>
              </>
            )}
          </div>
          
          {!hasPermission && (
            <button
              onClick={handlePermissionRequest}
              disabled={isLoading}
              className="mario-button-green text-sm px-4 py-2 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Requesting...
                </>
              ) : (
                <>
                  <Bell size={16} />
                  Enable Notifications
                </>
              )}
            </button>
          )}
        </div>
        
        {!hasPermission && (
          <p className="text-gray-600 text-sm mt-2">
            Enable browser notifications to receive task reminders and updates.
          </p>
        )}
      </div>

      {/* Notification Preferences */}
      {hasPermission && localPreferences && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Types</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <label htmlFor="push-notifications" className="font-medium text-gray-700">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications in your browser or device
                </p>
              </div>
              <label className="mario-toggle">
                <input
                  id="push-notifications"
                  type="checkbox"
                  checked={localPreferences.push}
                  onChange={(e) => handlePreferenceChange('push', e.target.checked)}
                />
                <span className="mario-toggle-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <label htmlFor="task-reminders" className="font-medium text-gray-700">
                  Task Reminders
                </label>
                <p className="text-sm text-gray-500">
                  Get reminded about due dates (7, 4, 2, 1 days before)
                </p>
              </div>
              <label className="mario-toggle">
                <input
                  id="task-reminders"
                  type="checkbox"
                  checked={localPreferences.taskReminders}
                  onChange={(e) => handlePreferenceChange('taskReminders', e.target.checked)}
                  disabled={!localPreferences.push}
                />
                <span className="mario-toggle-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <label htmlFor="verification-requests" className="font-medium text-gray-700">
                  Verification Requests
                </label>
                <p className="text-sm text-gray-500">
                  Get notified when tasks need verification
                </p>
              </div>
              <label className="mario-toggle">
                <input
                  id="verification-requests"
                  type="checkbox"
                  checked={localPreferences.verificationRequests}
                  onChange={(e) => handlePreferenceChange('verificationRequests', e.target.checked)}
                  disabled={!localPreferences.push}
                />
                <span className="mario-toggle-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <label htmlFor="email-notifications" className="font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email (coming soon)
                </p>
              </div>
              <label className="mario-toggle">
                <input
                  id="email-notifications"
                  type="checkbox"
                  checked={localPreferences.email}
                  onChange={(e) => handlePreferenceChange('email', e.target.checked)}
                  disabled={true}
                />
                <span className="mario-toggle-slider opacity-50"></span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="mario-button-blue flex items-center gap-2 px-6 py-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          )}

          {/* Test Buttons */}
          {hasPermission && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Test Notifications</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleTestNotification}
                  disabled={testingNotifications}
                  className="mario-button-green flex items-center gap-2 px-4 py-2 text-sm"
                >
                  {testingNotifications ? (
                    <>
                      <Loader className="animate-spin" size={14} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <TestTube size={14} />
                      Send Test Notification
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleTriggerScheduled}
                  disabled={testingNotifications}
                  className="mario-button flex items-center gap-2 px-4 py-2 text-sm"
                >
                  {testingNotifications ? (
                    <>
                      <Loader className="animate-spin" size={14} />
                      Triggering...
                    </>
                  ) : (
                    <>
                      <Bell size={14} />
                      Trigger Scheduled
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Use these buttons to test the notification system. Check the browser console and Functions logs for details.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {saveMessage && (
        <div className={`mt-4 p-3 rounded-lg border flex items-center gap-2 ${
          saveMessage.includes('success') || saveMessage.includes('enabled')
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {saveMessage.includes('success') || saveMessage.includes('enabled') ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {saveMessage}
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;