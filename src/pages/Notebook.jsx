import { useState } from 'react'
import { useStore, setState } from '../lib/store.js'
import { uid, todayKey } from '../lib/date.js'
import Speak from '../components/Speak.jsx'

export default function Notebook({ params }) {
  const [tab, setTab] = useState(params?.ref === 'words' ? 'words' : 'notes')
  return (
    <div className="page">
      <div className="page-head">
        <h1>📒 Sổ tay</h1>
        <div className="seg">
          <button className={tab === 'notes' ? 'on' : ''} onClick={() => setTab('notes')}>📝 Ghi chú</button>
          <button className={tab === 'words' ? 'on' : ''} onClick={() => setTab('words')}>⭐ Từ đã lưu</button>
        </div>
      </div>
      {tab === 'notes' && <Notes />}
      {tab === 'words' && <Words />}
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
