# 🎓 EdTech & E-Learning Domain Blueprint

Tiêu chuẩn cho hệ thống quản lý học tập (LMS), khóa học trực tuyến và đào tạo số.

## 1. 📚 Nhóm Khóa học & Nội dung (Courses & Content)
- `GET /courses`: Danh sách khóa học (kèm lọc theo category, level).
- `GET /courses/:id/curriculum`: Lấy chương trình học (Chương, Bài giảng).
- `GET /lessons/:id`: Nội dung bài giảng (Video, Text, Quiz).
- `POST /courses/:id/enroll`: Đăng ký khóa học.
- `GET /my-courses`: Danh sách khóa học user đã mua/tham gia.

## 2. ✍️ Nhóm Đánh giá & Tiến độ (Assessment & Progress)
- `POST /quizzes/:id/submit`: Nộp bài trắc nghiệm và tính điểm tự động.
- `PATCH /lessons/:id/complete`: Đánh dấu đã hoàn thành bài học.
- `GET /learning-path/status`: Theo dõi tiến độ tổng thể (% hoàn thành).
- `POST /assignments/submit`: Nộp bài tập tự luận (file upload).

## 3. 💬 Nhóm Tương tác (Interaction & Community)
- `POST /courses/:id/reviews`: Đánh giá và nhận xét khóa học.
- `GET /discussions`: Tham gia diễn đàn thảo luận bài học.
- `POST /mentors/booking`: Đặt lịch hẹn với giảng viên/gia sư.

## 💰 4. Nhóm Kinh doanh (Monetization)
- `GET /subscriptions`: Gói hội viên (Monthly/Yearly access).
- `POST /coupons/verify`: Kiểm tra mã giảm giá khóa học.
- `GET /certificates/:id`: Cấp và quản lý chứng chỉ hoàn thành.

---

### 🛡️ Business Rules (Kinh nghiệm thực chiến):
- **Gamification**: Tích hợp hệ thống điểm thưởng (Exp) và bảng xếp hạng (Leaderboard) để giữ chân người học.

---

## 🛠️ Technical Implementation Strategy (Senior Experience)

### 🎨 Frontend (FE) - Learning Experience
- **Video Player (HLS/Dash)**: Tích hợp `Video.js` hoặc `Mux Player` để phát video mượt mà, tự động điều chỉnh độ phân giải theo tốc độ mạng.
- **Quiz Engine**: Xử lý trạng thái làm bài (Timer, Progress, Results) mượt mà với hiệu ứng động để khuyến khích tinh thần học tập.
- **Offline Mode**: Hỗ trợ lưu trữ tạm bài giảng vào `IndexedDB` để học viên có thể xem tiếp khi mạng không ổn định.

### ⚙️ Backend (BE) - Automation & Security
- **Content Protection**: Sử dụng `Signed Cookies` hoặc `Signed URLs` (AWS CloudFront / Google Cloud CDN) để bảo vệ link video bài giảng.
- **Automated Grading**: Cơ chế chấm điểm tự động cho các bài trắc nghiệm và hỗ trợ khung chấm điểm (Rubric) cho bài tự luận.
- **Certificate Generation**: Tích hợp `Puppeteer` hoặc `Canvas` để tự động tạo file chứng chỉ (PDF/PNG) đẹp mắt khi học viên hoàn thành khóa học.

### 💾 Database (DB) - Tracking & Scale
- **Event Logs (BigData)**: Lưu mọi hành vi của học viên (xem đến giây thứ mấy của video, click vào đâu) vào một bảng log để phân tích hành vi (Learning Analytics).
- **Course Relationship**: Thiết kế schema hỗ trợ bài học tiên quyết (Prerequisites) và lộ trình học (Learning Paths) phức tạp.

### 🔄 Industry Workflow (PDCA)
- **Check Phase**: Thanh tra phải kiểm tra tỷ lệ rơi rớt (Drop-out rate) ở từng bài giảng cụ thể để báo cáo cho Planner cải thiện nội dung.
