import { Capacitor } from '@capacitor/core'

// Text-to-speech: uses the native engine inside the Android app (WebView has no
// Web Speech API) and the browser's speechSynthesis on the web.
const isNative = Capacitor.isNativePlatform()
let nativeTTS = null
async function getNative() {
  if (!nativeTTS) nativeTTS = (await import('@capacitor-community/text-to-speech')).TextToSpeech
  return nativeTTS
}

const ACCENT_LANG = { us: 'en-US', uk: 'en-GB', au: 'en-AU' }

function pickVoice(lang) {
  const voices = window.speechSynthesis?.getVoices?.() || []
  return voices.find((v) => v.lang === lang && /natural|google|online/i.test(v.name))
    || voices.find((v) => v.lang === lang)
    || voices.find((v) => v.lang?.startsWith('en'))
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
}

export function speak(text, { rate = 1, accent = 'us', lang } = {}) {
  const l = lang || ACCENT_LANG[accent] || 'en-US'
  if (isNative) {
    return getNative().then((t) => t.speak({ text, lang: l, rate, pitch: 1, volume: 1 })).catch(() => {})
  }
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) return resolve()
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = l
    u.rate = rate
    const v = pickVoice(l)
    if (v) u.voice = v
    u.onend = resolve
    u.onerror = resolve
    synth.speak(u)
  })
}

export function stopSpeak() {
  if (isNative) { getNative().then((t) => t.stop()).catch(() => {}); return }
  window.speechSynthesis?.cancel()
}

export const ttsAvailable = () => isNative || !!(typeof window !== 'undefined' && window.speechSynthesis)
