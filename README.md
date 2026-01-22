# DigiBook - Nền Tảng Thương Mại Điện Tử Sách Hiện Đại 📚

Chào mừng đến với **DigiBook**, một dự án thương mại điện tử chuyên về sách được xây dựng với công nghệ web hiện đại nhất. Dự án này không chỉ là một trang web bán hàng mà còn là minh chứng cho khả năng xây dựng ứng dụng web hiệu suất cao, giao diện và trải nghiệm người dùng (UI/UX) tối ưu, cùng cấu trúc code clean và dễ bảo trì.

![DigiBook Banner](https://via.placeholder.com/1200x400?text=DigiBook+Showcase)
*(Bạn có thể thay thế bằng ảnh chụp màn hình thực tế của dự án)*

## 🚀 Tổng Quan Dự Án

DigiBook được thiết kế để giải quyết bài toán mua sắm trực tuyến với trải nghiệm mượt mà, tốc độ tải trang nhanh và giao diện thân thiện. Hệ thống bao gồm hai phân hệ chính:
1.  **Storefront (Client)**: Giao diện mua sắm cho người dùng cuối với các tính năng tìm kiếm, giỏ hàng, đặt hàng.
2.  **Admin Dashboard**: Hệ thống quản trị mạnh mẽ cho phép quản lý sách, đơn hàng, người dùng và xem báo cáo thống kê.

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

Dự án áp dụng bộ công nghệ "xương sống" mạnh mẽ và phổ biến nhất hiện nay trong cộng đồng React:

-   **Core**: [React 19](https://react.dev/) - Phiên bản mới nhất của React với hiệu năng vượt trội.
-   **Language**: [TypeScript](https://www.typescriptlang.org/) - Đảm bảo tính chặt chẽ của dữ liệu (Type Safety) và giảm thiểu lỗi runtime.
-   **Build Tool**: [Vite](https://vitejs.dev/) - Tốc độ khởi động server và HMR (Hot Module Replacement) cực nhanh.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Thiết kế giao diện nhanh chóng, responsive và dễ tùy biến.
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Auth) - Giải pháp Serverless cho xác thực và cơ sở dữ liệu thời gian thực.
-   **Routing**: [React Router DOM](https://reactrouter.com/) - Quản lý điều hướng trang SPA (Single Page Application).
-   **Animation**: [Framer Motion](https://www.framer.com/motion/) - Tạo các hiệu ứng chuyển động mượt mà, nâng cao UX.
-   **Maps**: [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/) - Tích hợp bản đồ tương tác.
-   **Charts**: [Recharts](https://recharts.org/) - Biểu đồ thống kê trực quan cho Admin.
-   **Testing**: [Vitest](https://vitest.dev/) & React Testing Library - Đảm bảo chất lượng code.

## ✨ Tính Năng Nổi Bật

### 🛒 Phía Người Dùng (Client)
-   **Trải nghiệm mua sắm mượt mà**: Giao diện Responsive được tối ưu cho cả Mobile và Desktop.
-   **Tìm kiếm & Lọc sách**: Tìm kiếm sách theo tên, tác giả, danh mục nhanh chóng.
-   **Giỏ hàng động**: Thêm/sửa/xóa sản phẩm trong giỏ hàng với cập nhật thời gian thực.
-   **Quy trình thanh toán (Checkout)**: Quy trình đặt hàng đơn giản, rõ ràng.
-   **Bản đồ cửa hàng**: Tích hợp bản đồ để người dùng tìm cửa hàng thực tế.

### 🛡 Phía Quản Trị (Admin Dashboard)
-   **Dashboard trực quan**: Biểu đồ thống kê doanh thu, số lượng đơn hàng (sử dụng Recharts).
-   **Quản lý sản phẩm**: Thêm, sửa, xóa sách, quản lý tồn kho.
-   **Quản lý đơn hàng**: Theo dõi trạng thái đơn hàng, xử lý đơn đặt hàng.
-   **Quản lý người dùng**: Phân quyền và quản lý tài khoản khách hàng.

## 📂 Cấu Trúc Dự Án (Architectural Highlights)

Dự án được tổ chức theo cấu trúc **Feature-based**, giúp code dễ đọc, dễ mở rộng và bảo trì (Scalable & Maintainable):

```bash
src/
├── features/           # Các module chức năng chính (Books, Cart, Auth, Admin,...)
│   ├── auth/           # Login, Register
│   ├── books/          # Book list, detail
│   ├── cart/           # Shopping cart logic
│   └── admin/          # Admin dashboard features
├── services/           # Xử lý logic gọi API, Firebase, Maps
├── shared/             # Các thành phần dùng chung
│   ├── components/     # UI Components (Button, Input, Layouts...)
│   ├── hooks/          # Custom Hooks
│   └── utils/          # Helper functions
├── layouts/            # Các layout chính (MainLayout, AdminLayout)
└── ...
```

## 🔧 Hướng Dẫn Cài Đặt (Setup Guide)

Để chạy dự án này trên máy local của bạn, hãy làm theo các bước sau:

**Yêu cầu**: Node.js (phiên bản 18+ khuyến nghị).

1.  **Clone repository vể máy:**
    ```bash
    git clone https://github.com/TienxDun/DigiBook.git
    cd DigiBook
    ```

2.  **Cài đặt các dependencies:**
    ```bash
    npm install
    ```

3.  **Cấu hình biến môi trường:**
    Tạo file `.env` tại thư mục gốc và điền các thông tin cấu hình Firebase của bạn (tham khảo `.env.example` nếu có):
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    ...
    ```

4.  **Khởi chạy dự án (Development Mode):**
    ```bash
    npm run dev
    ```
    Truy cập `http://localhost:5173` để xem kết quả.

5.  **Build cho Production:**
    ```bash
    npm run build
    ```

## 👨‍💻 Tác Giả

Dự án được phát triển bởi **[TienxDun]**.

---
*Cảm ơn đã ghé thăm DigiBook! Dự án này thể hiện niềm đam mê của tôi với việc xây dựng các sản phẩm web chất lượng cao.*
