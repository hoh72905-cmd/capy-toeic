import { useEffect, useState } from 'react'
import Title from './Title.jsx'
import Mascot from './Mascot.jsx'
import { useCloud, signIn, signInWithGoogle, signOutCloud, resetPassword, authMessage, isCancel, appNeedsUpdate, APK_URL } from '../lib/cloud.js'

const STATUS = {
  off: { icon: '☁️', text: 'Chưa đồng bộ', cls: 'off' },
  connecting: { icon: '🔄', text: 'Đang kết nối…', cls: 'busy' },
  saving: { icon: '🔄', text: 'Đang lưu lên mây…', cls: 'busy' },
  synced: { icon: '✅', text: 'Đã đồng bộ', cls: 'ok' },
  offline: { icon: '📴', text: 'Offline — sẽ tự đồng bộ khi có mạng', cls: 'warn' },
  error: { icon: '⚠️', text: 'Lỗi đồng bộ', cls: 'bad' },
}

const GLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)

// "Continue with Google": one tap, then the data syncs
export function GoogleButton({ small, onError }) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    try { await signInWithGoogle() } catch (e) { if (!isCancel(e)) onError?.(authMessage(e)) }
    setBusy(false)
  }
  if (appNeedsUpdate()) {
    // Old Android app: Google sign-in needs the new APK (install over the old one, data is kept)
    return (
      <div className="update-box">
        <p className="small"><b>📲 Cập nhật app để đăng nhập bằng Google.</b> Tải bản mới rồi cài đè lên app này — không cần gỡ, dữ liệu giữ nguyên.</p>
        <a className={`btn google-btn ${small ? 'sm' : ''}`} href={APK_URL} target="_blank" rel="noreferrer">⬇️ Tải app bản mới</a>
      </div>
    )
  }
  return (
    <button type="button" className={`btn google-btn ${small ? 'sm' : ''}`} onClick={go} disabled={busy}>
      <GLogo /> {busy ? 'Đang mở Google…' : 'Đăng nhập bằng Google'}
    </button>
  )
}

// Small status pill for the header / sidebar
export function SyncChip({ onClick }) {
  const c = useCloud()
  const s = STATUS[c.status] || STATUS.off
  return (
    <button className={`sync-chip ${s.cls}`} onClick={onClick} title={s.text}>
      <span className={c.status === 'connecting' || c.status === 'saving' ? 'spin' : ''}>{s.icon}</span>
      <span className="sync-text">{c.status === 'off' ? 'Đồng bộ' : s.text.split(' —')[0]}</span>
    </button>
  )
}

// Pops up for a few seconds when another device changed the data
export function RemoteToast() {
  const { remoteAt } = useCloud()
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!remoteAt) return
    setShow(true)
    const t = setTimeout(() => setShow(false), 3500)
    return () => clearTimeout(t)
  }, [remoteAt])
  return show ? <div className="remote-toast">☁️ Vừa cập nhật dữ liệu từ thiết bị khác</div> : null
}

export default function Account() {
  const c = useCloud()
  const [mode, setMode] = useState('login') // login | create
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [showPw, setShowPw] = useState(false)
  const s = STATUS[c.status] || STATUS.off
  const signedIn = !!c.email

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setMsg('')
    try { await signIn(email, pw, mode === 'create'); setPw('') } catch (err) { setMsg(authMessage(err)) }
    setBusy(false)
  }
  const forgot = async () => {
    if (!email.trim()) { setMsg('Nhập email trước rồi bấm “Quên mật khẩu”.'); return }
    try { await resetPassword(email); setMsg('📧 Đã gửi email đặt lại mật khẩu (xem cả thư mục Spam).') } catch (err) { setMsg(authMessage(err)) }
  }

  return (
    <div className="card tint-blue account">
      <Title icon="☁️">Tài khoản & đồng bộ</Title>
      {signedIn ? (
        <>
          <div className={`sync-status ${s.cls}`}>
            <span className={c.status === 'connecting' || c.status === 'saving' ? 'spin' : ''}>{s.icon}</span>
            <div>
              <b>{s.text}</b>
              <div className="small muted">Đăng nhập: {c.email}{c.lastSync ? ` · lần đồng bộ gần nhất ${new Date(c.lastSync).toLocaleTimeString('vi-VN')}` : ''}</div>
              {c.status === 'error' && c.message && <div className="small txt-pink">{c.message}</div>}
            </div>
          </div>
          <p className="small muted">Web và app dùng chung tài khoản này: học hay thêm việc ở bên nào, bên kia sẽ hiện lên sau vài giây. Mất mạng vẫn học bình thường, có mạng lại sẽ tự đồng bộ.</p>
          <button className="btn" onClick={() => {
            if (confirm('Đăng xuất? Dữ liệu của tài khoản này vẫn an toàn trên mây; dữ liệu trên máy này sẽ được dọn để người khác dùng máy không thấy. Đăng nhập lại là dữ liệu tự về.')) signOutCloud()
          }}>Đăng xuất</button>
        </>
      ) : (
        <>
          <div className="row gap-s account-intro">
            <Mascot size={60} mood="happy" />
            <p className="small">Đăng nhập <b>cùng một tài khoản</b> trên web và app để dữ liệu tự đồng bộ giữa các thiết bị. Dữ liệu đang có trên máy này sẽ được giữ và gộp vào tài khoản.</p>
          </div>
          <GoogleButton onError={setMsg} />
          <div className="or"><span>hoặc dùng email</span></div>
          <div className="seg">
            <button className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setMsg('') }}>Đăng nhập</button>
            <button className={mode === 'create' ? 'on' : ''} onClick={() => { setMode('create'); setMsg('') }}>Tạo tài khoản</button>
          </div>
          <form className="form" onSubmit={submit}>
            <label>Email<input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Mật khẩu{mode === 'create' && ' (ít nhất 6 ký tự)'}
              <span className="pw-field">
                <input type={showPw ? 'text' : 'password'} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
                <button type="button" className="pw-eye" onClick={() => setShowPw((v) => !v)} title={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPw ? '🙈' : '👁️'}</button>
              </span>
            </label>
            <div className="row between wrap">
              <button type="submit" className="btn yellow" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'create' ? 'Tạo tài khoản & đồng bộ' : 'Đăng nhập & đồng bộ'}</button>
              {mode === 'login' && <button type="button" className="link small" onClick={forgot}>Quên mật khẩu?</button>}
            </div>
          </form>
        </>
      )}
      {msg && <p className="small account-msg">{msg}</p>}
    </div>
  )
}
