# Kế Hoạch Cải Thiện DigiBook (Cập nhật 17/01/2026)

## Tổng Quan Hiện Tại
**Điểm đánh giá:** 7.5/10  
**Tình trạng:** Dự án đã có khung chức năng tốt (React 19, Vite, Firebase), giao diện hiện đại nhưng đang gặp vấn đề về khả năng mở rộng (scalability) và quản lý trạng thái tập trung.

---

## 1. Tối Ưu Hóa Hiệu Năng (Performance)

### 1.1. Chiến Lược Truy Vấn Dữ Liệu
*   **Vấn đề:** db.getBooks() đang tải TOÀN BỘ collection sách về client. Khi số lượng sách tăng lên 1000+, web sẽ bị treo.
*   **Giải pháp:** 
    *   Sử dụng Firestore Pagination (startAfter, limit).
    *   Thêm tính năng Infinite Scroll hoặc Phân trang thực tế thay vì client-side slicing.
    *   Tối ưu getRelatedBooks để chỉ fetch các field cần thiết.

### 1.2. State Management & Caching
*   **Vấn đề:** App.tsx đang quản lý quá nhiều state (cart, wishlist, allBooks, user).
*   **Giải pháp:** 
    *   Zustand: Tách cart và wishlist sang useCartStore và useWishlistStore. Điều này giúp code gọn hơn và dễ tái sử dụng.
    *   TanStack Query (React Query): Thay thế việc thủ công fetch dữ liệu trong useEffect. Nó sẽ tự động caching, xử lý trạng thái loading/error cho toàn bộ app.

### 1.3. Hình Ảnh & Tài Nguyên
*   **Giải pháp:** 
    *   Sử dụng định dạng WebP cho ảnh bìa sách.
    *   Thêm component SmartImage với placeholder màu sắc hoặc blur-up effect.
    *   Tối ưu hóa bundle size bằng cách kiểm tra các thư viện lớn qua rollup-plugin-visualizer.

---

## 2. Nâng Cấp Trải Nghiệm Người Dùng (UX)

### 2.1. Tìm Kiếm Thông Minh (AI & Search)
*   **Giải pháp:** 
    *   Sử dụng Debounce cho thanh tìm kiếm (hiện tại có vẻ đang kích hoạt search liên tục).
    *   Hiển thị kết quả tìm kiếm nhanh (Quick Suggestions).
    *   Tích hợp sâu hơn Admin AI để gợi ý sách dựa trên hành vi người dùng.

### 2.2. Giao Diện & Animation
*   **Giải pháp:** 
    *   Framer Motion: Thêm hiệu ứng chuyển trang (Page Transitions) và micro-interactions khi thêm vào giỏ hàng.
    *   Skeleton Standard: Tạo bộ Skeleton thống nhất cho BookCard, Category, Profile.
    *   Dark Mode: Triển khai giao diện tối hoàn chỉnh.

### 2.3. Quy Trình Thanh Toán (Checkout)
*   **Giải pháp:** 
    *   Thêm bước xác nhận địa chỉ qua bản đồ hoặc gợi ý địa chỉ (Google Maps API).
    *   Tích hợp đa dạng phương thức thanh toán trực tuyến (Momo, VNPay, Zalopay - giả lập hoặc thật).

---

## 3. Bảo Mật & Logic Hệ Thống

### 3.1. Phân Quyền (RBAC)
*   **Vấn đề:** Hardcoded check email admin trong code.
*   **Giải pháp:**
    *   Hoàn thiện chuyển đổi sang profile.role === 'admin'.
    *   Thiết lập Firestore Security Rules chặt chẽ, chỉ cho phép admin ghi vào collection books và system_logs.

### 3.2. Error Handling & Monitoring
*   **Giải pháp:**
    *   Tích hợp Sentry để theo dõi lỗi real-time từ phía người dùng.
    *   Hoàn thiện ErrorHandler để ghi log chi tiết mọi thao tác nhạy cảm của Admin.

---

## Lộ Trình Thực Hiện (TODO List)

1.  [ ] **Tuần 1: Cấu trúc & State**
    *   Cài đặt zustand và @tanstack/react-query.
    *   Refactor App.tsx: Tách logic auth, cart, wishlist sang hooks/stores.
2.  [ ] **Tuần 2: Database & Pagination**
    *   Cập nhật services/db.ts hỗ trợ phân trang.
    *   Cập nhật CategoryPage và HomePage để sử dụng Query hooks.
3.  [ ] **Tuần 3: UX/UI & AI**
    *   Thêm Framer Motion cho các tương tác chính.
    *   Cải thiện công cụ tìm kiếm với debounce và gợi ý.
4.  [ ] **Tuần 4: Testing & Security**
    *   Viết unit test cho logic giỏ hàng và thanh toán.
    *   Cấu hình Security Rules trên Firebase Console.

---
*Bản kế hoạch này được soạn thảo bởi GitHub Copilot nhằm tối ưu hóa DigiBook thành một nền tảng thương mại điện tử chuyên nghiệp.*
