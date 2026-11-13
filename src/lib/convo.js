// "Giao tiếp" engine: levels A1–C2 (3 stages each), XP, daily streak, spaced repetition and the
// daily routine. Repetition is the core: every sentence learned comes back on a 1-2-4-7-15-30-day
// rhythm, the core phrases come back every day until they are automatic, and each day mixes
// review, new sentences, reflex replies, asking questions and a short speaking task.
import { getState, setState } from './store.js'
import { todayKey, addDays } from './date.js'
import { review, isDue } from './srs.js'
import { PHRASES } from '../data/convoPhrases.js'
import { ROLEPLAYS } from '../data/roleplay.js'
import { EXPLAIN } from '../data/explain.js'

export const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
export const CEFR_VI = ['Mới bắt đầu', 'Sơ cấp', 'Trung cấp', 'Trung cao cấp', 'Cao cấp', 'Thành thạo']
export const STAGES = 18
export const MIN_PER_DAY = 5 // sentences a day to keep the streak
const stageXP = (s) => 120 + 30 * s

let dataPromise = null
export const loadConvo = () => (dataPromise ||= import('../data/convo.json').then((m) => {
  const d = m.default
  return {
    ...d,
    tr: d.tr.map(([id, lv, vi, en, q]) => ({ id: `t${id}`, src: id, lv, vi, en, q: !!q })),
    rf: d.rf.map(([id, lv, a, b, wrong]) => ({ id: `r${id}`, lv, a, b, wrong })),
  }
}))

// Stage / level from total XP
export function levelInfo(convo = getState().convo) {
  let s = convo.start || 0
  let x = convo.xp || 0
  while (s < STAGES - 1 && x >= stageXP(s)) { x -= stageXP(s); s++ }
  const need = stageXP(s)
  return { stage: s, cefr: Math.floor(s / 3), sub: (s % 3) + 1, into: Math.min(x, need), need, pct: Math.min(100, Math.round((x / need) * 100)), name: `${CEFR[Math.floor(s / 3)]} · ${(s % 3) + 1}` }
}

// Recent accuracy (last 20 answers): accurate learners level up faster
export function accuracy(convo = getState().convo) {
  const r = convo.recent || []
  return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 0.7
}

export function streak(days = getState().convoDays, today = todayKey()) {
  let n = 0
  let d = (days[today]?.n || 0) >= MIN_PER_DAY ? today : addDays(today, -1)
  while ((days[d]?.n || 0) >= MIN_PER_DAY) { n++; d = addDays(d, -1) }
  return n
}

// ---- the daily routine ----
// Level mix for new content: mostly the current level, some of the level below to consolidate,
// a little of the next level to stretch.
function pickNew(list, items, cefr, count, extra = () => true) {
  const fresh = (lv) => list.filter((x) => x.lv === lv && !items[x.id] && extra(x))
  const out = []
  const want = [[cefr, Math.ceil(count * 0.7)], [Math.max(0, cefr - 1), Math.round(count * 0.2)], [Math.min(5, cefr + 1), count]]
  for (const [lv, n] of want) {
    for (const x of fresh(lv)) {
      if (out.length >= count || out.filter((o) => o.lv === lv).length >= n) break
      if (!out.includes(x)) out.push(x)
    }
  }
  for (let lv = cefr; out.length < count && lv <= 5; lv++) for (const x of fresh(lv)) { if (out.length >= count) break; if (!out.includes(x)) out.push(x) }
  return out.map((x) => x.id)
}

export function buildPlan(D, state = getState(), date = todayKey()) {
  const { convo, convoItems: items } = state
  const { cefr } = levelInfo(convo)
  const per = Math.max(5, Math.min(10, convo.daily || 7))
  const due = Object.entries(items).filter(([id, s]) => !s.bad && isDue(s) && s.added && s.added < date && !id.startsWith('p'))
    .sort((a, b) => (a[1].due || '').localeCompare(b[1].due || '') || (a[1].box || 0) - (b[1].box || 0)).map(([id]) => id)
  const reviewTr = due.filter((id) => id.startsWith('t')).slice(0, 10)
  const reviewRf = due.filter((id) => /^r\d/.test(id)).slice(0, 3)
  const phraseDue = PHRASES.filter((p) => items[p.id] && isDue(items[p.id]) && p.lv <= cefr + 1).map((p) => p.id)
  const phraseNew = PHRASES.filter((p) => !items[p.id] && p.lv <= cefr).map((p) => p.id)
  return {
    role: pickRole(items, cefr, date),
    review: reviewTr,
    fresh: pickNew(D.tr, items, cefr, per, (x) => !x.q),
    ask: pickNew(D.tr, items, cefr, 2, (x) => x.q),
    reflex: [...pickNew(D.rf, items, cefr, 5 - Math.min(2, reviewRf.length)), ...reviewRf.slice(0, 2)],
    phrases: [...phraseDue.slice(0, 3), ...phraseNew].slice(0, 3),
    explain: pickExplain(items, cefr, date),
  }
}

// "Diễn đạt ý" of the day: one due for review, else the next new one at (or near) the level
export function pickExplain(items, cefr, date = todayKey()) {
  const due = EXPLAIN.filter((e) => items[e.id] && !items[e.id].bad && isDue(items[e.id]) && items[e.id].added < date && e.lv <= cefr + 1)
  if (due.length) return due[0].id
  for (const lv of [cefr, cefr - 1, cefr + 1]) {
    const fresh = EXPLAIN.find((e) => e.lv === lv && !items[e.id])
    if (fresh) return fresh.id
  }
  const seen = EXPLAIN.filter((e) => e.lv <= cefr + 1).sort((a, b) => (items[a.id]?.last || '').localeCompare(items[b.id]?.last || ''))
  return seen[0]?.id || EXPLAIN[0].id
}

// Role-play of the day: one that is due for review, else the next new one at (or near) the level
export function pickRole(items, cefr, date = todayKey()) {
  const due = ROLEPLAYS.filter((r) => items[r.id] && !items[r.id].bad && isDue(items[r.id]) && items[r.id].added < date && r.lv <= cefr + 1)
  if (due.length) return due[0].id
  for (const lv of [cefr, cefr - 1, cefr + 1, cefr - 2]) {
    const fresh = ROLEPLAYS.find((r) => r.lv === lv && !items[r.id])
    if (fresh) return fresh.id
  }
  const seen = ROLEPLAYS.filter((r) => r.lv <= cefr + 1).sort((a, b) => (items[a.id]?.last || '').localeCompare(items[b.id]?.last || ''))
  return seen[0]?.id || ROLEPLAYS[0].id
}
// Role-plays open up to one level above the learner's
export const roleUnlocked = (r, cefr) => r.lv <= cefr + 1

// Today's plan, made once and kept (so it is the same after a reload or on another device)
export function todayPlan(D) {
  const date = todayKey()
  const day = getState().convoDays[date]
  if (day?.plan && day.plan.role && day.plan.explain) return day.plan
  if (day?.plan) { // made by an older version: add what it lacks
    const { cefr } = levelInfo()
    const items = getState().convoItems
    const add = { role: day.plan.role || pickRole(items, cefr, date), explain: day.plan.explain || pickExplain(items, cefr, date) }
    setState((s) => ({ convoDays: { ...s.convoDays, [date]: { ...s.convoDays[date], plan: { ...s.convoDays[date].plan, ...add } } } }))
    return { ...day.plan, ...add }
  }
  const plan = buildPlan(D)
  setState((s) => ({ convoDays: { ...s.convoDays, [date]: { n: 0, ok: 0, xp: 0, done: {}, ...(s.convoDays[date] || {}), plan } } }))
  return plan
}

// ---- recording answers ----
const VERDICT_GRADE = { right: 2, close: 1, wrong: 0 }
const BASE_XP = { fresh: 10, ask: 10, review: 6, reflex: 5, phrase: 2, speak: 20, roleTurn: 8, role: 15, explain: 20 }
// Skill each kind of answer trains (for the statistics page)
const SKILL_OF = { fresh: 'tr', review: 'tr', ask: 'ask', reflex: 'rf', roleTurn: 'role', explain: 'ex' }
export const SKILLS = [
  ['tr', '✍️', 'Dịch & nói câu'], ['listen', '🎧', 'Nghe & nhắc lại'], ['ask', '❓', 'Đặt câu hỏi'],
  ['rf', '⚡', 'Phản xạ đáp lời'], ['role', '🎭', 'Hội thoại'], ['ex', '🧩', 'Diễn đạt ý'],
]
const addPair = (p, a, b = 1) => [(p?.[0] || 0) + a, (p?.[1] || 0) + b]
const NO_SRS = new Set(['speak', 'roleTurn']) // a role-play turn is graded, the whole dialogue gets the review date

/**
 * Record one answer. kind: fresh | ask | review | reflex | phrase | speak | roleTurn | role | explain.
 * verdict: right | close | wrong. Options: fast (reflex bonus), alt (accepted own answer), ms (time to
 * answer), skill (override, e.g. 'listen'), score (0–1, explain).
 * Returns { xp, levelUp: new level info or null }.
 */
export function recordAnswer(id, kind, verdict, { fast = false, alt, ms, skill, score } = {}) {
  const date = todayKey()
  const before = levelInfo()
  let gained = 0
  setState((s) => {
    const convo = { ...s.convo }
    const val = score ?? (verdict === 'right' ? 1 : verdict === 'close' ? 0.6 : 0)
    if (kind !== 'phrase' && kind !== 'speak' && kind !== 'role') convo.recent = [...(convo.recent || []), val].slice(-20)
    const mult = 0.6 + 0.8 * accuracy(convo) // 0.6× … 1.4×
    gained = Math.round((verdict === 'wrong' ? 2 : BASE_XP[kind] * (verdict === 'close' ? 0.7 : 1) + (fast ? 2 : 0)) * (kind === 'phrase' || kind === 'speak' || kind === 'role' ? 1 : mult))
    convo.xp = (convo.xp || 0) + gained
    const prev = s.convoItems[id] || { box: 0, added: date }
    const next = NO_SRS.has(kind) ? { ...prev, last: date, seen: (prev.seen || 0) + 1 } : review(prev, VERDICT_GRADE[verdict])
    if (alt) next.alt = [...new Set([...(prev.alt || []), alt])].slice(-3)
    const day = { n: 0, ok: 0, xp: 0, done: {}, ...(s.convoDays[date] || {}) }
    const counts = kind === 'fresh' || kind === 'ask' || kind === 'review' || kind === 'roleTurn' || kind === 'explain'
    day.n += counts ? 1 : 0
    day.ok += counts && verdict !== 'wrong' ? 1 : 0
    day.xp += gained
    day.done = { ...day.done, [kind]: [...new Set([...(day.done[kind] || []), id])] }
    // Statistics: score per skill, reply speed (reflex) and thinking time (sentences), as [sum, count]
    const sk = skill || SKILL_OF[kind]
    if (sk) day.sk = { ...(day.sk || {}), [sk]: addPair(day.sk?.[sk], val) }
    if (ms > 0 && verdict !== 'wrong') {
      if (kind === 'reflex') day.rt = addPair(day.rt, Math.min(ms, 15000))
      else if (sk === 'tr' || sk === 'ask') day.tt = addPair(day.tt, Math.min(ms, 60000))
    }
    // Daily bonuses: reaching the minimum, and finishing the whole routine; doubled when accurate
    const acc = day.n ? day.ok / day.n : 0
    if (!day.bonusMin && day.n >= MIN_PER_DAY) { const b = acc >= 0.9 ? 40 : 20; day.bonusMin = b; day.xp += b; convo.xp += b; gained += b }
    const itemId = kind === 'roleTurn' ? id.split(':')[0] : id
    if (kind === 'roleTurn') { const cur = s.convoItems[itemId] || { box: 0, added: date }; return { convo, convoItems: { ...s.convoItems, [itemId]: { ...cur, added: cur.added || date } }, convoDays: { ...s.convoDays, [date]: day } } }
    return { convo, convoItems: { ...s.convoItems, [itemId]: next }, convoDays: { ...s.convoDays, [date]: day } }
  })
  const after = levelInfo()
  return { xp: gained, levelUp: after.stage > before.stage ? after : null }
}

// Finishing every part of the routine
export function routineBonus() {
  const date = todayKey()
  const day = getState().convoDays[date]
  if (!day || day.bonusFull) return 0
  const acc = day.n ? day.ok / day.n : 0
  const b = acc >= 0.9 ? 60 : 30
  setState((s) => ({ convo: { ...s.convo, xp: (s.convo.xp || 0) + b }, convoDays: { ...s.convoDays, [date]: { ...s.convoDays[date], bonusFull: b, xp: (s.convoDays[date].xp || 0) + b } } }))
  return b
}

// Hide a sentence that is wrong or unnatural
export function flagItem(id) {
  setState((s) => ({ convoItems: { ...s.convoItems, [id]: { ...(s.convoItems[id] || { box: 0, added: todayKey() }), bad: true } } }))
}

// ---- placement test ----
export function placementItems(D) {
  const pick = (list, lv, n, extra = () => true) => list.filter((x) => x.lv === lv && extra(x)).sort((a, b) => (a.src || 0) - (b.src || 0)).filter((_, i) => i % 7 === 3).slice(0, n)
  const reflex = [0, 1, 2, 3, 4, 5].flatMap((lv) => pick(D.rf, lv, 1))
  const trans = [0, 1, 2, 3, 4, 5].flatMap((lv) => pick(D.tr, lv, 1, (x) => !x.q && x.en.length > 1).concat(pick(D.tr, lv, 1, (x) => !x.q)).slice(0, 1))
  return { reflex, trans }
}

// Points per level (reflex right = 1, translation right = 1, close = 0.6) → starting level:
// the highest level reached with every level below it mostly right.
export function placementLevel(points) {
  let lv = 0
  for (let k = 0; k < 6; k++) {
    if ((points[k] || 0) >= 1.2) lv = k + 1; else break
  }
  return Math.min(5, lv)
}

export function setStart(cefr) {
  setState((s) => ({ convo: { ...s.convo, start: cefr * 3, xp: 0, placed: todayKey(), recent: [] } }))
}

// Words of the day for widgets: the 3 phrases due today (or the next new ones)
export function phrasesOfDay(state = getState()) {
  const { cefr } = levelInfo(state.convo)
  const items = state.convoItems
  const due = PHRASES.filter((p) => items[p.id] && isDue(items[p.id]) && p.lv <= cefr + 1)
  const fresh = PHRASES.filter((p) => !items[p.id] && p.lv <= cefr)
  const seen = PHRASES.filter((p) => items[p.id] && p.lv <= cefr).sort((a, b) => (items[a.id].last || '').localeCompare(items[b.id].last || ''))
  return [...due, ...fresh, ...seen].slice(0, 3)
}

// ---- 60-second reflex challenge ----
// Saves the run, gives XP (1 per right answer, at most 30 a day from challenges) and returns the result.
export function saveSprint({ right, wrong, ms }) {
  const date = todayKey()
  const before = levelInfo()
  let xp = 0
  setState((s) => {
    const day = { n: 0, ok: 0, xp: 0, done: {}, ...(s.convoDays[date] || {}) }
    xp = Math.max(0, Math.min(right, 30 - (day.sprintXp || 0)))
    day.sprints = (day.sprints || 0) + 1
    day.sprintXp = (day.sprintXp || 0) + xp
    day.xp += xp
    const sprints = [...(s.convo.sprints || []), { d: date, r: right, w: wrong, ms: Math.round(ms) }].slice(-60)
    return { convo: { ...s.convo, xp: (s.convo.xp || 0) + xp, sprints }, convoDays: { ...s.convoDays, [date]: day } }
  })
  const after = levelInfo()
  return { xp, levelUp: after.stage > before.stage ? after : null }
}
