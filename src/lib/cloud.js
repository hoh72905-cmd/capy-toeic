import { useSyncExternalStore } from 'react'
import { Capacitor } from '@capacitor/core'
import { getState, onLocalChange, replaceFromCloud, clearLocalData, freshState } from './store.js'
import { diff, encode, decode, merge, DELETE } from './syncCodec.js'

// Firebase project "toeic-28241". This web config is public by design;
// firestore.rules make sure each learner can only read and write their own document.
const CONFIG = {
  "apiKey": "AIzaSyAw4u57y03bB5HXUE885AiAKpUkpxc7xaA",
  "authDomain": "toeic-28241.firebaseapp.com",
  "projectId": "toeic-28241",
  "storageBucket": "toeic-28241.firebasestorage.app",
  "messagingSenderId": "778661498815",
  "appId": "1:778661498815:web:5ac4324ab7e91e61491b0a"
}

const isNative = Capacitor.isNativePlatform()
const FLAG = 'capy-cloud-on' // remembered so we only load Firebase for signed-in learners
const UID_KEY = 'capy-cloud-uid' // which account the data on this device belongs to

// ---- status for the UI ----
// status: off | connecting | synced | saving | offline | error
let cloud = { status: 'off', email: null, lastSync: null, message: '', remoteAt: 0 }
const subs = new Set()
function set(patch) { cloud = { ...cloud, ...patch }; subs.forEach((f) => f()) }
export function useCloud() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb) }, () => cloud)
}

// ---- Firebase (loaded only when needed) ----
let fb = null
async function load() {
  if (fb) return fb
  const [{ initializeApp }, A, F] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
  const app = initializeApp(CONFIG)
  // Browsers get the Google popup helper; the Android app signs in to Google natively instead
  const auth = A.initializeAuth(app, {
    persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence],
    ...(isNative ? {} : { popupRedirectResolver: A.browserPopupRedirectResolver }),
  })
  let db
  try {
    db = F.initializeFirestore(app, { ignoreUndefinedProperties: true, localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) })
  } catch {
    db = F.initializeFirestore(app, { ignoreUndefinedProperties: true })
  }
  fb = { auth, db, A, F }
  return fb
}

// ---- sync ----
let unsubDoc = null
let unsubLocal = null
let pending = [] // queued field updates
let timer = null
let ref = null

function flush() {
  timer = null
  if (!ref || !pending.length) return
  const { F } = fb
  const batch = pending
  pending = []
  const args = []
  for (const [path, value] of batch) args.push(new F.FieldPath(...path), value === DELETE ? F.deleteField() : value)
  args.push('updatedAt', F.serverTimestamp())
  set({ status: navigator.onLine === false ? 'offline' : 'saving' })
  F.updateDoc(ref, ...args).catch((e) => set({ status: 'error', message: e.code || e.message }))
}

function queue(changes) {
  // keep only the latest value per field
  const byPath = new Map(pending.map((c) => [c[0].join('\u0001'), c]))
  for (const c of changes) byPath.set(c[0].join('\u0001'), c)
  pending = [...byPath.values()]
  if (!timer) timer = setTimeout(flush, 500)
}

async function startSync(user) {
  const { db, F } = fb
  set({ status: 'connecting', email: user.email, message: '' })
  ref = F.doc(db, 'users', user.uid)
  try {
    const snap = await F.getDoc(ref)
    // Data left on this device by a different account must never be mixed into this one
    let last = null
    try { last = localStorage.getItem(UID_KEY) } catch { /* ignore */ }
    const otherAccount = last && last !== user.uid
    const local = otherAccount ? freshState() : getState()
    if (otherAccount) replaceFromCloud(local)
    try { localStorage.setItem(UID_KEY, user.uid) } catch { /* ignore */ }
    if (!snap.exists()) {
      await F.setDoc(ref, { ...encode(local), email: user.email, createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp() })
    } else {
      // Keep what this device already had and what is in the cloud
      const merged = merge(local, decode(snap.data()))
      replaceFromCloud(merged)
      await F.setDoc(ref, { ...encode(merged), email: user.email, updatedAt: F.serverTimestamp() })
    }
  } catch (e) {
    set({ status: 'error', message: e.code || e.message })
  }
  // Live updates from the other devices
  unsubDoc = F.onSnapshot(ref, { includeMetadataChanges: true }, (snap) => {
    if (!snap.exists()) return
    if (snap.metadata.hasPendingWrites) { set({ status: 'saving' }); return }
    if (pending.length) { flushNow(); return } // our own edits go first; the next snapshot has both
    if (!snap.metadata.fromCache) {
      const remote = decode(snap.data())
      const mine = getState()
      // Only redraw when something really changed elsewhere
      if (JSON.stringify(encode({ ...mine, ...remote })) !== JSON.stringify(encode(mine))) {
        replaceFromCloud({ ...mine, ...remote })
        set({ remoteAt: Date.now() })
      }
      set({ status: 'synced', lastSync: Date.now(), message: '' })
    } else if (navigator.onLine === false) set({ status: 'offline' })
  }, (e) => set({ status: 'error', message: e.code || e.message }))
  unsubLocal = onLocalChange((prev, next) => {
    const changes = diff(prev, next)
    if (changes.length) queue(changes)
  })
}

function stopSync() {
  if (timer) { clearTimeout(timer); flush() }
  unsubDoc?.(); unsubLocal?.()
  unsubDoc = unsubLocal = ref = null
}

let listening = false
async function listenAuth() {
  const { auth, A } = await load()
  if (listening) return
  listening = true
  A.onAuthStateChanged(auth, (user) => {
    if (user) { if (!ref) startSync(user) } else { stopSync(); set({ status: 'off', email: null }) }
  })
}

// Called once at app start: reconnect if this device was signed in before
let started = false
export async function initCloud() {
  if (started) return
  started = true
  let on = false
  try { on = localStorage.getItem(FLAG) === '1' } catch { /* ignore */ }
  if (!on) return
  set({ status: 'connecting' })
  try {
    await listenAuth()
  } catch {
    set({ status: 'offline', message: 'Chưa tải được phần đồng bộ (đang offline?)' })
    started = false
  }
}

const AUTH_ERR = {
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/missing-password': 'Bạn chưa nhập mật khẩu.',
  'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
  'auth/email-already-in-use': 'Email này đã có tài khoản — chọn “Đăng nhập”.',
  'auth/invalid-credential': 'Sai email hoặc mật khẩu.',
  'auth/wrong-password': 'Sai mật khẩu.',
  'auth/user-not-found': 'Chưa có tài khoản với email này — chọn “Tạo tài khoản”.',
  'auth/too-many-requests': 'Thử quá nhiều lần, đợi vài phút rồi thử lại.',
  'auth/network-request-failed': 'Không có mạng. Kết nối mạng rồi thử lại.',
  'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật trên Firebase.',
  'auth/unauthorized-domain': 'Trang này chưa được phép đăng nhập Google. Hãy mở capy-toeic.vercel.app.',
  'auth/account-exists-with-different-credential': 'Email này đã đăng ký bằng mật khẩu — đăng nhập bằng email + mật khẩu nhé.',
  'auth/no-token': 'Không lấy được tài khoản Google trên máy. Thử lại hoặc dùng email.',
}
// Closing the Google window is not an error worth showing
export const isCancel = (e) => ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(e?.code)
  || /cancel/i.test(e?.message || '')
export const authMessage = (e) => AUTH_ERR[e?.code] || (e?.code ? `Có lỗi xảy ra (${e.code}), thử lại nhé.` : 'Có lỗi xảy ra, thử lại nhé.')

export async function signIn(email, password, create = false) {
  const { auth, A } = await load()
  const cred = create
    ? await A.createUserWithEmailAndPassword(auth, email.trim(), password)
    : await A.signInWithEmailAndPassword(auth, email.trim(), password)
  try { localStorage.setItem(FLAG, '1') } catch { /* ignore */ }
  started = true
  await listenAuth()
  return cred.user
}

// One tap: sign in with a Google account already on the phone / in the browser
export async function signInWithGoogle() {
  const { auth, A } = await load()
  try { localStorage.setItem(FLAG, '1') } catch { /* ignore */ }
  started = true
  await listenAuth()
  try {
    if (isNative) {
      // Google does not allow its sign-in page inside an app's web view: use Android's account picker
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
      const r = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true })
      const idToken = r?.credential?.idToken
      if (!idToken) throw Object.assign(new Error('no token'), { code: 'auth/no-token' })
      return (await A.signInWithCredential(auth, A.GoogleAuthProvider.credential(idToken))).user
    }
    const provider = new A.GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      return (await A.signInWithPopup(auth, provider)).user
    } catch (e) {
      // Popups blocked (some phones / in-app browsers): go through a full-page redirect instead
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/web-storage-unsupported'].includes(e.code)) {
        await A.signInWithRedirect(auth, provider)
        return null
      }
      throw e
    }
  } catch (e) {
    if (!auth.currentUser) { try { localStorage.removeItem(FLAG) } catch { /* ignore */ } }
    throw e
  }
}

export async function signOutCloud() {
  const { auth, A, F, db } = await load()
  stopSync() // also sends any change not saved yet
  try { await F.waitForPendingWrites(db) } catch { /* offline: Firestore keeps them and retries */ }
  try { localStorage.removeItem(FLAG) } catch { /* ignore */ }
  await A.signOut(auth)
  if (isNative) {
    try { (await import('@capacitor-firebase/authentication')).FirebaseAuthentication.signOut() } catch { /* ignore */ }
  }
  // The next person using this device starts clean; this account's data stays in the cloud
  clearLocalData()
  try { localStorage.removeItem(UID_KEY) } catch { /* ignore */ }
  set({ status: 'off', email: null, lastSync: null })
}

export async function resetPassword(email) {
  const { auth, A } = await load()
  await A.sendPasswordResetEmail(auth, email.trim())
}

// Push queued changes right away (e.g. when the app goes to the background)
export function flushNow() { if (timer) { clearTimeout(timer); flush() } }
