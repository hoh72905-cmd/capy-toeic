# 🦫 Capy TOEIC 800

Website + app Android học TOEIC 800 trong 3 tháng. Miễn phí 100%, dữ liệu lưu ngay trên máy.

## Có gì bên trong
- **Hôm nay (trang chính):** lời chào, trạng thái học, to-do list tự điền theo lộ trình, mục tiêu hôm nay, tiến độ tuần, phần cần ôn lại, nút **Bắt đầu buổi học** (~25 phút).
- **Lộ trình 12 tuần:** 3 chặng (Nền tảng → Kỹ năng → Tăng tốc), mỗi tuần có chủ điểm ngữ pháp, mục tiêu điểm và việc cụ thể từng ngày.
- **Flashcard:** 165 thẻ, lặp lại ngắt quãng (1 → 2 → 4 → 7 → 15 → 30 ngày).
- **Nghe chép:** 12 bài × 10 câu (~5–6 phút/bài), giọng Mỹ/Anh/Úc, 2 dạng: đục lỗ và nguyên câu. Có thể tự tạo bài.
- **Luyện ngữ pháp thích ứng:** 11 chủ điểm Part 5/6.
  - Đúng → tăng độ khó / chuyển sang dạng vận dụng
  - Sai → chỉ ra nguyên nhân sai
  - Sai nhiều lần → quay lại kiến thức nền (Việt + Anh)
  - Hiểu lý thuyết nhưng vẫn sai → bài tập ứng dụng từng bước
  - Thành thạo → giãn lịch ôn
- **Từ vựng word family:** 44 họ từ, đồng nghĩa, trái nghĩa, câu ví dụ có mệnh đề.
- **Bôi đen chữ tiếng Anh bất kỳ** → dịch + phát âm + lưu vào sổ tay.
- **Sổ tay:** nút 📝 ghi chú nhanh ở mọi trang, danh sách từ đã lưu, sao lưu/khôi phục dữ liệu.

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

## Ghi chú
- Dịch tự động dùng MyMemory (miễn phí, khoảng 5.000 ký tự/ngày). 165+ từ trong bộ từ vựng được tra ngay cả khi không có mạng.
- Giọng đọc dùng engine có sẵn trên máy (Chrome/Edge/Android). Trên Android nên cài "Speech Services by Google".
- Dữ liệu nằm trong trình duyệt/app của từng máy. Muốn chuyển máy: Sổ tay → Cài đặt → Tải bản sao lưu → khôi phục ở máy kia.
