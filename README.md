# BlueSlash - Gamified Household Task Management

BlueSlash is a web-based task and chore management application that incorporates gamification to incentivize household members to complete shared responsibilities. The platform allows a "head of household" to invite members, assign tasks, track progress, and reward participation through a "gems" system.

## 🎮 Features

- **Household Management**: Create households and invite members via unique links
- **AI-Powered Gem Calculation**: Automatic task valuation using OpenRouter LLM integration
- **Gamification**: Earn gems for creating, completing, and verifying tasks
- **Task Lifecycle**: Draft → Published → Claimed → Completed → Verified
- **Mario Bros Theme**: Retro-inspired UI with coins, power-ups, and classic styling
- **PWA Support**: Works on mobile devices
- **Real-time Updates**: Firebase integration for live collaboration
- **Customizable Gem Guidelines**: Household-specific prompts for AI gem calculations

## 🛠 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **AI Integration**: OpenRouter API with OpenAI SDK
- **Styling**: Tailwind CSS with custom Mario Bros theme
- **State Management**: React Context + Custom Hooks
- **Routing**: React Router DOM
- **PWA**: Vite PWA Plugin

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project with Authentication, Firestore, and Cloud Functions enabled
- Google OAuth credentials
- OpenRouter.ai API key for AI gem calculations

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

5. **Configure OpenRouter API key for AI features**
   
   Create an account at [OpenRouter.ai](https://openrouter.ai/) and get your API key.
   
   Add the key to your Firebase Functions configuration:
   ```bash
   firebase functions:config:set openrouter.api_key="your_openrouter_api_key_here"
   ```
   
   Or set it as an environment variable in your functions directory:
   ```bash
   echo "OPENROUTER_API_KEY=your_openrouter_api_key_here" > functions/.env
   ```

6. **Deploy Firebase Functions** (required for AI features)
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

7. **Build & Start the development server**

   ```bash
   npm run build   ```


   ```bash
   npm run emulators   ```

8. **Open your browser**
   Navigate to `http://localhost:5003`

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
- **AI-Calculated Gem Values**: Tasks are automatically valued based on complexity and time
  - 5-10 minute tasks: 5 gems (dishwasher, trash, etc.)
  - 10-30 minute tasks: 10 gems (cleaning kitchen, vacuuming, etc.)
  - 30+ minute tasks: 15 gems (combination tasks)
  - Shopping/external activities: 20 gems
  - Exceptional tasks: 25 gems
- **Manual Override**: Household admins can override AI suggestions
- **Earn gems** for:
  - Creating detailed tasks (AI-calculated value)
  - Completing claimed tasks (full reward)
  - Verifying others' work (3 gems)
  - Publishing tasks (10% bonus)
- **Climb the leaderboard** by earning more gems than household members
- **Custom Guidelines**: Each household can set their own gem calculation prompts

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

functions/
├── src/
│   ├── index.ts        # Firebase Functions entry point
│   └── llm-parser.ts   # OpenRouter LLM integration
├── package.json
└── .env                # OpenRouter API key (local development)
```

## 🔥 Firebase Setup

### Required Collections
- `users` - User profiles and gem balances
- `households` - Household data, member lists, and gem calculation prompts
- `tasks` - Task information and status
- `gemTransactions` - Gem earning history

### Required Firebase Functions
- `calculateTaskGems` - AI-powered gem calculation using OpenRouter

### OpenRouter Configuration
The AI gem calculation system uses OpenRouter.ai to provide intelligent task valuation. Configure your API key using one of these methods:

1. **Firebase Functions Config** (recommended for production):
   ```bash
   firebase functions:config:set openrouter.api_key="your_key_here"
   firebase functions:config:set openrouter.model="meta-llama/llama-4-maverick"
   ```

2. **Environment Variables** (development):
   ```bash
   # In functions/.env
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL=meta-llama/llama-4-maverick
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   ```

## 🎨 Design System

BlueSlash uses a retro inspired design system, 3D buttons, and coin animations.

## 📦 Building for Production

```bash
npm run build:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the linter: `npm run lint`
5. Submit a pull request

---

Built in Switzerland 🇨🇭 with ❤️ using React, Firebase, Claude Code, and Tailwind CSS
