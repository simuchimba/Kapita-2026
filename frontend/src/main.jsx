import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'
import { clerkPublishableKey, isClerkEnabled } from './config/auth.js'

document.documentElement.classList.remove('dark')
localStorage.setItem('theme', 'light')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isClerkEnabled ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        afterSignOutUrl="/"
        afterSignInUrl="/app/dashboard"
        afterSignUpUrl="/app/dashboard"
        signInUrl="/login"
        signUpUrl="/register"
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
