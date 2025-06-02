# BlueSlash - Gamified Household Task Management

BlueSlash is a web-based task and chore management application that incorporates gamification (similar to Duolingo) to incentivize household members to complete shared responsibilities. The platform allows a "head of household" to invite members, assign tasks, track progress, and reward participation through a "gems" system.

## 🎮 Features

- **Household Management**: Create households and invite members via unique links
- **Gamification**: Earn gems for creating, completing, and verifying tasks
- **Task Lifecycle**: Draft → Published → Claimed → Completed → Verified
- **Mario Bros Theme**: Retro-inspired UI with coins, power-ups, and classic styling
- **PWA Support**: Works on mobile devices with offline capabilities
- **Real-time Updates**: Firebase integration for live collaboration

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Styling**: Tailwind CSS with custom Mario Bros theme
- **State Management**: React Context + Custom Hooks
- **Routing**: React Router DOM
- **PWA**: Vite PWA Plugin

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project with Authentication and Firestore enabled
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blueslash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Google provider)
   - Enable Firestore Database
   - Copy your Firebase config

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📱 Usage

### Getting Started
1. **Sign in** with your Google account
2. **Create a household** or join one with an invite link
3. **Start creating tasks** and earning gems!

### Task Management
- **Create tasks** with rich descriptions and due dates
- **Save as drafts** to refine before publishing
- **Claim available tasks** to work on them
- **Mark tasks complete** when finished
- **Verify others' work** to help them earn gems

### Gamification
- **Earn gems** for:
  - Creating detailed tasks (5-15 gems)
  - Completing claimed tasks (full reward)
  - Verifying others' work (3 gems)
  - Publishing tasks (10% bonus)

- **Climb the leaderboard** by earning more gems than household members

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── services/           # Firebase services
├── types/              # TypeScript definitions
├── utils/              # Helper functions
└── styles/             # CSS files
```

## 🔥 Firebase Setup

### Required Collections
- `users` - User profiles and gem balances
- `households` - Household data and member lists
- `tasks` - Task information and status
- `gemTransactions` - Gem earning history

## 🎨 Design System

BlueSlash uses a Mario Bros-inspired design system with retro styling, 3D buttons, and coin animations.

## 📦 Building for Production

```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the linter: `npm run lint`
5. Submit a pull request

---

Built with ❤️ using React, Firebase, and Tailwind CSS
