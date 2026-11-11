# 🦫 Capy TOEIC 800

Website + app Android học TOEIC 800 trong 3 tháng. Miễn phí 100%, dữ liệu lưu ngay trên máy.

## Có gì bên trong
App chia làm 2 khu trên thanh menu:

### 🏡 Cá nhân (trang mở đầu)
- **Việc của mình:** to-do list tự tạo theo từng ngày (dải 7 ngày để chọn ngày, lên kế hoạch trước được), gắn nhãn Cá nhân / Học tập / Công việc / Sức khỏe / Vui chơi, đánh dấu ⭐ quan trọng, đặt giờ, sửa nhanh, chuyển việc dở hôm qua sang hôm nay.
- **Nhắc nhở & lưu ý:** ghi lịch thi, deadline, sự kiện, lưu ý; app tự đếm ngược ("Ngày mai", "Còn 5 ngày"), việc gấp (≤ 2 ngày) hiện thanh chuông ở đầu trang. Ngày thi TOEIC tự xuất hiện ở đây.
- **TOEIC hôm nay:** tóm tắt việc học trong ngày và nút vào học.

### 🎓 TOEIC (gom toàn bộ phần học)
- **Tổng quan:** trạng thái học, việc học hôm nay (tự điền theo lộ trình), mục tiêu, tiến độ tuần, phần cần ôn lại, nút **Bắt đầu buổi học** (~25 phút).
- **Lộ trình không trùng lặp** (`src/lib/course.js`): toàn bộ từ vựng, câu Part 5, bài Part 6/7, bài nghe chép và bài shadowing được giao **mỗi thứ một lần**, chia đều từ ngày bắt đầu đến 7 ngày trước ngày thi (tuần cuối để làm đề). Thời gian ngắn hoặc mục tiêu cao → mỗi ngày nhiều hơn; điểm hiện tại cao → bỏ qua phần dễ. Việc học hằng ngày chỉ tự đánh dấu xong khi làm đủ số lượng.
- **Ngày thi & mục tiêu:** chọn ngày thi, điểm mục tiêu, điểm hiện tại. Tổng quan TOEIC đếm ngược, lộ trình tự co giãn vừa khít đến ngày thi.
- **Lộ trình 12 tuần:** 3 chặng (Nền tảng → Kỹ năng → Tăng tốc), mỗi tuần có chủ điểm ngữ pháp, mục tiêu điểm và việc cụ thể từng ngày.
- **Khung kiến thức (từ Kaggle):** 195 bài TOEIC Listening & Reading (ngữ pháp A1–B2, chủ đề từ vựng, kỹ năng nghe Part 1–4, đọc Part 5–7). App lọc theo điểm mục tiêu, sắp thứ tự theo bài cần học trước, và chia đều đến ngày thi.
- **Flashcard:** 1.388 thẻ — 1.223 từ của TOEIC Service List (xếp theo tần suất trong đề, có nghĩa Việt, định nghĩa Anh, câu ví dụ) + 165 thẻ word family; lặp lại ngắt quãng (1 → 2 → 4 → 7 → 15 → 30 ngày).
- **Nghe chép:** 54 bài × 10 câu (~5–6 phút/bài): 12 bài kiểu đề TOEIC + 42 bài câu thông dụng chứa từ TOEIC; giọng Mỹ, Canada, Anh, Úc; 2 dạng: đục lỗ và nguyên câu. Có thể tự tạo bài.
- **Shadowing:** nghe câu mẫu, nói đuổi theo (lặp 3 lần), ghi âm giọng mình để so sánh, chấm phát âm bằng nhận dạng giọng nói (Chrome/Edge/Safari).
- **Part 6–7:** 10 đoạn Part 6 (có câu điền câu) và 12 bộ Part 7 (đơn, kép, ba văn bản; câu hỏi chi tiết, suy luận, từ đồng nghĩa, vị trí câu), có bấm giờ theo nhịp đề thật; từ TOEIC trong bài được tô sáng, chạm để xem nghĩa / lưu / thêm vào flashcard.
- **Part 5 thích ứng:** 13 chủ điểm, 211 câu, không lặp lại câu đã làm cho đến khi hết ngân hàng câu.
  - Đúng → tăng độ khó / chuyển sang dạng vận dụng
  - Sai → chỉ ra nguyên nhân sai
  - Sai nhiều lần → quay lại kiến thức nền (Việt + Anh)
  - Hiểu lý thuyết nhưng vẫn sai → bài tập ứng dụng từng bước
  - Thành thạo → giãn lịch ôn
- **Từ vựng word family:** 44 họ từ, đồng nghĩa, trái nghĩa, câu ví dụ có mệnh đề.
- **Bôi đen chữ tiếng Anh bất kỳ** → dịch + phát âm + lưu vào sổ tay.
- **Sổ tay:** nút 📝 ghi chú nhanh ở mọi trang, danh sách từ đã lưu.

### ⚙️ Cài đặt
- Tên hiển thị, ngày thi & mục tiêu, sao lưu/khôi phục dữ liệu.

## Đồng bộ web ↔ app
- Vào **Cài đặt → Tài khoản & đồng bộ**, tạo tài khoản (email + mật khẩu) một lần, rồi đăng nhập cùng tài khoản đó trên web và app.
- Mọi thay đổi (to-do, nhắc nhở, flashcard, bài nghe, tiến độ…) hiện lên thiết bị kia sau khoảng 1 giây. Mất mạng vẫn dùng bình thường, có mạng lại sẽ tự đồng bộ.
- Lần đầu đăng nhập trên một máy đã có dữ liệu: dữ liệu trên máy và trên mây được gộp lại, không mất bên nào.
- Hạ tầng: Firebase (Firestore + Authentication) dự án `toeic-28241`, gói miễn phí. Luật bảo mật trong `firestore.rules`: mỗi tài khoản chỉ đọc/ghi được dữ liệu của chính mình. Cập nhật luật: `npx firebase-tools deploy --only firestore:rules`.

## Chạy trên máy
```bash
npm install
npm run dev
```

## Đưa website lên Vercel (tài khoản quyn1)
**Cách 1 – qua GitHub (khuyên dùng, sau này sửa code là web tự cập nhật):**
1. Tạo repo mới trên github.com và đẩy thư mục này lên.
2. Vào vercel.com → đăng nhập bằng Google → **Add New… → Project** → chọn repo → **Deploy**. Vercel tự nhận Vite, không cần chỉnh gì.

**Cách 2 – bằng lệnh:**
```bash
vercel logout
vercel login      # chọn "Continue with Google", đăng nhập đúng tài khoản quyn1
vercel --prod
```

## App Android
**Cách nhanh nhất (không cần build):** mở link Vercel bằng Chrome trên điện thoại → menu ⋮ → **Thêm vào màn hình chính / Cài đặt ứng dụng**. App chạy toàn màn hình, có icon, dùng được khi mất mạng.

**File APK thật (miễn phí qua GitHub Actions):** sau khi đẩy code lên GitHub, tab **Actions** sẽ tự build. Xong thì vào **Releases → latest** để tải `capy-toeic.apk` về điện thoại rồi cài (cho phép "cài từ nguồn không xác định").

**Hoặc:** dán link Vercel vào https://www.pwabuilder.com → Package for stores → Android để tải APK.

Có Android Studio thì có thể build ngay trên máy: `npm run android:sync` rồi `npx cap open android`.

## Nguồn dữ liệu
- Khung kiến thức, mốc điểm TOEIC → CEFR và thứ tự bài học: [English Test Prep Data: TOEIC, IELTS, TOEFL](https://www.kaggle.com/datasets/duongduong123/english-test-prep-data-toeic-ielts-toefl) của duongduong123, giấy phép **Open Database License (ODbL)**. File `src/data/curriculum.js` được tạo bằng `python3 scripts/build_curriculum.py <thư mục CSV đã giải nén>`.
- 1.259 từ TOEIC hay gặp nhất: [TOEIC Service List 1.1](https://www.kaggle.com/datasets/jimregan/toeic-service-list) (Browne & Culligan), giấy phép **CC BY-SA 4.0**. Nghĩa tiếng Việt và từ loại do app bổ sung; file `src/data/tsl.json` chia sẻ theo cùng giấy phép CC BY-SA 4.0.
- Câu ví dụ cho từ vựng và 42 bài nghe "câu thông dụng": câu Anh–Việt từ [Tatoeba](https://tatoeba.org), giấy phép **CC BY 2.0 FR** (mã câu lưu trong `src/data/examples.json`, `src/data/listenMore.json`). Tạo lại bằng `python3 -I scripts/build_tatoeba.py <thư mục file Tatoeba> <TSL_11_lemmatized_for_teaching.txt>`.
- Word family, 12 bài nghe kiểu đề, câu hỏi Part 5 và bài đọc Part 6/7: tự soạn cho app (Part 5 sắp theo các bài ngữ pháp của bộ Kaggle ở trên).
- Âm thanh (2.659 file MP3 trong `public/audio`) tạo sẵn bằng [Piper TTS](https://github.com/rhasspy/piper) với các giọng: LJ Speech (public domain), LibriTTS-R (CC BY 4.0), Hi-Fi TTS "Cori" của NVIDIA (CC BY 4.0), VCTK của Đại học Edinburgh (CC BY 4.0; người đọc giọng Mỹ, Canada, Anh, Úc). Tạo lại bằng `scripts/list_audio.mjs` + `scripts/build_audio.py` (xem đầu file).

## Ghi chú
- Dịch tự động dùng MyMemory (miễn phí, khoảng 5.000 ký tự/ngày). 165+ từ trong bộ từ vựng được tra ngay cả khi không có mạng.
- Bài nghe và từ vựng có file âm thanh sẵn nên máy nào cũng có tiếng, kể cả offline. Chỉ phần bôi đen để nghe và bài tự tạo mới dùng giọng đọc của máy (Android nên cài "Speech Services by Google").
- Dữ liệu nằm trong trình duyệt/app của từng máy (tự lưu + bản dự phòng mỗi ngày), tải lại hay cập nhật web không mất. Luôn mở đúng link https://capy-toeic.vercel.app — link xem thử của từng lần deploy có dữ liệu riêng. Muốn chuyển máy: Cài đặt → Tải bản sao lưu → khôi phục ở máy kia.
