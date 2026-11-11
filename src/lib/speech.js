import { useSyncExternalStore } from 'react'
import { Capacitor } from '@capacitor/core'
import AUDIO from '../data/audio.json'

// Sound for the app.
// 1) Pre-rendered MP3 files (public/audio) for every lesson sentence and vocabulary item:
//    these play the same on every phone and laptop, even offline.
// 2) Anything else (custom lessons, highlighted text) falls back to the device's voice:
//    the native engine in the Android app, speechSynthesis in browsers.

const isNative = Capacitor.isNativePlatform()
const ACCENT_LANG = { us: 'en-US', uk: 'en-GB', au: 'en-AU' }
const norm = (t) => t.trim().toLowerCase()

// ---- who is speaking right now (for ▶ / ⏹ buttons) ----
let speaking = null // the id of what is playing (text or key), or null
const listeners = new Set()
function setSpeaking(v) { speaking = v; listeners.forEach((l) => l()) }
export function useSpeaking() {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb) }, () => speaking)
}

// ---- pre-rendered audio files ----
let audio = null
let finishCurrent = null // resolves the promise of the clip that is playing
const audioUrl = (name) => `${import.meta.env.BASE_URL}audio/${name}`
function getAudio() {
  if (!audio) { audio = new Audio(); audio.preload = 'auto' }
  return audio
}

export function hasAudio(text, key) {
  return !!((key && AUDIO[key]) || (text && AUDIO[`T:${norm(text)}`]))
}

function playFile(name, rate, id) {
  return new Promise((resolve) => {
    const a = getAudio()
    let settled = false
    const done = (r) => {
      if (settled) return
      settled = true
      a.onended = a.onerror = null
      if (finishCurrent === done) { finishCurrent = null; setSpeaking(null) }
      resolve(r)
    }
    finishCurrent = done
    setSpeaking(id)
    a.onended = () => done({ ok: true })
    a.onerror = () => done({ ok: false, reason: 'error' })
    a.src = audioUrl(name)
    // Changing src resets the speed, so set it afterwards
    a.defaultPlaybackRate = rate
    a.playbackRate = rate
    a.preservesPitch = true
    a.play().catch((e) => done({ ok: false, reason: e?.name === 'NotAllowedError' ? 'blocked' : 'error' }))
  })
}

// Phones only allow sound after a tap: play a silent clip on the first tap to unlock audio
let unlocked = false
export function unlockAudio() {
  if (unlocked) return
  unlocked = true
  if (finishCurrent) return
  const a = getAudio()
  a.src = audioUrl('silence.mp3')
  a.play().then(() => a.pause()).catch(() => { unlocked = false })
  if (!isNative && window.speechSynthesis) {
    // Same idea for the browser voice (needed on iPhone/Android Chrome)
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u) } catch { /* ignore */ }
  }
}

// ---- device voice fallback ----
let nativeTTS = null
async function getNative() {
  if (!nativeTTS) nativeTTS = (await import('@capacitor-community/text-to-speech')).TextToSpeech
  return nativeTTS
}

function browserVoices() {
  const synth = window.speechSynthesis
  const now = synth.getVoices()
  if (now.length) return Promise.resolve(now)
  // Chrome loads the voice list asynchronously
  return new Promise((res) => {
    const t = setTimeout(() => res(synth.getVoices()), 1200)
    synth.addEventListener('voiceschanged', () => { clearTimeout(t); res(synth.getVoices()) }, { once: true })
  })
}

let keepUtterance = null // Chrome may garbage-collect an utterance mid-speech and never fire "end"
async function speakBrowser(text, lang, rate, id) {
  const synth = window.speechSynthesis
  if (!synth) return { ok: false, reason: 'unsupported' }
  const voices = await browserVoices()
  const fix = (l) => (l || '').replace('_', '-').toLowerCase()
  const english = voices.filter((v) => fix(v.lang).startsWith('en'))
  if (!english.length) return { ok: false, reason: 'no-voice' }
  const voice = english.find((v) => fix(v.lang) === lang.toLowerCase() && /natural|google|online|enhanced|premium/i.test(v.name))
    || english.find((v) => fix(v.lang) === lang.toLowerCase())
    || english.find((v) => fix(v.lang) === 'en-us') || english[0]
  if (synth.speaking || synth.pending) { synth.cancel(); await new Promise((r) => setTimeout(r, 80)) } // Android Chrome drops speech right after cancel()
  if (synth.paused) synth.resume()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    keepUtterance = u
    u.voice = voice
    u.lang = voice.lang
    u.rate = rate
    let settled = false
    const done = (r) => {
      if (settled) return
      settled = true
      clearTimeout(safety)
      if (finishCurrent === done) { finishCurrent = null; setSpeaking(null) }
      resolve(r)
    }
    // Some browsers never fire "end": give up after the expected length
    const safety = setTimeout(() => done({ ok: true }), 2500 + (text.split(/\s+/).length * 600) / rate)
    finishCurrent = done
    setSpeaking(id)
    u.onend = () => done({ ok: true })
    u.onerror = (e) => done({ ok: e.error === 'interrupted' || e.error === 'canceled', reason: e.error === 'not-allowed' ? 'blocked' : e.error })
    synth.speak(u)
  })
}

async function speakNative(text, lang, rate, id) {
  const t = await getNative()
  let settled = false
  return new Promise((resolve) => {
    const done = (r) => {
      if (settled) return
      settled = true
      if (finishCurrent === done) { finishCurrent = null; setSpeaking(null) }
      resolve(r)
    }
    finishCurrent = done
    setSpeaking(id)
    t.speak({ text, lang, rate, pitch: 1, volume: 1, category: 'playback' })
      .then(() => done({ ok: true }))
      // The phone may lack this accent: retry once in US English
      .catch(() => t.speak({ text, lang: 'en-US', rate, pitch: 1, volume: 1, category: 'playback' })
        .then(() => done({ ok: true }))
        .catch(() => done({ ok: false, reason: 'no-voice' })))
  })
}

/**
 * Speak a text. Uses the pre-rendered file when there is one.
 * Resolves with { ok, reason }: reason is 'blocked' (needs a tap first), 'no-voice', 'stopped' or 'error'.
 */
export async function speak(text, { rate = 1, accent = 'us', key } = {}) {
  stopSpeak()
  const id = key || text
  const file = (key && AUDIO[key]) || AUDIO[`T:${norm(text)}`]
  if (file) {
    const r = await playFile(file, rate, id)
    if (r.ok || r.reason === 'stopped' || r.reason === 'blocked') return r
    // file failed to load (e.g. offline before it was cached): try the device voice
  }
  const lang = ACCENT_LANG[accent] || 'en-US'
  return isNative ? speakNative(text, lang, rate, id) : speakBrowser(text, lang, rate, id)
}

export function stopSpeak() {
  const finish = finishCurrent
  finishCurrent = null
  if (audio && !audio.paused) audio.pause()
  if (isNative) getNative().then((t) => t.stop()).catch(() => {})
  else if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) window.speechSynthesis.cancel()
  if (finish) finish({ ok: false, reason: 'stopped' })
  if (speaking !== null) setSpeaking(null)
}

export const ttsAvailable = () => true

// Message to show when sound could not play
export function soundHint(reason) {
  if (reason === 'blocked') return 'Trình duyệt chặn tự phát âm thanh — bấm ▶ Phát để nghe nhé.'
  if (reason === 'no-voice') return 'Máy này chưa có giọng đọc tiếng Anh cho câu tự tạo. Android: Cài đặt → Hệ thống → Ngôn ngữ → Chuyển văn bản thành giọng nói → chọn Google và tải tiếng Anh.'
  if (reason === 'error') return 'Không phát được âm thanh. Kiểm tra mạng hoặc âm lượng rồi thử lại.'
  return ''
}
