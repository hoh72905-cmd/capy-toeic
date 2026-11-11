import { speak } from '../lib/speech.js'

export default function Speak({ text, accent = 'us', rate = 1, small, label }) {
  return (
    <button type="button" className={`icon-btn ${small ? 'sm' : ''}`} title="Phát âm"
      onClick={(e) => { e.stopPropagation(); speak(text, { accent, rate }) }}>
      🔊{label ? <span> {label}</span> : null}
    </button>
  )
}
