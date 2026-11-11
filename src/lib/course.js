// The course: every word, Part 5 question, Part 6/7 text, dictation and shadowing lesson is given ONCE,
// spread evenly from the start date to one week before the exam (that last week is for full tests).
// Short time or a high target → more per day. A high current score → the easiest content is skipped.
// Spaced review (flashcards, weak grammar topics) comes on top and is not counted as new content.
import { todayKey, addDays, diffDays } from './date.js'
import { ALL_QUESTIONS } from '../data/quiz.js'
import { ALL_CARDS } from '../data/vocab.js'
import { LESSONS } from '../data/listening.js'
import { PART6 } from '../data/reading6.js'
import { PART7 } from '../data/reading7.js'

// Study window: start date → exam − 7 days (or 12 weeks when no exam date is set)
export function courseWindow(profile, date = todayKey()) {
  const start = profile.startDate && profile.startDate <= date ? profile.startDate : date
  let end = profile.examDate ? addDays(profile.examDate, -7) : addDays(start, 77)
  if (end < date) end = profile.examDate && profile.examDate > date ? addDays(profile.examDate, -1) : date
  const total = Math.max(1, diffDays(start, end) + 1)
  const elapsed = Math.min(total - 1, Math.max(0, diffDays(start, date)))
  return { start, end, total, elapsed, daysLeft: Math.max(1, diffDays(date, end) + 1) }
}

// Which difficulty levels this learner needs
export function levelRange(profile) {
  const target = profile.targetScore || 800
  const current = profile.currentScore || 0
  return { min: current >= 700 ? 2 : 1, max: target < 600 ? 2 : 3 }
}
const inRange = (lv, r) => (lv || 1) >= r.min && (lv || 1) <= r.max

// Minimum new items per day, by target (higher target → more)
function minimums(profile) {
  const t = profile.targetScore || 800
  const step = t >= 900 ? 3 : t >= 800 ? 2 : t >= 650 ? 1 : 0
  return { words: [10, 15, 20, 25][step], part5: [10, 15, 20, 25][step], listen: [0, 1, 1, 1][step] }
}

// Today's amount for one content pool: keep up with an even pace, catch up gently when behind
function quota(total, doneBefore, win, min = 0) {
  if (total <= doneBefore) return 0
  const rate = total / win.total
  const expected = Math.ceil(rate * (win.elapsed + 1))
  const behind = expected - doneBefore
  const cap = Math.max(1, Math.ceil(rate * 2)) // at most twice the normal pace in one day
  return Math.min(total - doneBefore, Math.max(min, Math.min(behind, cap)))
}

// The content pools for this learner, in study order
export function pools(profile) {
  const r = levelRange(profile)
  const byLevel = (a, b) => (a.level || 1) - (b.level || 1)
  return {
    words: ALL_CARDS,
    part5: ALL_QUESTIONS.filter((q) => inRange(q.lv, r)).sort((a, b) => a.lv - b.lv),
    part6: PART6.filter((p) => inRange(p.level, r)).sort(byLevel),
    part7: PART7.filter((p) => inRange(p.level, r)).sort(byLevel),
    listen: LESSONS.filter((l) => inRange(l.level, r)),
    shadow: [...LESSONS.filter((l) => !l.tatoeba), ...LESSONS.filter((l) => l.tatoeba)].filter((l) => inRange(l.level, r)),
  }
}

// What is done (before today / today) for each pool
function progress(state, p, date) {
  const before = (d) => d && d < date
  const today = (d) => d === date
  const count = (list, getDate) => {
    let b = 0, t = 0
    for (const x of list) { const d = getDate(x); if (before(d)) b++; else if (today(d)) t++ }
    return { before: b, today: t }
  }
  return {
    words: count(p.words, (c) => state.cards[c.id]?.added),
    part5: count(p.part5, (q) => state.qDone?.[q.id]?.d),
    part6: count(p.part6, (x) => state.reading?.[x.id]?.date),
    part7: count(p.part7, (x) => state.reading?.[x.id]?.date),
    listen: count(p.listen, (l) => state.listenDone?.[l.id]?.first || state.listenDone?.[l.id]?.date),
    shadow: count(p.shadow, (l) => state.shadow?.[l.id]),
  }
}

/**
 * Today's plan: { key: { goal, done, total, finished } } for words, part5, part6, part7, listen, shadow
 * plus the study window and an estimate of minutes.
 */
export function dailyPlan(state, date = todayKey()) {
  const profile = state.profile
  const win = courseWindow(profile, date)
  const p = pools(profile)
  const pr = progress(state, p, date)
  const min = minimums(profile)
  const out = { win, levels: levelRange(profile) }
  for (const k of Object.keys(p)) {
    const total = p[k].length
    let goal = quota(total, pr[k].before, win, min[k] || 0)
    if (k === 'words') goal = profile.autoNew === false ? Math.min(total - pr[k].before, profile.dailyNew || 15) : Math.min(goal, 60)
    if (k === 'part5') goal = Math.min(goal, 50)
    out[k] = { goal, done: Math.min(pr[k].today, goal || pr[k].today), doneToday: pr[k].today, total, learned: pr[k].before + pr[k].today }
  }
  // Part 5 keeps going as review once every question has been seen
  if (!out.part5.goal && out.part5.learned >= out.part5.total) out.part5.review = min.part5
  out.minutes = Math.round(out.words.goal * 0.5 + (out.part5.goal || out.part5.review || 0) * 0.8 + out.part6.goal * 8 + out.part7.goal * 10 + out.listen.goal * 6 + out.shadow.goal * 8)
  return out
}

// The next items to study today in a pool (not done before today), up to today's goal
export function nextItems(state, key, date = todayKey()) {
  const plan = dailyPlan(state, date)
  const list = pools(state.profile)[key]
  const doneDate = {
    part6: (x) => state.reading?.[x.id]?.date, part7: (x) => state.reading?.[x.id]?.date,
    listen: (l) => state.listenDone?.[l.id]?.first || state.listenDone?.[l.id]?.date, shadow: (l) => state.shadow?.[l.id],
  }[key]
  const open = list.filter((x) => { const d = doneDate(x); return !d || d >= date })
  return open.slice(0, Math.max(plan[key].goal, plan[key].doneToday))
}
