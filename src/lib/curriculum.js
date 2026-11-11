import { CURRI } from '../data/curriculum.js'
import { todayKey, addDays, diffDays } from './date.js'

export const CAT = {
  grammar: { name: 'Ngữ pháp', icon: '🧩' },
  vocab: { name: 'Chủ đề từ vựng', icon: '📚' },
  listening: { name: 'Kỹ năng nghe', icon: '🎧' },
  reading: { name: 'Kỹ năng đọc', icon: '📖' },
}
const CAT_ORDER = ['grammar', 'vocab', 'listening', 'reading']
const byId = new Map(CURRI.lessons.map((l) => [l.id, l]))
export const lessonById = (id) => byId.get(id)

// CEFR level for a TOEIC Listening & Reading total score (from the dataset)
export function cefrFor(score) {
  if (!score) return null
  return CURRI.levels.find((l) => score >= l.from && score <= l.to) || (score < 120 ? null : CURRI.levels.at(-1))
}

// Competencies needed for a target score.
// Grammar bands are on the total score; listening/reading bands are on the section score (≈ total / 2).
export function requiredComps(target) {
  return CURRI.comps.filter((c) => c.from <= (c.scope === 'total' ? target : target / 2))
}

// Competencies already behind the learner: their score is past the start of the next band
// in the same group (grammar bands use the total score; listening/reading use the section score ≈ total / 2).
const groupOf = (c) => (c.scope === 'total' ? 'total' : /Listening/i.test(c.name) ? 'listening' : 'reading')
export function masteredComps(current) {
  if (!current) return new Set()
  const out = new Set()
  for (const g of ['total', 'listening', 'reading']) {
    const bands = CURRI.comps.filter((c) => groupOf(c) === g).sort((a, b) => a.from - b.from)
    const score = g === 'total' ? current : current / 2
    bands.forEach((c, i) => { if (bands[i + 1] && bands[i + 1].from <= score) out.add(c.id) })
  }
  return out
}

// Lessons whose needed competencies are all already mastered
function splitLessons(target, current) {
  const need = new Set(requiredComps(target).map((c) => c.id))
  const known = masteredComps(current)
  const core = [], skipped = []
  for (const l of CURRI.lessons) {
    const mine = l.comps.filter((c) => need.has(c))
    if (!mine.length) continue
    if (mine.every((c) => known.has(c))) skipped.push(l); else core.push(l)
  }
  return { core, skipped }
}
export const skippedLessons = (target, current) => splitLessons(target, current).skipped

// Lessons to learn for the target, in a sensible order:
// categories interleaved, easier first, prerequisites placed before the lesson that needs them.
// With a current score, lessons below the learner's level are left out.
export function requiredLessons(target, current = null) {
  const { core, skipped } = splitLessons(target, current)
  const skip = new Set(skipped.map((l) => l.id))
  const queues = Object.fromEntries(CAT_ORDER.map((c) => [c, core.filter((l) => l.cat === c).sort((a, b) => a.diff - b.diff)]))
  const placed = new Set(); const order = []
  const place = (l) => {
    if (placed.has(l.id)) return
    placed.add(l.id)
    l.pre.forEach((p) => byId.get(p) && !skip.has(p) && place(byId.get(p)))
    order.push(l)
  }
  let left = true
  while (left) {
    left = false
    for (const c of ['grammar', 'listening', 'grammar', 'reading']) {
      const next = queues[c].find((l) => !placed.has(l.id))
      if (next) { place(next); left = true }
    }
  }
  return order
}

const weight = (l) => (l.days >= 6 ? 2 : 1) // "Review … exercises" lessons count double

export function examInfo(profile, date = todayKey()) {
  const exam = profile.examDate
  const daysLeft = exam ? diffDays(date, exam) : null
  // Last 7 days before the exam are kept for full tests and review
  const studyEnd = exam ? addDays(exam, -7) : addDays(profile.startDate, 77)
  return { exam, daysLeft, studyEnd, target: profile.targetScore || 800, cefr: cefrFor(profile.targetScore || 800) }
}

// Today's lessons: split what is left evenly over the study days remaining
export function todayCurriculum(profile, done, date = todayKey()) {
  const { studyEnd, target } = examInfo(profile, date)
  const all = requiredLessons(target, profile.currentScore)
  const remaining = all.filter((l) => !done[l.id] || done[l.id] >= date)
  const studyDays = Math.max(1, diffDays(date, studyEnd) + 1)
  const remainingW = remaining.reduce((a, l) => a + weight(l), 0)
  const quota = Math.min(6, Math.max(1, Math.ceil(remainingW / studyDays)))
  const list = []; let w = 0
  for (const l of remaining) {
    if (w >= quota) break
    list.push(l); w += weight(l)
  }
  const doneCount = all.filter((l) => done[l.id]).length
  return { list, quota, total: all.length, doneCount, remaining: remaining.length, studyDays, perDay: remainingW / studyDays }
}

export const SOURCE = CURRI.source
export const ALL_LESSONS = CURRI.lessons
