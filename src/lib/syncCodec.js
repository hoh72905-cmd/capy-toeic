// How study data is stored in the cloud document users/{uid}, and how two copies are merged.
// Each top-level part is split into small fields, so two devices editing different things
// (e.g. to-dos of different days, different notes) never overwrite each other.

export const MAPS = ['activity', 'cards', 'topics', 'listenDone', 'listenProgress', 'curri', 'goalLog', 'qDone', 'reading', 'shadow'] // key → value
export const LISTS = ['saved', 'notes', 'customLessons', 'reminders'] // arrays of { id, … }
export const SCALARS = ['profile', 'toeicDay', 'sessionProgress'] // stored whole

const j = (v) => JSON.stringify(v ?? null)
const p = (s) => { try { return JSON.parse(s) } catch { return null } }

// Lists are kept in a fixed order so every device shows them the same way
const ORDER = {
  notes: (a, b) => (b.ts || 0) - (a.ts || 0), // newest first
  saved: (a, b) => (b.ts || 0) - (a.ts || 0) || String(b.date || '').localeCompare(String(a.date || '')),
  customLessons: (a, b) => (a.ts || 0) - (b.ts || 0) || String(a.id).localeCompare(String(b.id)),
  reminders: (a, b) => String(a.id).localeCompare(String(b.id)),
}
export const sortList = (k, list) => [...list].sort(ORDER[k])

// To-dos are synced one item at a time: todos.<day>.<id>, so two devices
// adding tasks to the same day (even offline) both keep their tasks
const todoOrder = (a, b) => (a.ts ?? a._o ?? 0) - (b.ts ?? b._o ?? 0) || String(a.id).localeCompare(String(b.id))
function encodeDay(list = []) {
  return Object.fromEntries(list.map((t, i) => [String(t.id), j({ ...t, _o: i })]))
}
function decodeDay(v) {
  if (typeof v === 'string') return p(v) || [] // older format: whole list
  return Object.values(v || {}).map(p).filter(Boolean).sort(todoOrder).map(({ _o, ...t }) => t)
}

// Field updates for what changed between two local states: [[path array, value | DELETE], …]
export const DELETE = Symbol('delete')
export function diff(prev, next) {
  const out = []
  for (const k of MAPS) {
    if (prev[k] === next[k]) continue
    const a = prev[k] || {}, b = next[k] || {}
    for (const sub of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[sub] === b[sub]) continue
      out.push([[k, sub], sub in b ? j(b[sub]) : DELETE])
    }
  }
  if (prev.todos !== next.todos) {
    const a = prev.todos || {}, b = next.todos || {}
    for (const day of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[day] === b[day]) continue
      if (!(day in b)) { out.push([['todos', day], DELETE]); continue }
      const before = new Map((a[day] || []).map((t) => [t.id, t]))
      const after = b[day] || []
      if (!a[day]) { out.push([['todos', day], encodeDay(after)]); continue }
      after.forEach((t, i) => { if (before.get(t.id) !== t) out.push([['todos', day, String(t.id)], j({ ...t, _o: i })]) })
      for (const id of before.keys()) if (!after.some((t) => t.id === id)) out.push([['todos', day, String(id)], DELETE])
    }
  }
  for (const k of LISTS) {
    if (prev[k] === next[k]) continue
    const a = new Map((prev[k] || []).map((x) => [x.id, x]))
    const b = new Map((next[k] || []).map((x) => [x.id, x]))
    for (const id of new Set([...a.keys(), ...b.keys()])) {
      if (!b.has(id)) { out.push([[k, String(id)], DELETE]); continue }
      if (a.get(id) === b.get(id)) continue // same object: unchanged
      out.push([[k, String(id)], j(b.get(id))])
    }
  }
  for (const k of SCALARS) {
    if (prev[k] !== next[k] && j(prev[k]) !== j(next[k])) out.push([[k], j(next[k])])
  }
  return out
}

// Whole local state → cloud document
export function encode(state) {
  const doc = { v: 2 }
  doc.todos = Object.fromEntries(Object.entries(state.todos || {}).map(([d, l]) => [d, encodeDay(l)]))
  for (const k of MAPS) doc[k] = Object.fromEntries(Object.entries(state[k] || {}).map(([s, v]) => [s, j(v)]))
  for (const k of LISTS) doc[k] = Object.fromEntries((state[k] || []).map((x) => [String(x.id), j(x)]))
  for (const k of SCALARS) doc[k] = j(state[k])
  return doc
}

// Cloud document → local state shape
export function decode(doc) {
  const s = {}
  s.todos = Object.fromEntries(Object.entries(doc.todos || {}).map(([d, v]) => [d, decodeDay(v)]))
  for (const k of MAPS) s[k] = Object.fromEntries(Object.entries(doc[k] || {}).map(([sub, v]) => [sub, p(v)]).filter(([, v]) => v !== null))
  for (const k of LISTS) {
    s[k] = sortList(k, Object.values(doc[k] || {}).map(p).filter(Boolean).map(({ _o, ...x }) => x))
  }
  for (const k of SCALARS) { const v = p(doc[k]); if (v !== null || k !== 'profile') s[k] = v }
  return s
}

// First sign-in on a device that already has data: keep everything from both sides
export function merge(local, cloud) {
  const out = { ...local, ...cloud }
  const unionList = (a = [], b = []) => {
    const m = new Map(a.map((x) => [x.id, x]))
    b.forEach((x) => m.set(x.id, x))
    return [...m.values()]
  }
  out.todos = { ...local.todos }
  for (const [day, list] of Object.entries(cloud.todos || {})) out.todos[day] = unionList(local.todos?.[day], list).sort(todoOrder)
  out.activity = { ...local.activity }
  for (const [day, a] of Object.entries(cloud.activity || {})) {
    const l = local.activity?.[day] || {}
    out.activity[day] = Object.fromEntries([...new Set([...Object.keys(l), ...Object.keys(a)])].map((f) => [f, Math.max(l[f] || 0, a[f] || 0)]))
  }
  const pick = (k, better) => {
    out[k] = { ...local[k] }
    for (const [id, v] of Object.entries(cloud[k] || {})) out[k][id] = out[k][id] && better(out[k][id], v) ? out[k][id] : v
  }
  pick('cards', (l, c) => (l.seen || 0) > (c.seen || 0))
  pick('topics', (l, c) => (l.attempts || 0) > (c.attempts || 0))
  pick('listenDone', (l, c) => (l.best || 0) > (c.best || 0))
  pick('listenProgress', (l, c) => (l.idx || 0) > (c.idx || 0))
  out.curri = { ...local.curri, ...cloud.curri }
  out.shadow = { ...local.shadow, ...cloud.shadow }
  out.qDone = { ...local.qDone, ...cloud.qDone }
  pick('reading', (l, c) => (l.best || 0) > (c.best || 0))
  out.goalLog = { ...local.goalLog }
  for (const [day, ids] of Object.entries(cloud.goalLog || {})) out.goalLog[day] = [...new Set([...(local.goalLog?.[day] || []), ...ids])]
  for (const k of LISTS) out[k] = sortList(k, unionList(local[k], cloud[k]))
  out.profile = { ...local.profile, ...cloud.profile }
  if (!cloud.profile?.goals?.length && local.profile?.goals?.length) out.profile.goals = local.profile.goals
  if (!cloud.profile?.examDate && local.profile?.examDate) out.profile.examDate = local.profile.examDate
  return out
}
