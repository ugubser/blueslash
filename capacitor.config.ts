import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blueslash.app',
  appName: 'BlueSlash',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'accounts.google.com',
      '*.firebaseapp.com',
      '*.googleapis.com',
    ],
  },
};

export default config;
