// Prints every text the app needs as audio (JSON), for scripts/build_audio.py
import { LESSONS } from '../src/data/listening.js'
import { FAMILIES } from '../src/data/vocab.js'

// Conversations (Part 2–3) alternate two speakers
const DIALOGUE = new Set(['l2', 'l3', 'l5', 'l6', 'l7', 'l9', 'l12'])
const items = []
for (const l of LESSONS) {
  l.s.forEach(([en], i) => {
    const second = DIALOGUE.has(l.id) && i % 2 === 1
    items.push({ key: `L:${l.id}:${i}`, text: en, voice: `${l.accent}${second ? '2' : '1'}`, slow: true })
  })
}
const seen = new Set()
const add = (text) => {
  const k = text.trim().toLowerCase()
  if (!k || seen.has(k)) return
  seen.add(k)
  items.push({ key: `T:${k}`, text: text.trim(), voice: 'us1' })
}
for (const f of FAMILIES) {
  f.words.forEach(([w]) => add(w))
  f.syn.forEach(add)
  f.ant.forEach(add)
  f.ex.forEach(([en]) => add(en))
}
process.stdout.write(JSON.stringify(items))
