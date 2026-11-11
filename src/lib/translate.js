import { DICT } from '../data/vocab.js'

const cache = new Map()

export function localLookup(text) {
  const key = text.trim().toLowerCase().replace(/[.,!?;:"'()]/g, '')
  return DICT.get(key) || null
}

// Free translation through MyMemory (no API key; ~5000 chars/day per IP)
export async function translate(text, from = 'en', to = 'vi') {
  const q = text.trim().slice(0, 450)
  const ck = `${from}|${to}|${q}`
  if (cache.has(ck)) return cache.get(ck)
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${from}|${to}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Không dịch được')
  const data = await res.json()
  const out = data?.responseData?.translatedText || ''
  cache.set(ck, out)
  return out
}

export const looksVietnamese = (t) => /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i.test(t)
