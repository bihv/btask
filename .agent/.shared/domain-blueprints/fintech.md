# 🏦 Fintech & Banking Domain Blueprint

Tiêu chuẩn nghiệp vụ cho hệ thống Tài chính, Ví điện tử, và Ngân hàng số. Độ chính xác và bảo mật là ưu tiên số 1.

## 1. 💳 Nhóm Tài khoản & Ví (Accounts & Wallets)
- `POST /wallets`: Khởi tạo ví/tài khoản định danh.
- `GET /wallets/balance`: Truy vấn số dư thời gian thực.
- `GET /wallets/history`: Sao kê giao dịch (Transaction history).
- `POST /wallets/link-card`: Liên kết thẻ ngân hàng/tài khoản ngoại vi.

## 2. 💸 Nhóm Giao dịch (Transactions & Payments)
- `POST /transfers/internal`: Chuyển tiền nội bộ (cần cơ chế Lock dư nợ).
- `POST /transfers/external`: Chuyển tiền liên ngân hàng (NAPAS/Swift).
- `POST /payments/bill`: Thanh toán hóa đơn (Điện, nước, internet).
- `POST /payments/qr-code`: Thanh toán qua mã QR (EMVCo standard).
- `POST /withdrawals`: Rút tiền về tài khoản liên kết.

## 3. 🛡️ Nhóm Bảo mật & Định danh (Compliance & Security)
- `POST /kyc/submit`: Gửi hồ sơ định danh (eKYC - CCCD, Face matching).
- `GET /kyc/status`: Kiểm tra trạng thái phê duyệt hồ sơ.
- `POST /auth/otp/generate`: Tạo mã OTP cho giao dịch nhạy cảm.
- `POST /auth/biometric/verify`: Xác thực sinh trắc học.

## 📈 4. Nhóm Tín dụng & Tiết kiệm (Lending & Savings)
- `POST /savings/open`: Mở sổ tiết kiệm online (kèm tính lãi suất).
- `POST /loans/apply`: Đăng ký khoản vay (Tín chấp/Thế chấp).
- `GET /credit-score`: Truy vấn điểm tín dụng nội bộ.

---

### 🛡️ Business Rules (Kinh nghiệm thực chiến):
- **Audit Logging**: Ghi chép mọi thay đổi số dư vào log hệ thống không thể xóa (Immutable logs).

---

## 🛠️ Technical Implementation Strategy (Senior Experience)

### 🎨 Frontend (FE) - Customer Trust & Security
- **Security UI**: Tích hợp các thành phần bảo mật như "Pin Pad" tùy chỉnh, che số tài khoản, và hiệu ứng mờ nhòe (Blur) khi app rơi vào trạng thái Background.
- **Data Visualization**: Sử dụng `D3.js` hoặc `Echarts` để vẽ biểu đồ tăng trưởng tài sản với độ chính xác cao.
- **eKYC Flow**: Xử lý luồng chụp ảnh CCCD và Selfie ngay trên trình duyệt với thư viện `Face-api.js` hoặc `Webcam.js`, kiểm tra độ sáng và góc chụp real-time.

### ⚙️ Backend (BE) - Integrity & Performance
- **Transactional Engine**: Sử dụng cơ chế `Idempotency-Key` cho mọi API thanh toán để tránh trừ tiền 2 lần khi mạng lag.
- **Distributed Locking**: Dùng `Redis Redlock` khi cập nhật số dư ví để tránh tranh chấp dữ liệu (Race condition) khi có hàng ngàn giao dịch cùng lúc.
- **Webhook Security**: Kiểm tra `Signature` gắt gao từ các cổng thanh toán (Stripe/Momo) để tránh giả mạo yêu cầu.

### 💾 Database (DB) - The Source of Truth
- **Numeric Precision**: Tuyệt đối không dùng `Float/Double`. Sử dụng `DECIMAL(20, 4)` hoặc lưu theo đơn vị nhỏ nhất (Cents/Xu) dưới dạng `BigInt`.
- **Partitioning**: Chia nhỏ bảng `transactions` theo tháng/năm (Table Partitioning) để đảm bảo tốc độ truy vấn không bị chậm khi lên đến hàng triệu bản ghi.
- **Immutable Logs**: Thiết kế bảng Log chỉ cho phép `INSERT`, không cho phép `UPDATE/DELETE`.

### 🔄 Industry Workflow (PDCA)
- **Check Phase**: Thanh tra phải kiểm tra sự sai lệch (Discrepancy) giữa tổng tiền trong ví người dùng và tổng lịch sử giao dịch mỗi 1h/lần.
