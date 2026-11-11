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

// Lessons to learn for the target, in a sensible order:
// categories interleaved, easier first, prerequisites placed before the lesson that needs them.
export function requiredLessons(target) {
  const comps = new Set(requiredComps(target).map((c) => c.id))
  const core = CURRI.lessons.filter((l) => l.comps.some((c) => comps.has(c)))
  const queues = Object.fromEntries(CAT_ORDER.map((c) => [c, core.filter((l) => l.cat === c).sort((a, b) => a.diff - b.diff)]))
  const placed = new Set(); const order = []
  const place = (l) => {
    if (placed.has(l.id)) return
    placed.add(l.id)
    l.pre.forEach((p) => byId.get(p) && place(byId.get(p)))
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
  const all = requiredLessons(target)
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
