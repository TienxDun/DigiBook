# 📚 DigiBook - Nhà Sách Trực Tuyến Hiện Đại

<div align="center">
  <img src="https://img.shields.io/badge/React-19.2.3-blue.svg" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-blue.svg" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF.svg" alt="Vite"/>
  <img src="https://img.shields.io/badge/Firebase-12.8.0-orange.svg" alt="Firebase"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC.svg" alt="Tailwind CSS"/>
</div>

<div align="center">
  <h3>🏪 Ứng dụng nhà sách trực tuyến hiện đại được xây dựng với React & Firebase</h3>
  <p>Trải nghiệm mua sắm sách liền mạch với hệ thống quản trị nâng cao</p>
</div>

## ✨ Tính Năng

### 🛒 Tính Năng Khách Hàng
- **📖 Duyệt Sách**: Khám phá danh mục sách phong phú với phân loại và tác giả
- **🔍 Tìm Kiếm Thông Minh**: Tìm kiếm thời gian thực với bộ lọc và sắp xếp
- **🛍️ Giỏ Hàng**: Thêm, bớt và quản lý các mặt hàng trong giỏ
- **⭐ Đánh Giá & Sao**: Đọc và viết đánh giá sách
- **👤 Xác Thực Người Dùng**: Đăng nhập Google và đăng ký email/mật khẩu
- **📦 Quản Lý Đơn Hàng**: Theo dõi đơn hàng và lịch sử mua hàng
- **📱 Thiết Kế Responsive**: Tối ưu cho máy tính để bàn, máy tính bảng và điện thoại

### 👨‍💼 Tính Năng Quản Trị
- **📊 Bảng Điều Khiển**: Phân tích toàn diện và thông tin chi tiết
- **📚 Quản Lý Sách**: Thêm, sửa, xóa sách với kiểm soát tồn kho
- **👥 Quản Lý Tác Giả**: Quản lý hồ sơ và tiểu sử tác giả
- **🏷️ Quản Lý Danh Mục**: Tổ chức sách theo danh mục
- **📈 Giám Sát Đơn Hàng**: Giám sát và quản lý đơn hàng của khách hàng
- **📋 Nhật Ký Hệ Thống**: Theo dõi tất cả hoạt động và thay đổi của hệ thống
- **📊 Điền Dữ Liệu**: Điền dữ liệu mẫu vào cơ sở dữ liệu

### 🔧 Tính Năng Kỹ Thuật
- **⚡ Hiệu Suất Nhanh**: Công cụ phát triển và xây dựng được hỗ trợ bởi Vite
- **🔄 Cập Nhật Thời Gian Thực**: Đồng bộ hóa dữ liệu trực tiếp với Firestore
- **🛡️ An Toàn Kiểu Dữ Liệu**: Triển khai TypeScript đầy đủ
- **📱 Sẵn Sàng PWA**: Khả năng Progressive Web App
- **🌐 Hỗ Trợ Offline**: Giảm tải nhẹ nhàng với dữ liệu giả khi ngoại tuyến

## 🚀 Công Nghệ Sử Dụng

### Frontend
- **React 19** - React hiện đại với các tính năng đồng thời
- **TypeScript** - JavaScript an toàn kiểu
- **Vite** - Công cụ xây dựng và máy chủ phát triển siêu nhanh
- **React Router** - Định tuyến phía máy khách
- **Tailwind CSS** - Khung CSS ưu tiên tiện ích
- **Font Awesome** - Thư viện biểu tượng

### Backend & Cơ Sở Dữ Liệu
- **Firebase** - Dịch vụ Backend-as-a-Service
  - Firestore (Cơ sở dữ liệu NoSQL)
  - Firebase Auth (Xác thực)
  - Firebase Hosting (Triển khai)

### Công Cụ Phát Triển
- **ESLint** - Kiểm tra mã
- **TypeScript Compiler** - Kiểm tra kiểu
- **Vite Dev Server** - Máy chủ phát triển với HMR

## 📋 Yêu Cầu Hệ Thống

- **Node.js** (phiên bản 18 trở lên)
- **npm** hoặc **yarn** trình quản lý gói
- **Firebase** dự án với Firestore được bật

## 🛠️ Cài Đặt & Thiết Lập

### 1. Sao chép kho lưu trữ
```bash
git clone https://github.com/your-username/digibook.git
cd digibook
```

### 2. Cài đặt các phụ thuộc
```bash
npm install
```

### 3. Cấu hình Firebase
1. Tạo dự án Firebase tại [Firebase Console](https://console.firebase.google.com/)
2. Bật Cơ sở dữ liệu Firestore và Xác thực
3. Sao chép cấu hình Firebase của bạn vào `services/firebase.ts`

```typescript
// services/firebase.ts
const firebaseConfig = {
  apiKey: "api-key-cua-ban",
  authDomain: "du-an-cua-ban.firebaseapp.com",
  projectId: "id-du-an-cua-ban",
  storageBucket: "du-an-cua-ban.appspot.com",
  messagingSenderId: "123456789",
  appId: "app-id-cua-ban"
};
```

### 4. Chạy máy chủ phát triển
```bash
npm run dev
```

Truy cập `http://localhost:3000` để xem ứng dụng đang chạy!

### 5. Xây dựng để sản xuất
```bash
npm run build
npm run preview
```

## 📁 Cấu Trúc Dự Án

```
digibook/
├── public/                 # Tài sản tĩnh
│   ├── favicon.ico        # Favicon ứng dụng
│   └── ...
├── src/
│   ├── components/        # Thành phần UI có thể tái sử dụng
│   │   ├── BookCard.tsx   # Thành phần hiển thị sách
│   │   ├── CartSidebar.tsx # Thanh bên giỏ hàng
│   │   ├── Header.tsx     # Tiêu đề ứng dụng với điều hướng
│   │   ├── Footer.tsx     # Chân trang ứng dụng
│   │   └── ...
│   ├── pages/             # Thành phần trang
│   │   ├── AdminDashboard.tsx # Giao diện quản trị
│   │   ├── BookDetails.tsx    # Trang sách cá nhân
│   │   ├── CategoryPage.tsx   # Sách theo danh mục
│   │   ├── CheckoutPage.tsx   # Thanh toán đơn hàng
│   │   └── ...
│   ├── services/          # Logic nghiệp vụ và lệnh gọi API
│   │   ├── db.ts          # Hoạt động cơ sở dữ liệu
│   │   ├── firebase.ts    # Cấu hình Firebase
│   │   └── ...
│   ├── types.ts           # Định nghĩa kiểu TypeScript
│   ├── constants.tsx      # Hằng số và dữ liệu giả của ứng dụng
│   ├── App.tsx            # Thành phần ứng dụng chính
│   └── main.tsx           # Điểm nhập ứng dụng
├── index.html             # Mẫu HTML
├── package.json           # Phụ thuộc và tập lệnh
├── tsconfig.json          # Cấu hình TypeScript
├── vite.config.ts         # Cấu hình Vite
└── README.md             # Tài liệu dự án
```

## 🔧 Cấu Hình

### Biến Môi Trường
Tạo tệp `.env.local` trong thư mục gốc:

```env
# Cấu hình Firebase (nếu cần)
VITE_FIREBASE_API_KEY=api-key-cua-ban
VITE_FIREBASE_AUTH_DOMAIN=du-an-cua-ban.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=id-du-an-cua-ban
```


## 🎨 Thiết Kế UI/UX

- **Thiết Kế Hiện Đại**: Giao diện sạch sẽ, tối giản với hoạt hình mượt mà
- **Khả Năng Truy Cập**: Tuân thủ WCAG với nhãn ARIA thích hợp
- **Hiệu Suất**: Hình ảnh được tối ưu hóa và tải chậm
- **Đầu Tiên Trên Di Động**: Thiết kế responsive cho tất cả kích thước màn hình
- **Sẵn Sàng Chế Độ Tối**: Biến CSS để dễ dàng tạo chủ đề


### Nguyên Tắc Phát Triển
- Sử dụng TypeScript cho tất cả mã mới
- Làm theo các phương pháp tốt nhất của React và hooks
- Viết thông điệp cam kết có ý nghĩa
- Kiểm tra kỹ lưỡng các thay đổi của bạn
- Cập nhật tài liệu khi cần

## 📄 Giấy Phép

Dự án này được cấp phép theo Giấy phép MIT - xem tệp [LICENSE](LICENSE) để biết chi tiết.

## 🙏 Lời Cảm Ơn

- **Nhóm React** vì framework tuyệt vời
- **Firebase** vì các dịch vụ backend mạnh mẽ
- **Tailwind CSS** vì khung CSS ưu tiên tiện ích
- **Vite** vì công cụ xây dựng siêu nhanh
- **Font Awesome** vì các biểu tượng đẹp


