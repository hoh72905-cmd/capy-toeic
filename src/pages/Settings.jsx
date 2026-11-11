import { useRef, useState } from 'react'
import { useStore, setState, exportData, importData, resetAll } from '../lib/store.js'
import { todayKey } from '../lib/date.js'
import Title from '../components/Title.jsx'
import ExamSetup from '../components/ExamSetup.jsx'

export default function Settings() {
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
    <div className="page">
      <div className="page-head"><h1>⚙️ Cài đặt</h1></div>
      <div className="card form tint-yellow">
        <Title icon="🙋">Hồ sơ</Title>
        <label>Tên hiển thị<input value={profile.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label>Số từ mới mỗi ngày (flashcard)<input type="number" min={5} max={40} value={profile.dailyNew} onChange={(e) => set('dailyNew', Math.max(5, Math.min(40, Number(e.target.value) || 15)))} /></label>
      </div>
      <ExamSetup />
      <div className="card form tint-blue">
        <Title icon="💾">Sao lưu dữ liệu</Title>
        <p className="muted small">Dữ liệu lưu ngay trên máy này. Muốn chuyển sang điện thoại/máy khác: tải bản sao lưu rồi khôi phục ở máy kia.</p>
        <div className="row gap-s wrap">
          <button className="btn blue" onClick={download}>⬇️ Tải bản sao lưu</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆️ Khôi phục từ file</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={upload} />
          <button className="btn danger" onClick={() => { if (confirm('Xóa toàn bộ dữ liệu (việc, nhắc nhở, tiến độ học)? Không thể hoàn tác.')) resetAll() }}>Xóa dữ liệu</button>
        </div>
        {msg && <p>{msg}</p>}
      </div>
    </div>
  )
}
