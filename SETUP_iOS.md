# iOS Setup Guide

## Prerequisites

- Mac with Xcode installed
- Node.js and npm
- Apple Developer Account ($99/year)
- Firebase project with iOS app configured

## Apple Developer Account Setup

### 1. Developer Account

- Enroll at [developer.apple.com](https://developer.apple.com)
- Complete identity verification and payment

### 2. App Identifier

- Go to Certificates, Identifiers & Profiles > Identifiers
- Register an App ID with bundle identifier: `com.blueslash.app`
- Enable the following capabilities:
  - **Push Notifications**
  - **Sign In with Apple** (optional, if adding Apple Sign-In later)

### 3. APNs Authentication Key

- Go to Certificates, Identifiers & Profiles > Keys
- Create a new key with **Apple Push Notifications service (APNs)** enabled
- Download the `.p8` file (one-time download, store securely)
- Note the **Key ID**

### 4. Certificates & Provisioning

- Xcode handles this automatically when signed in with your Apple Developer account
- In Xcode: Preferences > Accounts > add your Apple ID
- Select your team in the project's Signing & Capabilities tab
- Provisioning style is set to **Automatic**

## Firebase Console Setup

### 1. iOS App Registration

- Go to [Firebase Console](https://console.firebase.google.com) > Project Settings
- Add an iOS app with bundle ID: `com.blueslash.app`
- Download `GoogleService-Info.plist` and place it in `ios/App/App/`

### 2. Authentication

- Go to Authentication > Sign-in method
- Enable **Google** as a sign-in provider
- Note the **Web client ID** (used by the app)

### 3. Cloud Messaging (Push Notifications)

- Go to Project Settings > Cloud Messaging tab
- Under **Apple app configuration**, upload the APNs Authentication Key:
  - The `.p8` file from the Apple Developer portal
  - The **Key ID** from the key you created
  - Your **Team ID** (found in Apple Developer > Membership)

### 4. Authorized Domains

- Go to Authentication > Settings > Authorized domains
- Ensure `com.blueslash.app` and any hosting domains are listed

## Xcode Project Configuration

### Signing & Capabilities

1. Open the project: `npm run cap:open`
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Set **Team** to your Apple Developer account
5. Verify **Bundle Identifier** is `com.blueslash.app`
6. Add capability: **Push Notifications** (creates `App.entitlements` with `aps-environment`)

### Info.plist

The following must be configured in `ios/App/App/Info.plist`:

- **CFBundleURLSchemes**: Must contain the `REVERSED_CLIENT_ID` value from `GoogleService-Info.plist` (e.g., `com.googleusercontent.apps.XXXX`). This is the OAuth redirect URL scheme for Google Sign-In.

### Capacitor Config

In `capacitor.config.ts`, the following plugin settings are required:

```typescript
plugins: {
  FirebaseAuthentication: {
    skipNativeAuth: false,
    providers: ['google.com'],  // Required: enables the native Google Sign-In handler
  },
  FirebaseMessaging: {
    presentationOptions: ['badge', 'sound', 'alert'],
  },
},
```

Without `providers: ['google.com']`, the native Google Sign-In handler is never initialized and sign-in will hang indefinitely.

## Build & Run

```bash
# Build web app for production
npm run build:prod

# Sync web build to iOS project
npx cap sync ios

# Open Xcode
npm run cap:open
```

In Xcode, select your physical device and press Cmd+R to build and run.

## Verification Checklist

- [ ] Apple Developer account active
- [ ] App ID registered with Push Notifications capability
- [ ] APNs key (.p8) created and downloaded
- [ ] APNs key uploaded to Firebase Console > Cloud Messaging
- [ ] `GoogleService-Info.plist` in `ios/App/App/`
- [ ] Google Sign-In enabled in Firebase Authentication
- [ ] Xcode signed in with Apple Developer account
- [ ] Team selected in Xcode Signing & Capabilities
- [ ] Push Notifications capability added in Xcode
- [ ] `REVERSED_CLIENT_ID` hardcoded in Info.plist URL schemes
- [ ] `providers: ['google.com']` in Capacitor config
- [ ] App builds and runs on physical device
- [ ] Google Sign-In completes successfully
- [ ] Push notification permission prompt appears
