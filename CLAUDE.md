# BlueSlash - Claude Code Configuration

## Project Overview
BlueSlash is a gamified household task management application built with React, TypeScript, Firebase, and Tailwind CSS. It features a Mario Bros-inspired UI with gem rewards for completing tasks.

## Development Commands

### Build & Development
```bash
npm run dev              # Start development server (uses emulators)
npm run build            # Build for emulator testing
npm run build:prod       # Build for production deployment
npm run preview          # Preview last build
npm run preview:emulator # Preview emulator build
npm run preview:prod     # Preview production build
npm run lint             # Run ESLint
```

### Firebase Setup
```bash
firebase login
firebase init
firebase emulators:start
firebase deploy
```

## Project Structure
```
src/
├── components/      # Reusable UI components
│   ├── Header.tsx
│   ├── TaskCard.tsx
│   ├── CreateTaskForm.tsx
│   └── Leaderboard.tsx
├── pages/          # Route components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── HouseholdSetup.tsx
├── hooks/          # Custom React hooks
│   ├── useAuth.tsx
│   ├── useHousehold.tsx
│   └── useTasks.tsx
├── services/       # Firebase services
│   ├── firebase.ts
│   ├── auth.ts
│   ├── households.ts
│   └── tasks.ts
├── types/          # TypeScript definitions
│   └── index.ts
└── styles/         # CSS files
    └── index.css
```

## Key Features
- **Authentication**: Google OAuth with Firebase Auth
- **Household Management**: Create households, invite members via unique links
- **Task Lifecycle**: Draft → Published → Claimed → Completed → Verified
- **Gamification**: Gem rewards for task creation, completion, and verification
- **Mario Bros Theme**: Custom UI with retro styling and animations
- **PWA Support**: Service worker for offline capabilities
- **Responsive Design**: Mobile-first approach

## Environment Variables
Required environment variables (see `.env.example`):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Build Modes
- **Development** (`npm run dev`): Uses Firebase emulators automatically
- **Emulator Build** (`npm run build`): Builds for testing with emulators
- **Production Build** (`npm run build:prod`): Builds for production Firebase

## Firebase Collections
- `users`: User profiles and gem balances
- `households`: Household data and member lists  
- `tasks`: Task information and lifecycle status
- `gemTransactions`: Gem earning history and transactions

## Common Issues & Troubleshooting

### Authentication Issues
- Clear browser localStorage/sessionStorage
- Check Firebase emulator is running on correct ports
- Verify environment variables are set correctly
- Check console for detailed auth error logs

### Production Authentication Issues
If you see "Access to storage is not allowed" or popup issues in production:

1. **Service Worker Conflicts**: The PWA service worker may interfere with Firebase Auth
   - Try disabling service worker temporarily
   - Clear all browser data and cache
   - Use incognito mode for testing

2. **HTTPS Requirements**: Firebase Auth requires HTTPS in production
   - Ensure your domain is properly configured with SSL
   - Check Firebase console authorized domains include your production domain

3. **Domain Authorization**: Add your production domain to Firebase Auth
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your production domain (e.g., yourapp.web.app)

4. **Popup Blockers**: Browser may block auth popups
   - Disable popup blockers for your domain
   - Try different browsers (Chrome, Firefox, Safari)

### Service Worker Storage Errors
- PWA is disabled in development mode
- Clear browser cache and service worker data
- Use incognito window for testing
- In production, service worker excludes Firebase Auth URLs to prevent conflicts

### Emulator Configuration
When using emulators, all Firebase services are emulated:
- **Auth emulator**: http://127.0.0.1:9099
- **Firestore emulator**: http://127.0.0.1:8081
- **Functions emulator**: http://127.0.0.1:5001
- **Storage emulator**: http://127.0.0.1:9199
- **Hosting emulator**: http://127.0.0.1:5003
- **Emulator UI**: http://127.0.0.1:4000

Emulators used automatically in:
- Development mode (`npm run dev`)
- Emulator builds (`npm run build`)

Use `npm run build:prod` for production Firebase builds

### Emulator Connection Troubleshooting
If you see "WARNING: Firestore emulator connection failed":
1. Ensure Firebase emulators are running: `firebase emulators:start`
2. Check that Firestore emulator is on port 8081
3. Restart your dev server: `npm run dev`
4. Check console for detailed connection status
5. If still failing, you may be accidentally using production database

To verify emulator usage:
- Look for console message: "Connected to Firestore emulator (port 8081)"
- Check emulator UI at http://127.0.0.1:4000
- Verify data appears in emulator UI, not production console

## Development Workflow

### For Development (using emulators):
1. Start Firebase emulators: `firebase emulators:start`
2. Start dev server: `npm run dev`
3. Navigate to http://localhost:5173
4. Sign in with Google (emulator will create test accounts)
5. Create household and start adding tasks

### For Emulator Testing (built app):
1. Start Firebase emulators: `firebase emulators:start`
2. Build for emulator: `npm run build`
3. Deploy to hosting emulator: `firebase serve --only hosting --port 5003`
4. Navigate to http://127.0.0.1:5003
5. Test the full application with emulated services

### For Production Deployment:
1. Build for production: `npm run build:prod`
2. Deploy to Firebase: `firebase deploy`

## Deployment
1. Build: `npm run build`
2. Deploy to Firebase Hosting: `firebase deploy`
3. Or deploy to Vercel: `vercel`

## Mario Bros Design System
- **Colors**: Red (#E53E3E), Blue (#3182CE), Yellow (#D69E2E)
- **Typography**: Press Start 2P for headings, system fonts for content
- **Components**: 3D buttons, gem counters, power-up badges
- **Animations**: Coin bounces, glow effects, power-up animations

## Recent Changes
- Fixed Firebase emulator connection logic
- Disabled PWA service worker in development
- Added comprehensive auth error handling
- Improved console logging for debugging
- Updated TypeScript imports for strict mode

## Next Features to Implement
- Recurring chores functionality
- Push notifications system
- Task attachments and images
- Advanced gamification (streaks, badges)
- Household analytics and insights