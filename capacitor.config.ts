import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blueslash.app',
  appName: 'BlueSlash',
  webDir: 'dist',
  server: {
    // http scheme required so WKWebView can reach Firebase emulators at 127.0.0.1
    iosScheme: 'http',
    allowNavigation: [
      'accounts.google.com',
      '*.firebaseapp.com',
      '*.googleapis.com',
    ],
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
