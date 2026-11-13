// Numbers for the Giao tiếp statistics page, all derived from the day log and the review state.
import { todayKey, addDays, weekKeys, diffDays } from './date.js'
import { levelInfo, streak, accuracy, SKILLS, MIN_PER_DAY, STAGES } from './convo.js'

const sumPair = (list) => list.reduce((a, p) => [a[0] + (p?.[0] || 0), a[1] + (p?.[1] || 0)], [0, 0])
const avg = (p) => (p[1] ? p[0] / p[1] : null)

function windowOf(days, from, len) {
  const keys = Array.from({ length: len }, (_, k) => addDays(from, k))
  const xs = keys.map((d) => days[d] || {})
  const n = xs.reduce((a, x) => a + (x.n || 0), 0)
  const ok = xs.reduce((a, x) => a + (x.ok || 0), 0)
  const sk = Object.fromEntries(SKILLS.map(([k]) => [k, sumPair(xs.map((x) => x.sk?.[k]))]))
  return {
    n, acc: n ? ok / n : null, active: xs.filter((x) => (x.n || 0) > 0).length,
    xp: xs.reduce((a, x) => a + (x.xp || 0), 0),
    rt: avg(sumPair(xs.map((x) => x.rt))), tt: avg(sumPair(xs.map((x) => x.tt))), sk,
  }
}

// Mastery buckets of everything studied (Leitner box)
export const MASTERY = [
  { key: 'new', name: 'Mới gặp', test: (b) => b <= 1 },
  { key: 'learning', name: 'Đang nhớ', test: (b) => b === 2 || b === 3 },
  { key: 'solid', name: 'Khá chắc', test: (b) => b === 4 },
  { key: 'mastered', name: 'Thuộc lòng', test: (b) => b >= 5 },
]
const TYPE_OF = (id) => (id.startsWith('rp') ? 'role' : id[0] === 't' ? 'tr' : id[0] === 'r' ? 'rf' : id[0] === 'p' ? 'phrase' : id[0] === 'e' ? 'ex' : null)
export const TYPE_NAME = { tr: 'Câu dịch', rf: 'Câu phản xạ', phrase: 'Mẫu câu', role: 'Hội thoại', ex: 'Diễn đạt ý' }

export function convoStats(state, today = todayKey()) {
  const { convoDays: days = {}, convoItems: items = {}, convo = {} } = state
  const keys = Object.keys(days).filter((d) => d <= today).sort()

  // Last 30 days, one bar per day
  const daily = Array.from({ length: 30 }, (_, k) => {
    const d = addDays(today, k - 29)
    const x = days[d] || {}
    return { d, n: x.n || 0, ok: x.ok || 0, xp: x.xp || 0, rt: avg(x.rt || [0, 0]), tt: avg(x.tt || [0, 0]) }
  })
  // Last 12 weeks (Monday-first)
  const monday = weekKeys(today)[0]
  const weekly = Array.from({ length: 12 }, (_, k) => {
    const start = addDays(monday, (k - 11) * 7)
    return { start, ...windowOf(days, start, 7) }
  })

  // This week of 7 days vs the 7 before; skills over 14 days vs the 14 before
  const last7 = windowOf(days, addDays(today, -6), 7)
  const prev7 = windowOf(days, addDays(today, -13), 7)
  const last14 = windowOf(days, addDays(today, -13), 14)
  const prev14 = windowOf(days, addDays(today, -27), 14)
  const skills = SKILLS.map(([k, icon, name]) => ({ k, icon, name, now: avg(last14.sk[k]), before: avg(prev14.sk[k]), count: last14.sk[k][1] }))

  // Totals and longest streak
  let longest = 0
  let run = 0
  let prev = null
  for (const d of keys) {
    if ((days[d].n || 0) >= MIN_PER_DAY) { run = prev && diffDays(prev, d) === 1 ? run + 1 : 1; prev = d; longest = Math.max(longest, run) }
  }
  const total = keys.reduce((a, d) => a + (days[d].n || 0), 0)
  const activeDays = keys.filter((d) => (days[d].n || 0) > 0).length
  const firstDay = keys.find((d) => (days[d].n || 0) > 0) || today

  // Mastery by type
  const byType = {}
  for (const [id, s] of Object.entries(items)) {
    const t = TYPE_OF(id)
    if (!t || s.bad || id.includes(':')) continue
    const b = s.box || 0
    const bucket = MASTERY.find((m) => m.test(b)).key
    byType[t] ||= { new: 0, learning: 0, solid: 0, mastered: 0 }
    byType[t][bucket]++
  }
  const mastery = MASTERY.map((m) => ({ ...m, count: Object.values(byType).reduce((a, x) => a + x[m.key], 0) }))

  // Level forecast from the XP pace of the last 14 days
  const lvl = levelInfo(convo)
  const pace = last14.xp / 14
  const stageNeed = (s) => 120 + 30 * s
  let toNextCefr = lvl.need - lvl.into
  for (let s = lvl.stage + 1; s < STAGES && Math.floor(s / 3) === lvl.cefr; s++) toNextCefr += stageNeed(s)
  const forecast = lvl.cefr < 5 && pace > 0 ? Math.ceil(toNextCefr / pace) : null

  // Sentences that keep slipping (forgotten 2+ times)
  const hard = Object.entries(items).filter(([id, s]) => !s.bad && (s.lapses || 0) >= 2 && /^t\d/.test(id))
    .sort((a, b) => (b[1].lapses || 0) - (a[1].lapses || 0)).slice(0, 8).map(([id, s]) => ({ id, lapses: s.lapses, box: s.box || 0 }))

  return {
    daily, weekly, last7, prev7, skills, total, activeDays, firstDay, longest, streak: streak(days, today),
    accRecent: accuracy(convo), mastery, byType, lvl, pace, forecast, hard, sprints: convo.sprints || [],
  }
}
