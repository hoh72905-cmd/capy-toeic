import { useSyncExternalStore } from 'react'
import { todayKey } from './date.js'
import { dailyPlan } from './course.js'

const KEY = 'capy-toeic-v1'
const BACKUP_KEY = 'capy-toeic-backup' // copy of the last good data, refreshed once a day
const BROKEN_KEY = 'capy-toeic-broken' // unreadable data is kept here instead of being overwritten

const initial = () => ({
  profile: { name: 'Quyên', startDate: todayKey(), examDate: null, targetScore: 800, currentScore: null, dailyNew: 15, autoNew: true, goals: [] }, // goals: learner's own daily goals [{ id, text, ts }]
  todos: {},
  activity: {},
  cards: {},
  topics: {},
  listenDone: {},
  listenProgress: {}, // unfinished dictation lessons: { lessonId: { idx, scores, mode, elapsed } }
  sessionProgress: null, // today's guided session: { date, step }
  saved: [],
  notes: [],
  customLessons: [],
  curri: {}, // Kaggle curriculum lessons done: { lessonId: date }
  reminders: [], // personal reminders: exams, deadlines, notes
  goalLog: {}, // own daily goals ticked off: { day: [goalId] }
  qDone: {}, // Part 5 questions answered: { questionId: { d: first date, ok: last answer right } }
  reading: {}, // Part 6/7 texts done: { id: { score, best, date } }
  shadow: {}, // shadowing lessons done: { lessonId: date }
  convo: { start: 0, xp: 0, placed: null, daily: 7, recent: [] }, // conversation level (stage), XP, placement date
  convoItems: {}, // conversation sentences / phrases studied: spaced repetition state
  convoDays: {}, // conversation day log: { date: { plan, n, ok, xp, done } }
  toeicDay: null, // last date the TOEIC tasks were added to the to-do list
  savedAt: null,
})

// Fill in fields added in newer versions without touching what the learner already has
function upgrade(data) {
  const base = initial()
  return { ...base, ...data, profile: { ...base.profile, ...(data.profile || {}) }, convo: { ...base.convo, ...(data.convo || {}) } }
}

function read(key) {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    return data && typeof data === 'object' && data.profile ? data : null
  } catch {
    return undefined // present but unreadable
  }
}

function load() {
  try {
    const main = read(KEY)
    if (main) return upgrade(main)
    if (main === undefined) localStorage.setItem(BROKEN_KEY, localStorage.getItem(KEY))
    const backup = read(BACKUP_KEY)
    if (backup) return upgrade(backup)
  } catch { /* storage blocked (private mode): run in memory */ }
  return initial()
}

let state = load()
const listeners = new Set()
export const storage = { ok: true, lastError: '' }

function save() {
  try {
    state.savedAt = Date.now()
    const json = JSON.stringify(state)
    localStorage.setItem(KEY, json)
    const b = read(BACKUP_KEY)
    if (!b || !b.savedAt || new Date(b.savedAt).toDateString() !== new Date().toDateString()) localStorage.setItem(BACKUP_KEY, json)
    storage.ok = true
  } catch (e) {
    storage.ok = false
    storage.lastError = e?.name || 'error'
  }
}

// Ask the browser not to clear this site's data when space runs low (Chrome, Firefox, Safari)
export async function askPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist()
    return !!(await navigator.storage?.persisted?.())
  } catch { return false }
}

// Keep tabs in sync: data changed in another tab of the same browser
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return
    try { state = upgrade(JSON.parse(e.newValue)); listeners.forEach((l) => l()) } catch { /* ignore */ }
  })
}

export function getState() { return state }

// Other modules (cloud sync) can watch every local change
const changeHooks = new Set()
export function onLocalChange(fn) { changeHooks.add(fn); return () => changeHooks.delete(fn) }

export function setState(updater) {
  const prev = state
  const next = typeof updater === 'function' ? updater(state) : updater
  state = { ...state, ...next }
  save()
  listeners.forEach((l) => l())
  changeHooks.forEach((fn) => fn(prev, state))
}

// Replace everything with data that came from the cloud (does not echo back to the cloud)
export function replaceFromCloud(data) {
  state = upgrade({ ...data, savedAt: state.savedAt })
  save()
  listeners.forEach((l) => l())
}
export { upgrade }

// After signing out: wipe this device's copy (the data stays in the cloud account)
export function clearLocalData() {
  state = initial()
  try { localStorage.removeItem(BACKUP_KEY); localStorage.removeItem(BROKEN_KEY) } catch { /* ignore */ }
  save()
  listeners.forEach((l) => l())
}
export const freshState = initial

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => selector(state),
  )
}

// Record study activity for today (used for streak + week progress)
export function logActivity(kind, amount = 1, minutes = 0) {
  const k = todayKey()
  setState((s) => {
    const day = { minutes: 0, flash: 0, listen: 0, quiz: 0, vocab: 0, ...(s.activity[k] || {}) }
    day[kind] = (day[kind] || 0) + amount
    day.minutes += minutes
    return { activity: { ...s.activity, [k]: day } }
  })
  markTodoKind(kind)
}

// Tick the first unfinished auto task of this kind in today's to-do list
export function markTodoKind(kind) {
  const k = todayKey()
  setState((s) => {
    const list = s.todos[k] || []
    const idx = list.findIndex((t) => t.kind === kind && !t.done)
    if (idx < 0) return {}
    // Tasks with an amount (e.g. 20 Part 5 questions) tick only when the amount is reached
    const t = list[idx]
    if (t.goalKey) {
      const done = t.goalKey === 'part5' ? (s.activity[k]?.quiz || 0) : dailyPlan(s, k)[t.goalKey]?.doneToday || 0
      if (done < (t.goal || 1)) return {}
    }
    const copy = list.slice()
    copy[idx] = { ...copy[idx], done: true }
    return { todos: { ...s.todos, [k]: copy } }
  })
}

export function exportData() {
  return JSON.stringify(state, null, 2)
}

export function importData(text) {
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object' || !parsed.profile) throw new Error('File không hợp lệ')
  const prev = state
  state = upgrade(parsed)
  save()
  listeners.forEach((l) => l())
  changeHooks.forEach((fn) => fn(prev, state))
}

export function resetAll() {
  const prev = state
  state = initial(); save(); listeners.forEach((l) => l())
  changeHooks.forEach((fn) => fn(prev, state))
}
