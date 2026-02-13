import React, { useEffect, useMemo, useState } from 'react';
import { getBrowserName, isMobileDevice, isIosDevice, isStandalonePWA } from '../utils/device';
import { notificationService } from '../services/notifications';
import { useAuth } from '../hooks/useAuth';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const INSTALL_DISMISSED_KEY = 'blueslash-install-dismissed';

const MobileInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const { user } = useAuth();
  const browserName = useMemo(() => getBrowserName(), []);

  const isIos = useMemo(() => isIosDevice(), []);
  const isStandalone = useMemo(() => isStandalonePWA(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true';
    if (dismissed || !isMobileDevice() || isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If the prompt was not deferred (iOS/Safari), display guidance panel
    if (!dismissed) {
      setShowPrompt(true);
    }

    const handleAppInstalled = () => {
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
      setShowPrompt(false);
      attemptNotificationPermission();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStandalone]);

  const attemptNotificationPermission = async () => {
    if (requestingPermission) return;

    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this environment');
      return;
    }
    setRequestingPermission(true);
    try {
      const result = await notificationService.requestPermission();
      if (result.granted && result.token && user) {
        await notificationService.saveTokenToUser(user.id, result.token);
        console.log('Notifications enabled via install prompt');
      }
    } catch (error) {
      console.error('Automatic notification request failed:', error);
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleInstallConfirm = async () => {
    if (isIos) {
      setShowInstructions(true);
      setShowPrompt(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
          setShowPrompt(false);
          attemptNotificationPermission();
        } else {
          setShowPrompt(false);
        }
      } catch (error) {
        console.error('Install prompt failed:', error);
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    // Fallback when no deferred prompt is available
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    attemptNotificationPermission();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone || !isMobileDevice()) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 px-4 sm:px-6 z-50">
      <div className="max-w-xl mx-auto bg-white border-2 border-mario-blue rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Install BlueSlash</h3>
            <p className="text-sm text-gray-600">
              Install BlueSlash as a web app to enable background notifications on your device.
            </p>

            {!showInstructions && !isIos && !deferredPrompt && (
              <p className="mt-2 text-xs text-gray-500">
                Look for “Install app” in your browser menu to add BlueSlash to your home screen.
              </p>
            )}

            {showInstructions && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                <p className="font-semibold mb-1">How to install on iOS {browserName}:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tap the Share icon in {browserName}&apos;s toolbar.</li>
                  <li>Select <strong>Add to Home Screen</strong>.</li>
                  <li>Open BlueSlash from your home screen, then enable notifications.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          {showInstructions ? (
            <button
              type="button"
              onClick={handleDismiss}
              className="mario-button-green text-sm px-4 py-2"
            >
              OK
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDismiss}
                className="mario-button-gray text-sm px-4 py-2"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleInstallConfirm}
                className="mario-button-green text-sm px-4 py-2"
                disabled={requestingPermission}
              >
                {requestingPermission ? 'Enabling…' : 'Yes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileInstallPrompt;
