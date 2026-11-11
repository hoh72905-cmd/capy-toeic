import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

// Offline support: also inside the Android app, which opens the live website
// (so the app always has the newest version without reinstalling)
const fromWeb = location.protocol === 'https:' && location.hostname !== 'localhost'
if ('serviceWorker' in navigator && import.meta.env.PROD && fromWeb) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}

// A page left open across a website update may ask for files that no longer exist
// (e.g. the sign-in code): reload once to get the new version instead of failing
window.addEventListener('vite:preloadError', (e) => {
  try {
    if (sessionStorage.getItem('capy-reloaded') === '1') return
    sessionStorage.setItem('capy-reloaded', '1')
  } catch { return }
  e.preventDefault()
  location.reload()
})
setTimeout(() => { try { sessionStorage.removeItem('capy-reloaded') } catch { /* ignore */ } }, 30000)
