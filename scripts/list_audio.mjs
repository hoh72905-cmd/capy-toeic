// Prints every text the app needs as audio (JSON), for scripts/build_audio.py
import { LESSONS } from '../src/data/listening.js'
import { FAMILIES, TSL_CARDS } from '../src/data/vocab.js'

// Conversations (Part 2–3) alternate two speakers
const DIALOGUE = new Set(['l2', 'l3', 'l5', 'l6', 'l7', 'l9', 'l12'])
// Everyday-sentence lessons rotate through North American, British and Australian voices
const ROTATE = ['us3', 'ca1', 'uk1', 'us4', 'ca2', 'au1', 'us2', 'ca1', 'uk2', 'us1']
const items = []
let n = 0
for (const l of LESSONS) {
  const rot = l.tatoeba ? ROTATE[n++ % ROTATE.length] : null
  l.s.forEach(([en], i) => {
    const second = DIALOGUE.has(l.id) && i % 2 === 1
    items.push({ key: `L:${l.id}:${i}`, text: en, voice: rot || `${l.accent}${second ? '2' : '1'}`, slow: true })
  })
}
const seen = new Set()
const add = (text, voice = 'us1') => {
  const k = text.trim().toLowerCase()
  if (!k || seen.has(k)) return
  seen.add(k)
  items.push({ key: `T:${k}`, text: text.trim(), voice })
}
for (const f of FAMILIES) {
  f.words.forEach(([w]) => add(w))
  f.syn.forEach((w) => add(w))
  f.ant.forEach((w) => add(w))
  f.ex.forEach(([en]) => add(en))
}
// TOEIC Service List words and their example sentences
for (const c of TSL_CARDS) add(c.w)
TSL_CARDS.forEach((c, i) => { if (c.ex) add(c.ex[0], i % 2 ? 'us3' : 'ca1') })
process.stdout.write(JSON.stringify(items))
