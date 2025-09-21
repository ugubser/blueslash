# Repository Guidelines

## Project Structure & Module Organization
BlueSlash uses Vite + React 19 with TypeScript. Frontend code lives under `src/`. Key folders: `components` (reusable UI), `pages` (route views), `services` (Firebase integration), `hooks`, `utils`, `styles`, and `assets`. PWA artifacts (`sw.js`, `firebase-messaging-sw.template.js`) sit beside `main.tsx`. Firebase Cloud Functions reside in `functions/src`, compiled into `functions/lib`. Shared scripts for service worker bundling live in `scripts/`. Static hosting assets are in `public/`.

## Build, Test, and Development Commands
- `npm run emulators`: build the app, then launch Firebase Hosting + emulator suite on `http://localhost:5003`.
- `npm run preview:emulator`: serve the Vite build against emulator config without starting Firebase processes.
- `npm run build`: type-check via `tsc -b`, bundle the client, and rebuild the messaging service worker.
- `npm run build:prod`: production build plus service worker pass for deploy.
- `npm run lint`: run ESLint across TypeScript/React files.
- `cd functions && npm run serve`: compile functions then run the Functions emulator only.

## Coding Style & Naming Conventions
Use TypeScript with strict typing and two-space indentation. Prefer function components with hooks; name components `PascalCase` (`TaskCard.tsx`) and hooks with a `use` prefix (`useHousehold`). Keep Firebase service wrappers in `services/` and avoid mixing UI and data logic. Tailwind utility classes stay in JSX; extract shared styles into `styles/` when needed. Run ESLint before pushing; React Refresh rules prevent exporting non-components from component modules.

## Testing Guidelines
Automated tests are not yet wired up; rely on the Firebase emulator for end-to-end verification. When adding tests, colocate them beside the feature as `*.test.ts(x)` and use Vitest + Testing Library for UI or `firebase-functions-test` for Cloud Functions. Document new test commands in `package.json` and ensure CI steps include them before merging.

## Commit & Pull Request Guidelines
Follow the concise, imperative style in the log (`Fix: Resolve notification delivery issues`). Squash small fixups locally before opening PRs. Each PR should describe the change, link relevant issues, list emulator or manual test steps, and include screenshots/GIFs for UI deltas. Mention any Firebase config or rules updates and attach snippets to ease review.

## Security & Configuration Tips
Never commit `.env` or Firebase service account files. Use `firebase functions:config:set` for production secrets and `functions/.env` for local development. Update `firestore.rules` and `storage.rules` alongside features that touch data and verify them with the emulator suite.

## Workflow & Scaffolding
Only build when requested, otherwise build and testing will be done manually. Never create any fall-back scenarios, unless clearly indicated or desired. 
