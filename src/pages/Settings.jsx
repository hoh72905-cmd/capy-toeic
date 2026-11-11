import { useRef, useState } from 'react'
import { useStore, setState, exportData, importData, resetAll, storage } from '../lib/store.js'
import { todayKey } from '../lib/date.js'
import Title from '../components/Title.jsx'
import ExamSetup from '../components/ExamSetup.jsx'
import Account from '../components/Account.jsx'

export default function Settings() {
  const { profile, savedAt } = useStore()
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
      <Account />
      <div className="card form tint-yellow">
        <Title icon="🙋">Hồ sơ</Title>
        <label>Tên hiển thị<input value={profile.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label>Số từ mới mỗi ngày (flashcard)<input type="number" min={5} max={40} value={profile.dailyNew} onChange={(e) => set('dailyNew', Math.max(5, Math.min(40, Number(e.target.value) || 15)))} /></label>
      </div>
      <ExamSetup />
      <div className="card form tint-blue">
        <Title icon="💾">Sao lưu dữ liệu</Title>
        <p className={storage.ok ? 'ok-box small' : 'cause small'}>
          {storage.ok ? '💾 Tự động lưu mỗi khi bạn học' : '⚠️ Không lưu được dữ liệu (bộ nhớ đầy hoặc đang ở chế độ ẩn danh)'}
          {savedAt ? ` · lần lưu gần nhất ${new Date(savedAt).toLocaleString('vi-VN')}` : ''}
        </p>
        <p className="muted small">Tiến độ được lưu ngay trên thiết bị và trình duyệt bạn đang dùng (kèm một bản dự phòng mỗi ngày), nên tải lại trang hay cập nhật web đều không mất. Muốn web và app dùng chung dữ liệu: đăng nhập tài khoản ở mục “Tài khoản & đồng bộ” phía trên. Bản sao lưu bên dưới là lớp bảo vệ thêm. Đừng xóa dữ liệu duyệt web của trang này.</p>
        <div className="row gap-s wrap">
          <button className="btn blue" onClick={download}>⬇️ Tải bản sao lưu</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆️ Khôi phục từ file</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={upload} />
          <button className="btn danger" onClick={() => { if (confirm('Xóa toàn bộ dữ liệu (việc, nhắc nhở, tiến độ học)? Không thể hoàn tác.')) resetAll() }}>Xóa dữ liệu</button>
        </div>
        {msg && <p>{msg}</p>}
      </div>
      <p className="muted small version">🦫 Phiên bản {new Date(__BUILD_TIME__).toLocaleString('vi-VN')} · app trên điện thoại tự cập nhật theo web, không cần cài lại</p>
    </div>
  )
}
