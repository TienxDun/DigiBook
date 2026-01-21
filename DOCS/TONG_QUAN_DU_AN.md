# Tổng Quan Dự Án DigiBook

## 1. Giới thiệu
DigiBook là một ứng dụng web thương mại điện tử chuyên về sách (Modern Bookstore). Dự án được xây dựng theo kiến trúc Single Page Application (SPA) hiện đại, tập trung vào trải nghiệm người dùng mượt mà (Animations, Transitions) và hiệu năng cao.

## 2. Công nghệ sử dụng (Tech Stack)

### Core
*   **Framework:** [React 19](https://react.dev/) - Thư viện UI cốt lõi.
*   **Build Tool:** [Vite 6](https://vitejs.dev/) - Công cụ build siêu tốc.
*   **Ngôn ngữ:** [TypeScript 5](https://www.typescriptlang.org/) - Đảm bảo type safety.

### UI & Styling
*   **Styling:** [Tailwind CSS 3](https://tailwindcss.com/) - Utility-first CSS framework.
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) - Thư viện chuyển động mạnh mẽ cho React.
*   **Notifications:** `react-hot-toast` - Thông báo dạng toast nhẹ nhàng.
*   **Icons & Maps:** `react-leaflet` (Bản đồ), `lucide-react` (Icons - dự đoán dựa trên code common).

### State Management & Data
*   **State:** React Context API (Auth, Cart, Books).
*   **Database & Auth:** [Firebase](https://firebase.google.com/) (Firestore, Auth).
*   **Data Layer Pattern:** Facade Service Pattern (Xem chi tiết ở phần phân tích chi tiết).

### Khác
*   **PWA:** `vite-plugin-pwa` - Hỗ trợ Progressive Web App (Offline mode, installable).
*   **Routing:** `react-router-dom` v6.

## 3. Cấu trúc thư mục

```
src/
├── components/         # Các thành phần UI tái sử dụng
│   ├── admin/          # Components dành riêng cho trang Admin
│   ├── books/          # Components liên quan đến hiển thị sách
│   └── ...             # Các component chung (Header, Footer, Layout...)
├── constants/          # Các hằng số (AI models, Categories...)
├── contexts/           # React Contexts (Global State)
│   ├── AuthContext.tsx # Quản lý trạng thái đăng nhập
│   ├── CartContext.tsx # Quản lý giỏ hàng
│   └── BookContext.tsx # Quản lý dữ liệu sách toàn cục
├── pages/              # Các trang chính của ứng dụng (Route views)
│   ├── AdminDashboard.tsx
│   ├── HomePage.tsx
│   └── ...
├── routes/             # Định nghĩa routing (đặc biệt là AdminRoutes)
├── services/           # Lớp giao tiếp dữ liệu & logic nghiệp vụ
│   ├── db/             # Các module xử lý DB chi tiết (modular)
│   │   ├── books.ts
│   │   ├── users.ts
│   │   └── index.ts    # Facade entry point
│   └── firebase.ts     # Cấu hình Firebase
├── types.ts            # Định nghĩa TypeScript Types/Interfaces toàn cục
├── App.tsx             # Root Component, setup Routing & Providers
└── main.tsx            # Entry point
```

## 4. Các luồng chính

### Client (Người dùng)
*   **Khám phá:** Trang chủ, Tìm kiếm, Danh mục, Chi tiết sách.
*   **Mua hàng:** Giỏ hàng -> Checkout -> Order Success.
*   **Cá nhân:** Profile, Lịch sử đơn hàng, Wishlist.

### Admin (Quản trị)
*   **Dashboard:** Tổng quan thống kê.
*   **Quản lý:** Sách, Đơn hàng, Người dùng, Mã giảm giá.
*   **Hệ thống:** Logs, AI Config.

## 5. Scripts (package.json)

*   `npm run dev`: Chạy server phát triển (localhost:3000).
*   `npm run build`: Đóng gói ứng dụng cho production.
*   `npm run preview`: Xem trước bản build production.

---
*Tài liệu được tạo tự động bởi AI Assistant nhằm mục đích onboarding và review code.*
