# 🏠 Real Estate & Property Management Blueprint

Tiêu chuẩn nghiệp vụ cho sàn giao dịch Bất động sản, cho thuê nhà và quản lý dự án.

## 1. 🔍 Nhóm Tìm kiếm & Danh mục (Listings)
- `GET /properties`: Danh sách nhà đất (Filter: vị trí, giá, diện tích, loại hình).
- `GET /properties/:id/map`: Tích hợp bản đồ và các tiện ích xung quanh (Trường học, Bệnh viện).
- `GET /properties/:id/virtual-tour`: API tích hợp ảnh/video 360 độ hoặc VR Tour.

## 🤝 2. Nhóm Quản lý Leads & CRM
- `POST /leads/contact`: Gửi yêu cầu tư vấn/hẹn xem nhà.
- `GET /agents/list`: Danh sách môi giới phụ trách khu vực.
- `PATCH /leads/:id/status`: Quản lý phễu khách hàng (Mới -> Quan tâm -> Xem nhà -> Chốt).

## 📄 3. Nhóm Pháp lý & Hợp đồng (Legal)
- `GET /legal/check`: Thông tin quy hoạch/pháp lý của bất động sản.
- `POST /contracts/deposit`: Tạo hợp đồng đặt cọc online.
- `POST /mortgage/calculate`: Công cụ tính toán khoản vay ngân hàng.

## 🏢 4. Nhóm Quản lý vận hành (Property Management)
- `GET /rentals/payment`: Quản lý đóng tiền nhà hàng tháng.
- `POST /maintenance/request`: Gửi yêu cầu sửa chữa (cho căn hộ cho thuê).

---

### 🛡️ Business Rules (Kinh nghiệm thực chiến):
- **Verification Logic**: Phải có tích kiểm duyệt "Chính chủ" hoặc "Môi giới xác thực" để tránh tin rác.
- **Urgency Hooks**: Hiển thị số lượt xem và số người đang quan tâm để thúc đẩy quyết định.
- **Data Freshness**: Tự động gỡ hoặc đánh dấu "Đã bán" khi tin đăng quá hạn để giữ uy tín sàn.
- **Image Optimization**: Bất động sản cần ảnh đẹp HD, phải xử lý Lazy Loading và CDN để web không bị chậm.

---

## 🛠️ Technical Implementation Strategy (Senior Experience)

### 🎨 Frontend (FE) - Immersive Discovery
- **Virtual Tour (360)**: Tích hợp `Pannellum` hoặc `Three.js` để người dùng có thể xem nhà thực tế ảo ngay trên web.
- **Advanced Filters**: Giao diện lọc đa tầng (Location, Price range, Property type, Amenities) với cập nhật danh sách ngay lập tức khi người dùng thay đổi lựa chọn.
- **Interactive Maps**: Sử dụng `Leaflet` hoặc `Mapbox` để vẽ ranh giới khu đất và hiển thị các tiện ích điểm xung quanh.

### ⚙️ Backend (BE) - Leads & CRM Management
- **Lead Assignment Engine**: Tự động phân phối yêu cầu tư vấn của khách hàng cho Môi giới dựa trên khu vực phụ trách.
- **Crawler/Verification**: API kiểm tra tính trùng lặp của tin đăng và xác thực giấy tờ pháp lý tự động qua AI (OCR).
- **External Integration**: Tích hợp API ngân hàng để hiển thị lãi suất vay và tính toán khoản trả góp hàng tháng thời gian thực.

### 💾 Database (DB) - Geospatial & Assets
- **Geo-indexing**: Sử dụng `PostGIS` (GEOGRAPHY) để truy vấn nhanh các bất động sản trong bán kính R hoặc trong khu vực bản đồ hiện tại.
- **Media Management**: Lưu trữ hàng chục ảnh HD/4K cho mỗi listing, cần cấu hình CDN để tối ưu tốc độ tải.

### 🔄 Industry Workflow (PDCA)
- **Check Phase**: Thanh tra phải kiểm tra tính "Sống" của tin đăng (đã bán hay chưa) để đề xuất gỡ tin cũ, tránh làm phiền khách hàng.
