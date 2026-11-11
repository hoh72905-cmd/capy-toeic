import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import { unlockAudio } from './lib/speech.js'
import { askPersistentStorage } from './lib/store.js'
import './styles.css'

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)

// Phones allow sound only after a tap: unlock audio on the very first touch/click
const unlock = () => { unlockAudio(); window.removeEventListener('pointerdown', unlock, true) }
window.addEventListener('pointerdown', unlock, true)

// Keep study data from being cleared by the browser
askPersistentStorage()

// Offline support + "install app" on Android Chrome (not needed inside the native app)
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
