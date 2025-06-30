import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './utils/cleanupServiceWorker'
import App from './App.tsx'

// Import notification icons so they get copied to dist
import './assets/icon-192x192.png'
import './assets/icon-512x512.png'
import './assets/badge-72x72.png'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
