import { useSyncExternalStore } from 'react'
import { todayKey } from './date.js'

const KEY = 'capy-toeic-v1'

const initial = () => ({
  profile: { name: 'Quyên', startDate: todayKey(), examDate: null, targetScore: 800, currentScore: null, dailyNew: 15 },
  todos: {},
  activity: {},
  cards: {},
  topics: {},
  listenDone: {},
  saved: [],
  notes: [],
  customLessons: [],
  curri: {}, // Kaggle curriculum lessons done: { lessonId: date }
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial(), ...JSON.parse(raw) }
  } catch { /* storage blocked or corrupted: start fresh */ }
  return initial()
}

let state = load()
const listeners = new Set()

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

export function getState() { return state }

export function setState(updater) {
  const next = typeof updater === 'function' ? updater(state) : updater
  state = { ...state, ...next }
  save()
  listeners.forEach((l) => l())
}

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
  if (typeof parsed !== 'object' || !parsed.profile) throw new Error('File không hợp lệ')
  setState({ ...initial(), ...parsed })
}

export function resetAll() {
  state = initial(); save(); listeners.forEach((l) => l())
}
