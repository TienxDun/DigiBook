# 📚 DigiBook - Nhà Sách Trực Tuyến Hiện Đại

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue.svg" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue.svg" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF.svg" alt="Vite"/>
  <img src="https://img.shields.io/badge/Firebase-12-orange.svg" alt="Firebase"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC.svg" alt="Tailwind CSS"/>
</div>

<div align="center">
  <h3>🏪 Ứng dụng nhà sách trực tuyến hiện đại với React 19 & Firebase</h3>
  <p>Giải pháp thương mại điện tử toàn diện cho ngành sách với hệ thống quản trị thông minh</p>
</div>

---

## 🚀 Tổng Quan
**DigiBook** là một ứng dụng web bán sách hiện đại, được xây dựng với mục tiêu mang lại trải nghiệm mua sắm mượt mà cho người dùng và hệ thống quản lý mạnh mẽ cho quản trị viên. Dự án sử dụng công nghệ mới nhất như **React 19**, **Vite**, và **Firebase (Firestore/Auth)**.

## 🛠️ Công Nghệ Sử Dụng
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite.
- **Backend & Database**: Firebase Firestore (NoSQL), Firebase Authentication.
- **Tools**: React Router 6, React Hot Toast, FontAwesome.

## ✨ Tính Năng Cốt Lõi

### 🛒 Dành cho Khách Hàng
- **Khám Phá**: Duyệt sách theo danh mục, tác giả, tìm kiếm thời gian thực.
- **Giỏ Hàng & Thanh Toán**: Quản lý giỏ hàng linh hoạt, quy trình checkout tối ưu.
- **Cá Nhân Hóa**: Danh sách yêu thích (Wishlist), lịch sử đơn hàng, quản lý hồ sơ.
- **Tương Tác**: Đánh giá và chấm điểm sách.

### 👨‍💼 Dành cho Quản Trị Viên (Admin Hub)
- **Dashboard**: Thống kê doanh thu, đơn hàng và hoạt động hệ thống.
- **Quản Lý Kho**: Quản lý Sách, Tác giả, Danh mục và Mã giảm giá.
- **Quản Lý Đơn Hàng**: Theo dõi trạng thái đơn hàng từ lúc đặt đến lúc giao.
- **Admin AI**: Tích hợp công cụ hỗ trợ thông minh cho quản trị viên.
- **System Logs**: Nhật ký hoạt động hệ thống chi tiết cho mục đích kiểm soát.

## 🏗️ Kiến Trúc Hệ Thống
Dự án tuân thủ các nguyên tắc thiết kế sạch và dễ bảo trì:
- **Centralized Services**: Toàn bộ logic tương tác Firestore được tập trung tại [services/db.ts](services/db.ts).
- **Authentication**: Sử dụng `AuthContext` và `useAuth()` hook để quản lý trạng thái người dùng xuyên suốt ứng dụng.
- **Error Handling**: Hệ thống xử lý lỗi tập trung qua `ErrorHandler` để đồng bộ log và thông báo người dùng.
- **Admin Isolation**: Các thành phần quản trị được tách biệt trong thư mục `components/admin/`.

## 📁 Cấu Trúc Thư Mục
```text
├── components/       # UI Components (Header, Footer, BookCard, ...)
│   └── admin/        # Admin specific components
├── pages/            # View components (Home, Details, AdminDashboard, ...)
├── services/         # Firebase, Database, Error Handling logic
├── constants/        # App constants, categories, AI configs
├── types.ts          # Centralized TypeScript definitions
└── AuthContext.tsx   # Authentication provider
```

## 🛠️ Cài Đặt & Phát Triển

### 1. Yêu Cầu
- Node.js >= 18
- Firebase Project (Firestore & Auth enabled)

### 2. Các bước thiết lập
```bash
# Clone dự án
git clone https://github.com/your-username/digibook.git

# Cài đặt thư viện
npm install

# Tạo file .env và cấu hình Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... (các biến khác từ Firebase Console)
```

### 3. Chạy ứng dụng
```bash
# Chế độ phát triển
npm run dev

# Build sản phẩm
npm run build
```

## 📜 Giấy Phép
Dự án này thuộc quyền sở hữu của DigiBook Team. Được cấp phép theo [MIT License](LICENSE).



