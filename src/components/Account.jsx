import { useEffect, useState } from 'react'
import Title from './Title.jsx'
import Mascot from './Mascot.jsx'
import { useCloud, signIn, signOutCloud, resetPassword, authMessage } from '../lib/cloud.js'

const STATUS = {
  off: { icon: '☁️', text: 'Chưa đồng bộ', cls: 'off' },
  connecting: { icon: '🔄', text: 'Đang kết nối…', cls: 'busy' },
  saving: { icon: '🔄', text: 'Đang lưu lên mây…', cls: 'busy' },
  synced: { icon: '✅', text: 'Đã đồng bộ', cls: 'ok' },
  offline: { icon: '📴', text: 'Offline — sẽ tự đồng bộ khi có mạng', cls: 'warn' },
  error: { icon: '⚠️', text: 'Lỗi đồng bộ', cls: 'bad' },
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
          <div className="seg">
            <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Đăng nhập</button>
            <button className={mode === 'create' ? 'on' : ''} onClick={() => setMode('create')}>Tạo tài khoản</button>
          </div>
          <form className="form" onSubmit={submit}>
            <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Mật khẩu{mode === 'create' && ' (ít nhất 6 ký tự)'}<input type="password" autoComplete={mode === 'create' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} /></label>
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
