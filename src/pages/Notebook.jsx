import { useRef, useState } from 'react'
import { useStore, setState, exportData, importData, resetAll } from '../lib/store.js'
import { uid, todayKey } from '../lib/date.js'
import Speak from '../components/Speak.jsx'

export default function Notebook({ params }) {
  const [tab, setTab] = useState(params?.tab || 'notes')
  return (
    <div className="page">
      <div className="page-head">
        <h1>📒 Sổ tay</h1>
        <div className="seg">
          <button className={tab === 'notes' ? 'on' : ''} onClick={() => setTab('notes')}>📝 Ghi chú</button>
          <button className={tab === 'words' ? 'on' : ''} onClick={() => setTab('words')}>⭐ Từ đã lưu</button>
          <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>⚙️ Cài đặt</button>
        </div>
      </div>
      {tab === 'notes' && <Notes />}
      {tab === 'words' && <Words />}
      {tab === 'settings' && <Settings />}
    </div>
  )
}

function Notes() {
  const { notes } = useStore()
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const add = () => {
    if (!text.trim()) return
    setState((s) => ({ notes: [{ id: uid(), text: text.trim(), date: todayKey(), ts: Date.now() }, ...s.notes] }))
    setText('')
  }
  const shown = notes.filter((n) => !q || n.text.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <div className="card">
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ghi lại lỗi sai, mẹo, cấu trúc hay…"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add() }} />
        <div className="row between"><input placeholder="🔎 Tìm ghi chú" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 220 }} /><button className="btn yellow" onClick={add}>Lưu</button></div>
      </div>
      <div className="notes-grid">
        {shown.map((n) => (
          <div key={n.id} className="card note">
            <textarea className="note-edit" defaultValue={n.text} rows={Math.min(8, n.text.split('\n').length + 1)}
              onBlur={(e) => setState((s) => ({ notes: s.notes.map((x) => (x.id === n.id ? { ...x, text: e.target.value } : x)) }))} />
            <div className="row between muted small"><span>{n.date}</span>
              <button className="icon-btn sm" onClick={() => setState((s) => ({ notes: s.notes.filter((x) => x.id !== n.id) }))}>🗑️</button></div>
          </div>
        ))}
        {!shown.length && <p className="muted">Chưa có ghi chú. Bấm nút 📝 góc dưới để ghi nhanh từ bất kỳ trang nào.</p>}
      </div>
    </>
  )
}

function Words() {
  const { saved } = useStore()
  return (
    <div className="card">
      <p className="muted small">Từ bạn lưu (từ trang Từ vựng hoặc khi bôi đen để dịch) sẽ tự vào Flashcard để ôn.</p>
      <ul className="saved-list">
        {saved.map((w) => (
          <li key={w.id}>
            <div className="grow"><b>{w.text}</b> <Speak text={w.text} small />
              <input className="inline" defaultValue={w.meaning} placeholder="Nghĩa…"
                onBlur={(e) => setState((s) => ({ saved: s.saved.map((x) => (x.id === w.id ? { ...x, meaning: e.target.value } : x)) }))} />
            </div>
            <button className="icon-btn sm" onClick={() => setState((s) => ({ saved: s.saved.filter((x) => x.id !== w.id) }))}>🗑️</button>
          </li>
        ))}
        {!saved.length && <li className="muted">Chưa lưu từ nào.</li>}
      </ul>
    </div>
  )
}

function Settings() {
  const { profile } = useStore()
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const set = (k, v) => setState((s) => ({ profile: { ...s.profile, [k]: v } }))
  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `capy-toeic-backup-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const upload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    f.text().then((t) => { importData(t); setMsg('✓ Đã khôi phục dữ liệu') }).catch(() => setMsg('File không hợp lệ'))
  }
  return (
    <div className="card form">
      <label>Tên hiển thị<input value={profile.name} onChange={(e) => set('name', e.target.value)} /></label>
      <label>Ngày bắt đầu lộ trình<input type="date" value={profile.startDate} onChange={(e) => e.target.value && set('startDate', e.target.value)} /></label>
      <label>Số từ mới mỗi ngày<input type="number" min={5} max={40} value={profile.dailyNew} onChange={(e) => set('dailyNew', Math.max(5, Math.min(40, Number(e.target.value) || 15)))} /></label>
      <hr />
      <p className="muted small">Dữ liệu lưu ngay trên máy này. Muốn chuyển sang điện thoại/máy khác: tải bản sao lưu rồi khôi phục ở máy kia.</p>
      <div className="row gap-s wrap">
        <button className="btn blue" onClick={download}>⬇️ Tải bản sao lưu</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>⬆️ Khôi phục từ file</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={upload} />
        <button className="btn danger" onClick={() => { if (confirm('Xóa toàn bộ tiến độ học? Không thể hoàn tác.')) resetAll() }}>Xóa dữ liệu</button>
      </div>
      {msg && <p>{msg}</p>}
    </div>
  )
}
