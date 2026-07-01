import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import OfflineIndicator from './components/OfflineIndicator'
import { startAutoSync } from './services/sync'

document.documentElement.classList.remove('dark')
localStorage.setItem('theme', 'light')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {}).catch(() => {})
  })
}

startAutoSync()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <OfflineIndicator />
  </StrictMode>,
)
