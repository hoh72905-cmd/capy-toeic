import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)

// Offline support + "install app" on Android Chrome (not needed inside the native app)
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
