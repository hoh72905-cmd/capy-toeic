import { speak, stopSpeak, useSpeaking } from '../lib/speech.js'

// 🔊 button; shows ⏹ while its own text is playing
export default function Speak({ text, accent = 'us', rate = 1, small, label }) {
  const now = useSpeaking()
  const mine = now === text
  return (
    <button type="button" className={`icon-btn ${small ? 'sm' : ''} ${mine ? 'playing' : ''}`} title={mine ? 'Dừng' : 'Phát âm'}
      onClick={(e) => { e.stopPropagation(); if (mine) stopSpeak(); else speak(text, { accent, rate }) }}>
      {mine ? '⏹' : '🔊'}{label ? <span> {label}</span> : null}
    </button>
  )
}
