import { useEffect, useState } from 'react'
import { useStore, setState } from '../lib/store.js'
import { todayKey, addDays, fromKey, diffDays } from '../lib/date.js'
import { cefrFor, requiredLessons, requiredComps, skippedLessons, todayCurriculum, examInfo } from '../lib/curriculum.js'
import { totalDays } from '../data/plan.js'
import { dailyPlan } from '../lib/course.js'

const QUICK = [600, 700, 800, 900]
// TOEIC scores go from 10 to 990 in steps of 5
const fixScore = (n) => Math.min(990, Math.max(10, Math.round(n / 5) * 5))
const fmtDate = (k) => fromKey(k).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })

// Score box: free typing, saved when it is a full score (3 digits) or when leaving the box.
// Nothing is forced while typing, so "450" can be typed digit by digit.
function ScoreInput({ value, onSave, placeholder, optional }) {
  const [draft, setDraft] = useState(value ? String(value) : '')
  useEffect(() => setDraft(value ? String(value) : ''), [value])
  const type = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 3)
    setDraft(clean)
    const n = Number(clean)
    if (clean.length === 3 && n >= 100 && n <= 990) onSave(fixScore(n))
  }
  const leave = () => {
    const n = Number(draft)
    if (!draft) { if (optional) onSave(null); else setDraft(value ? String(value) : ''); return }
    const fixed = fixScore(n)
    onSave(fixed)
    setDraft(String(fixed))
  }
  return (
    <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} placeholder={placeholder} value={draft}
      onChange={(e) => type(e.target.value)} onBlur={leave}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
  )
}

// Exam date + target score + current score, with a summary of the plan they give
export default function ExamSetup({ compact }) {
  const store = useStore()
  const { profile, curri } = store
  const course = dailyPlan(store)
  const today = todayKey()
  const set = (patch) => setState((s) => ({ profile: { ...s.profile, ...patch } }))
  const target = profile.targetScore || 800
  const current = profile.currentScore || null
  const cefr = cefrFor(target)
  const cur = cefrFor(current)
  const days = profile.examDate ? diffDays(today, profile.examDate) : null
  const lessons = requiredLessons(target, current)
  const skipped = skippedLessons(target, current)
  const plan = todayCurriculum(profile, curri, today)
  const { studyEnd } = examInfo(profile, today)

  // How fast the score has to rise
  const gap = current ? target - current : null
  const weeksLeft = Math.max(1, (profile.examDate ? diffDays(today, profile.examDate) : totalDays(profile)) / 7)
  const perWeek = gap > 0 ? Math.round(gap / weeksLeft) : 0

  return (
    <div className="card exam-setup">
      <h2>🎯 Ngày thi & mục tiêu</h2>
      <div className="exam-grid">
        <label>📅 Ngày thi
          <input type="date" min={addDays(today, 1)} value={profile.examDate || ''}
            onChange={(e) => set({ examDate: e.target.value || null })} />
        </label>
        <label>🏆 Điểm mục tiêu (10–990)
          <ScoreInput value={target} onSave={(v) => set({ targetScore: v })} placeholder="VD: 750" />
          <span className="quick-scores">
            {QUICK.map((t) => (
              <button type="button" key={t} className={`chip ${t === target ? 'on' : ''}`} onClick={() => set({ targetScore: t })}>{t}</button>
            ))}
          </span>
        </label>
        <label>📊 Điểm hiện tại (nếu có)
          <ScoreInput value={current} onSave={(v) => set({ currentScore: v })} placeholder="VD: 450" optional />
          <span className="muted small">Điểm thi thật hoặc đề thử gần nhất. Để trống nếu chưa biết.</span>
        </label>
        {!compact && (
          <label>🚩 Ngày bắt đầu học
            <input type="date" value={profile.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
          </label>
        )}
      </div>

      {current && (
        <div className="score-path">
          <div className="sp-node"><b>{current}</b><span>hiện tại{cur ? ` · ${cur.cefr}` : ''}</span></div>
          <div className="sp-line"><span>{gap > 0 ? `+${gap} điểm` : 'đã đạt'}</span></div>
          <div className="sp-node goal"><b>{target}</b><span>mục tiêu{cefr ? ` · ${cefr.cefr}` : ''}</span></div>
        </div>
      )}
      {current && gap <= 0 && <p className="ok-box small">🎉 Điểm hiện tại đã đạt mục tiêu! Nâng mục tiêu lên (VD: {fixScore(Math.min(990, current + 100))}) để lộ trình tiếp tục thử thách bạn.</p>}
      {current && gap > 0 && (
        <p className="small">
          📈 Cần tăng khoảng <b>{perWeek} điểm/tuần</b> trong {Math.round(weeksLeft)} tuần. Mục tiêu mỗi tuần trong lộ trình đi từ {current} lên {target}.
          {skipped.length > 0 && <> App đã bỏ qua <b>{skipped.length} bài</b> ở trình độ bạn đã vượt qua.</>}
        </p>
      )}
      <div className="load-box">
        <b>📦 Khối lượng học mỗi ngày (tự tính theo mục tiêu và thời gian còn lại)</b>
        <div className="load-grid">
          <span>🃏 <b>{course.words.goal}</b> từ mới</span>
          <span>🧠 <b>{course.part5.goal || course.part5.review}</b> câu Part 5</span>
          <span>📄 Part 6: <b>{course.part6.total}</b> đoạn / {course.win.daysLeft} ngày</span>
          <span>📰 Part 7: <b>{course.part7.total}</b> bài / {course.win.daysLeft} ngày</span>
          <span>🎧 <b>{course.listen.goal}</b> bài nghe chép</span>
          <span>🗣️ <b>{course.shadow.goal}</b> bài shadowing</span>
        </div>
        <p className="muted small">≈ {course.minutes} phút/ngày. Toàn bộ {course.words.total} từ, {course.part5.total} câu Part 5, {course.part6.total + course.part7.total} bài đọc và {course.listen.total} bài nghe được chia đều đến {fromKey(course.win.end).toLocaleDateString('vi-VN')}, mỗi bài chỉ giao một lần. Thời gian càng ngắn hoặc mục tiêu càng cao thì mỗi ngày càng nhiều.</p>
        {course.words.goal >= 60 && course.words.total - course.words.learned > course.win.daysLeft * 60 && <p className="warn small">⚠️ Không đủ thời gian để học hết {course.words.total} từ (tối đa 60 từ/ngày) — app ưu tiên từ hay gặp nhất trong đề.</p>}
      </div>
      {perWeek > 40 && <p className="warn small">⚠️ Mức tăng này khá gắt so với thời gian còn lại. Nên học nhiều hơn mỗi ngày, lùi ngày thi, hoặc đặt mục tiêu chặng giữa (VD: {fixScore(current + Math.round(weeksLeft * 30))}) rồi nâng dần.</p>}

      {profile.examDate ? (
        <div className="exam-summary">
          <div className="countdown"><b>{days > 0 ? days : 0}</b><span>ngày nữa thi</span></div>
          <div className="small">
            <p>🗓️ {fmtDate(profile.examDate)}</p>
            <p>🎯 {target} điểm ≈ trình độ <b>{cefr?.cefr}</b> ({cefr?.from}–{cefr?.to}){cur && <> · hiện tại <b>{cur.cefr}</b></>}</p>
            <p>📘 Cần học <b>{lessons.length}</b> bài trong khung kiến thức · đã xong {plan.doneCount} · khoảng <b>{plan.perDay.toFixed(1)}</b> bài/ngày đến {fromKey(studyEnd).toLocaleDateString('vi-VN')}, tuần cuối dành để làm đề.</p>
            {days !== null && days < 21 && <p className="warn">⚠️ Còn ít thời gian: app ưu tiên ôn chủ điểm yếu và làm đề. Có thể lùi ngày thi hoặc hạ mục tiêu để lịch nhẹ hơn.</p>}
            {plan.perDay > 4 && days >= 21 && <p className="warn">⚠️ Lịch khá dày (&gt; 4 bài/ngày). Cân nhắc lùi ngày thi hoặc hạ mục tiêu.</p>}
          </div>
        </div>
      ) : (
        <p className="muted small">Chọn ngày thi để app chia lộ trình 12 tuần và khung kiến thức vừa khít đến ngày thi.</p>
      )}
      {!compact && (
        <p className="muted small">Mốc điểm TOEIC → CEFR và danh sách năng lực cần có lấy từ bộ dữ liệu Kaggle. Với {target} điểm, cần: {requiredComps(target).map((c) => c.cefr ? `Ngữ pháp ${c.cefr}` : c.name.replace('Test in TOEIC for Level', '')).join(' · ')}.</p>
      )}
    </div>
  )
}
