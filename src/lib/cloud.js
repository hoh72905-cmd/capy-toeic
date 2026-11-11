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
  F.updateDoc(ref, ...args).catch((e) => set({ status: 'error', message: syncMessage(e) }))
}

function queue(changes) {
  // keep only the latest value per field
  const byPath = new Map(pending.map((c) => [c[0].join('\u0001'), c]))
  for (const c of changes) byPath.set(c[0].join('\u0001'), c)
  pending = [...byPath.values()]
  if (!timer) timer = setTimeout(flush, 500)
}

// First sync after signing in: read the cloud copy, merge with this device, write back.
// Retried a few times so a bad moment (weak signal, app just opened) doesn't leave the account empty.
async function firstSync(user, myRef, attempt = 0) {
  const { F } = fb
  try {
    const snap = await F.getDoc(myRef)
    if (ref !== myRef) return // signed out meanwhile
    // Data left on this device by a different account must never be mixed into this one
    let last = null
    try { last = localStorage.getItem(UID_KEY) } catch { /* ignore */ }
    const otherAccount = last && last !== user.uid
    const local = otherAccount ? freshState() : getState()
    if (otherAccount) replaceFromCloud(local)
    try { localStorage.setItem(UID_KEY, user.uid) } catch { /* ignore */ }
    if (!snap.exists()) {
      await F.setDoc(myRef, { ...encode(local), email: user.email, createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp() })
    } else {
      // Keep what this device already had and what is in the cloud
      const merged = merge(local, decode(snap.data()))
      replaceFromCloud(merged)
      await F.setDoc(myRef, { ...encode(merged), email: user.email, updatedAt: F.serverTimestamp() })
    }
    return true
  } catch (e) {
    if (ref !== myRef) return
    const offline = navigator.onLine === false
    set({ status: offline ? 'offline' : 'error', message: offline ? '' : syncMessage(e) })
    if (attempt < 6) {
      await new Promise((r) => setTimeout(r, [2, 5, 10, 20, 30, 60][attempt] * 1000))
      if (ref === myRef) return firstSync(user, myRef, attempt + 1)
    }
  }
}

const SYNC_ERR = {
  'permission-denied': 'Máy chủ từ chối quyền truy cập dữ liệu — đăng xuất rồi đăng nhập lại nhé.',
  'unavailable': 'Chưa kết nối được máy chủ, app sẽ tự thử lại.',
  'failed-precondition': 'Trình duyệt đang mở app ở nhiều tab — đóng bớt tab rồi tải lại trang.',
}
const syncMessage = (e) => SYNC_ERR[e?.code] || `Đang thử lại… (${e?.code || e?.message || 'lỗi'})`

async function startSync(user) {
  const { db, F } = fb
  set({ status: 'connecting', email: user.email, message: '' })
  const myRef = F.doc(db, 'users', user.uid)
  ref = myRef
  const ok = await firstSync(user, myRef)
  if (!ok || ref !== myRef) { if (ref === myRef) ref = null; return } // next sign-in / app start tries again
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
  }, (e) => set({ status: 'error', message: syncMessage(e) }))
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
  'auth/user-disabled': 'Tài khoản này đã bị khóa.',
  'auth/missing-email': 'Bạn chưa nhập email.',
  'auth/internal-error': 'Máy chủ đăng nhập đang bận, thử lại sau ít phút.',
  'auth/popup-blocked': 'Trình duyệt chặn cửa sổ Google — cho phép cửa sổ bật lên rồi thử lại.',
  'load-failed': 'Không tải được phần đăng nhập. Kiểm tra mạng rồi tải lại trang.',
  'app-outdated': 'App trên máy là bản cũ, chưa có đăng nhập Google. Tải bản mới và cài đè (không cần gỡ app) — xem nút bên dưới.',
  'google-config': 'Google từ chối app này (cấu hình khóa ứng dụng). Hãy chụp màn hình gửi người làm app.',
  'google-no-account': 'Máy chưa có tài khoản Google nào. Vào Cài đặt điện thoại → Tài khoản → Thêm tài khoản Google, rồi thử lại.',
  'google-failed': 'Không đăng nhập Google được.',
}
// Closing the Google window is not an error worth showing
export const isCancel = (e) => ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(e?.code)
  || /cancel|12501/i.test(e?.message || '')
export const authMessage = (e) => {
  const base = AUTH_ERR[e?.code] || (e?.code ? `Có lỗi xảy ra (${e.code}), thử lại nhé.` : 'Có lỗi xảy ra, thử lại nhé.')
  // Show the technical detail too, so a screenshot is enough to find the cause
  const detail = e?.detail || (!AUTH_ERR[e?.code] && e?.message) || ''
  return detail && !base.includes(detail) ? `${base} (${String(detail).slice(0, 160)})` : base
}

// Loading Firebase can fail (offline, or the site was just updated): report it clearly
async function loadOrFail() {
  try { return await load() } catch (e) { throw Object.assign(new Error(e?.message || 'load failed'), { code: 'load-failed' }) }
}

export async function signIn(email, password, create = false) {
  const { auth, A } = await loadOrFail()
  const cred = create
    ? await A.createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    : await A.signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
  try { localStorage.setItem(FLAG, '1') } catch { /* ignore */ }
  started = true
  await listenAuth()
  return cred.user
}

// The Android app installed before Google sign-in existed has no native Google part
export const appNeedsUpdate = () => isNative && !Capacitor.isPluginAvailable('FirebaseAuthentication')
export const APK_URL = 'https://github.com/hoh72905-cmd/capy-toeic/releases/latest'

// Google does not allow its sign-in page inside an app's web view, so Android's own account picker is used.
// First the new picker (Credential Manager); if it fails, the classic Google account chooser.
async function nativeGoogleToken() {
  if (appNeedsUpdate()) throw Object.assign(new Error('app outdated'), { code: 'app-outdated' })
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
  const tryOnce = async (useCredentialManager) => {
    const r = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true, useCredentialManager })
    const t = r?.credential?.idToken
    if (!t) throw Object.assign(new Error('no token'), { code: 'auth/no-token' })
    return t
  }
  const t0 = Date.now()
  try {
    return await tryOnce(true)
  } catch (e) {
    // A real "closed by the user" takes a moment; a quick failure means the picker could not be shown
    if (isCancel(e) && Date.now() - t0 > 4000) throw e
    console.warn('Credential Manager failed, using the classic chooser:', e?.message)
    try {
      return await tryOnce(false)
    } catch (e2) {
      if (isCancel(e2) || /12501/.test(e2?.message || '')) throw e2
      throw Object.assign(new Error(e2?.message || e?.message || 'google failed'), { code: googleCode(e2), detail: e2?.message || e?.message })
    }
  }
}

// Classic Google Sign-In error numbers → readable codes
function googleCode(e) {
  const m = e?.message || ''
  if (/\b10\b|DEVELOPER_ERROR|28433|not set up correctly/i.test(m)) return 'google-config'
  if (/\b7\b|NETWORK|network/i.test(m)) return 'auth/network-request-failed'
  if (/No credential|no account|28436/i.test(m)) return 'google-no-account'
  return e?.code || 'google-failed'
}

// One tap: sign in with a Google account already on the phone / in the browser
export async function signInWithGoogle() {
  const { auth, A } = await loadOrFail()
  try { localStorage.setItem(FLAG, '1') } catch { /* ignore */ }
  started = true
  await listenAuth()
  try {
    if (isNative) {
      const idToken = await nativeGoogleToken()
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
  await A.sendPasswordResetEmail(auth, email.trim().toLowerCase())
}

// Push queued changes right away (e.g. when the app goes to the background)
export function flushNow() { if (timer) { clearTimeout(timer); flush() } }
