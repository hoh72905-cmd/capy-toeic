import { useState } from 'react'
import { setState } from '../lib/store.js'
import { uid, todayKey } from '../lib/date.js'

// Floating button: jot a note from anywhere in the app
export default function QuickNote() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const save = () => {
    if (!text.trim()) return
    setState((s) => ({ notes: [{ id: uid(), text: text.trim(), date: todayKey(), ts: Date.now() }, ...s.notes] }))
    setText(''); setDone(true); setTimeout(() => { setDone(false); setOpen(false) }, 700)
  }
  return (
    <>
      <button className="fab" onClick={() => setOpen(true)} title="Ghi chú nhanh" aria-label="Ghi chú nhanh">📝</button>
      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="row between"><h3>📝 Ghi chú nhanh</h3><button className="icon-btn" onClick={() => setOpen(false)}>✕</button></div>
            <textarea autoFocus rows={5} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Ví dụ: 'despite + N, although + mệnh đề' — mình hay nhầm!"
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save() }} />
            <div className="row between">
              <span className="muted small">Ctrl + Enter để lưu nhanh</span>
              <button className="btn yellow" onClick={save}>{done ? '✓ Đã lưu' : 'Lưu ghi chú'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
