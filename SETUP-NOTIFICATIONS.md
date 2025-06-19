# 🚨 IMPORTANT: Notification Setup Instructions

## Security Alert
The service worker file `public/firebase-messaging-sw.js` contains Firebase credentials and is **excluded from git** for security reasons.

## Setup Steps

### 1. **Create Service Worker**
Copy the template and replace placeholders with your Firebase config:

```bash
cp public/firebase-messaging-sw.js.template public/firebase-messaging-sw.js
```

### 2. **Update Firebase Config**
Edit `public/firebase-messaging-sw.js` and replace these placeholders with your actual Firebase config values:

- `YOUR_API_KEY` → Your Firebase API key
- `YOUR_AUTH_DOMAIN` → Your auth domain
- `YOUR_PROJECT_ID` → Your project ID  
- `YOUR_STORAGE_BUCKET` → Your storage bucket
- `YOUR_MESSAGING_SENDER_ID` → Your messaging sender ID
- `YOUR_APP_ID` → Your app ID

### 3. **Generate VAPID Keys**
Generate new VAPID keys for your project:
```bash
npx web-push generate-vapid-keys
```

Add the public key to your `.env` file:
```
VITE_VAPID_PUBLIC_KEY=YOUR_GENERATED_PUBLIC_KEY
```

### 4. **Deploy Functions**
Set the private VAPID key as an environment variable for Firebase Functions:

```bash
firebase functions:config:set vapid.private_key="YOUR_GENERATED_PRIVATE_KEY"
```

## Security Notes

- ✅ **Never commit** `firebase-messaging-sw.js` (it's in `.gitignore`)
- ✅ **Regenerate API keys** if accidentally exposed
- ✅ **Use environment variables** for production deployments
- ✅ **Template file** is safe to commit (no real credentials)

## Testing

1. Enable notifications in household settings
2. Create and claim a task with near-future due date
3. Use "Trigger Scheduled Check" button to test immediately
4. Check browser console and Firebase Functions logs