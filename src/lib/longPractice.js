// Long-sentence practice: how a long sentence is cut into chunks, graded, and practised a different
// way each time it comes back (translate → put chunks in order → dictation → fill the gaps → say it).
import { grade, tokens } from './grade.js'
import { CONNECT, norm, has, VI_CHARS } from './explain.js'

// Each review of the same sentence uses the next exercise, so repetition never feels the same
export const LONG_MODES = ['translate', 'build', 'dictate', 'gap', 'speak']
export const LONG_MODE_NAME = {
  translate: '✍️ Dịch câu dài', build: '🧱 Xếp cụm từ thành câu', dictate: '🎧 Nghe & chép lại', gap: '🔤 Điền từ còn thiếu', speak: '🎙️ Nói cả câu',
}
export const DLG_MODES = ['reply', 'pick', 'shadow', 'reply']
export const DLG_MODE_NAME = { reply: '🗣️ Trả lời bằng câu dài', pick: '⚡ Chọn câu đáp hay nhất', shadow: '🎧 Nghe & nhắc lại câu đáp mẫu' }
export const modeOf = (modes, seen = 0) => modes[seen % modes.length]

// Long sentences are graded a little more kindly: a 25-word sentence said another way rarely
// matches word for word, so 85% with at most two content words missing counts as right.
export function gradeLong(answer, refs) {
  const g = grade(answer, refs)
  const n = tokens(g.best).length
  if (n < 12) return g
  const verdict = g.score >= 0.85 && g.missing.length <= 2 ? 'right' : g.score >= 0.62 ? 'close' : 'wrong'
  return { ...g, verdict }
}

// Words that start a new chunk (a clause or a phrase) — split before them
const BREAK = new Set(['because', 'so', 'but', 'and', 'or', 'which', 'that', 'who', 'whose', 'when', 'if', 'before', 'after', 'while',
  'although', 'though', 'since', 'until', 'unless', 'to', 'for', 'in', 'on', 'at', 'with', 'from', 'by', 'about', 'as', 'than', 'instead',
  'rather', 'during', 'within', 'without', 'into', 'whether', 'otherwise', 'even', 'especially', 'including', 'provided', 'then'])

/** Cut a sentence into chunks of 2–5 words at natural places (punctuation, before linking words). */
export function chunks(sentence) {
  const words = sentence.trim().split(/\s+/)
  const raw = []
  let cur = []
  words.forEach((w, i) => {
    const bare = w.toLowerCase().replace(/[^a-z']/g, '')
    if (cur.length >= 2 && BREAK.has(bare)) { raw.push(cur); cur = [] }
    cur.push(w)
    if (/[,;:]$/.test(w) && i < words.length - 1) { raw.push(cur); cur = [] }
  })
  if (cur.length) raw.push(cur)
  // merge 1-word pieces into a neighbour, split pieces longer than 5 words
  const merged = []
  for (const c of raw) {
    if (c.length === 1 && merged.length && !/[,;:]$/.test(merged[merged.length - 1].slice(-1)[0])) merged[merged.length - 1].push(...c)
    else merged.push([...c])
  }
  if (merged.length > 1 && merged[0].length === 1) merged.splice(0, 2, [...merged[0], ...merged[1]])
  const out = []
  for (const c of merged) {
    if (c.length <= 5) { out.push(c); continue }
    const parts = Math.ceil(c.length / 4)
    const size = Math.ceil(c.length / parts)
    for (let k = 0; k < c.length; k += size) out.push(c.slice(k, k + size))
  }
  // a last piece of one word goes back to the one before
  if (out.length > 1 && out[out.length - 1].length === 1) out.splice(out.length - 2, 2, [...out[out.length - 2], ...out[out.length - 1]])
  return out.map((c) => c.join(' '))
}

/** Build mode: how many chunks are out of place → verdict. */
export function gradeOrder(picked, answer) {
  const wrong = answer.filter((c, k) => picked[k] !== c).length
  return { wrong, verdict: wrong === 0 ? 'right' : wrong <= 2 ? 'close' : 'wrong', score: 1 - wrong / answer.length }
}

const STOP = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should', 'there', 'their', 'they', 'them',
  'were', 'when', 'what', 'which', 'your', 'about', 'some', 'more', 'than', 'then', 'into', 'also', 'just', 'very', 'much', 'only', 'even',
  'because', 'before', 'after', 'while', 'until', 'since', 'though', 'although', 'whether', 'does', 'doesn', 'didn', 'isn', 'aren', 'won'])

/** Gap mode: pick key words to blank out. Different words each time the sentence comes back. */
export function gapsFor(sentence, lv, seen = 0) {
  const words = sentence.split(/\s+/)
  const cand = words.map((w, i) => ({ i, bare: w.replace(/[^A-Za-z'-]/g, '') })).filter(({ bare }) => bare.length >= 4 && !STOP.has(bare.toLowerCase()) && !bare.includes("'"))
  const want = Math.min(cand.length, lv <= 2 ? 3 : lv === 3 ? 4 : 5)
  if (!want) return { words, gaps: [] }
  const step = cand.length / want
  const shift = seen % Math.max(1, Math.floor(step))
  const gaps = Array.from({ length: want }, (_, k) => cand[Math.min(cand.length - 1, Math.floor(k * step) + shift)].i)
  return { words, gaps: [...new Set(gaps)] }
}

// One letter wrong in a long word still counts (a typo, not a wrong word)
function near(a, b) {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1 || b.length < 6) return false
  let i = 0, j = 0, edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++edits > 1) return false
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++ }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}
export function gradeGaps(values, words, gaps) {
  const res = gaps.map((g, k) => {
    const want = words[g].replace(/[^A-Za-z'-]/g, '').toLowerCase()
    const got = (values[k] || '').trim().toLowerCase().replace(/[^a-z'-]/g, '')
    return { want: words[g].replace(/[^A-Za-z'-]/g, ''), ok: near(got, want), exact: got === want }
  })
  const ok = res.filter((r) => r.ok).length
  return { res, score: gaps.length ? ok / gaps.length : 1, verdict: ok === gaps.length ? 'right' : ok / gaps.length >= 0.6 ? 'close' : 'wrong' }
}

/** Long reply in a conversation: key ideas, enough words, linked with because / so / however… */
export function gradeReply(answer, item) {
  const text = norm(answer)
  const words = text.trim().split(' ').filter(Boolean)
  const ideas = item.ideas.map((it) => ({ label: it.label, ok: it.kw.some((k) => has(text, words, k)) }))
  const links = CONNECT.filter((c) => has(text, words, c))
  const target = Math.max(10, Math.round(item.b.split(/\s+/).length * 0.6))
  const need = item.lv >= 3 ? 2 : 1
  const ideaPart = ideas.filter((i) => i.ok).length / ideas.length
  let score = 0.7 * ideaPart + 0.2 * Math.min(1, words.length / target) + 0.1 * Math.min(1, links.length / need)
  if (ideaPart === 0) score = Math.min(score, 0.2)
  if (VI_CHARS.test(answer) || !words.length) score = 0
  const verdict = score >= 0.8 ? 'right' : score >= 0.55 ? 'close' : 'wrong'
  return { score, verdict, ideas, words: words.length, target, links, need }
}
