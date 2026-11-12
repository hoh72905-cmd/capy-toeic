// Speech to text for speaking practice.
// Browsers: the Web Speech API (Chrome, Edge, Safari). Android app: the phone's own recognizer
// through @capacitor-community/speech-recognition (Google's speech service on the phone).
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
const WebRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export function canListen() {
  return isNative ? Capacitor.isPluginAvailable('SpeechRecognition') : !!WebRec
}
// The Android app installed before speaking practice existed
export const needsAppUpdate = () => isNative && !Capacitor.isPluginAvailable('SpeechRecognition')

let current = null // web recognizer in use

/** Listen once and return what was said ('' if nothing). Throws { code: 'denied' | 'unavailable' | 'error' }. */
export async function listenOnce(lang = 'en-US') {
  if (isNative) {
    if (!Capacitor.isPluginAvailable('SpeechRecognition')) throw Object.assign(new Error('unavailable'), { code: 'unavailable' })
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition')
    const { available } = await SpeechRecognition.available()
    if (!available) throw Object.assign(new Error('unavailable'), { code: 'unavailable' })
    let perm = await SpeechRecognition.checkPermissions()
    if (perm.speechRecognition !== 'granted') perm = await SpeechRecognition.requestPermissions()
    if (perm.speechRecognition !== 'granted') throw Object.assign(new Error('denied'), { code: 'denied' })
    try {
      const r = await SpeechRecognition.start({ language: lang, maxResults: 3, partialResults: false, popup: true, prompt: 'Nói tiếng Anh…' })
      return r?.matches?.[0] || ''
    } catch (e) {
      if (/no match|didn't understand|no speech/i.test(e?.message || '')) return ''
      throw Object.assign(new Error(e?.message || 'error'), { code: 'error' })
    }
  }
  if (!WebRec) throw Object.assign(new Error('unavailable'), { code: 'unavailable' })
  return new Promise((resolve, reject) => {
    const r = new WebRec()
    current = r
    r.lang = lang
    r.interimResults = false
    r.maxAlternatives = 1
    let said = ''
    r.onresult = (e) => { said = e.results[0][0].transcript }
    r.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      reject(Object.assign(new Error(e.error), { code: e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : 'error' }))
    }
    r.onend = () => { current = null; resolve(said) }
    r.start()
  })
}

export function stopListening() {
  try { current?.stop() } catch { /* ignore */ }
}

export function voiceHint(code) {
  if (code === 'denied') return 'Chưa được phép dùng micro. Cho phép micro rồi thử lại.'
  if (code === 'unavailable') return needsAppUpdate()
    ? 'App trên máy là bản cũ, chưa có nhận giọng nói — tải APK mới và cài đè (không cần gỡ).'
    : 'Thiết bị/trình duyệt này chưa hỗ trợ nhận giọng nói. Hãy gõ câu trả lời, hoặc dùng Chrome.'
  return 'Không nghe rõ, thử nói lại gần micro hơn nhé.'
}
