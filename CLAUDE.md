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

### Service Worker Storage Errors
- PWA is disabled in development mode
- Clear browser cache and service worker data
- Use incognito window for testing

### Emulator Configuration
When using emulators, all Firebase services are emulated:
- **Auth emulator**: http://127.0.0.1:9099
- **Firestore emulator**: http://127.0.0.1:8080
- **Functions emulator**: http://127.0.0.1:5001
- **Storage emulator**: http://127.0.0.1:9199
- **Hosting emulator**: http://127.0.0.1:5003
- **Emulator UI**: http://127.0.0.1:4000

Emulators used automatically in:
- Development mode (`npm run dev`)
- Emulator builds (`npm run build`)

Use `npm run build:prod` for production Firebase builds

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