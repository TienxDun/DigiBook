<!-- markdownlint-disable MD022 MD032 -->

# Đặc Tả Kỹ Thuật DigiBook

**Phiên bản**: 1.0  
**Ngày cập nhật**: 2026-03-03  
**Phạm vi phân tích**: Toàn bộ workspace hiện tại của dự án DigiBook

---

## 1) Mục tiêu hệ thống

DigiBook là nền tảng thương mại điện tử sách trực tuyến, tập trung vào:
- Trải nghiệm mua sách cho người dùng cuối (catalog, tìm kiếm, giỏ hàng, checkout, đơn hàng).
- Hệ quản trị vận hành cho admin (quản lý kho sách, danh mục, tác giả, coupon, người dùng, đơn hàng, log hệ thống, analytics).
- Khả năng chạy với **2 chế độ backend**:
  - Truy cập trực tiếp Firebase (Firestore/Auth).
  - Qua REST API backend (bật bằng feature flag môi trường).

---

## 2) Công nghệ & phụ thuộc chính

### Frontend
- React 19.2 + TypeScript 5.8
- Vite 6.2
- React Router 6.22 (HashRouter)
- Tailwind CSS 3.4
- Framer Motion (animation)
- Recharts (dashboard/analytics)
- React Hot Toast (feedback UI)

### Backend/Storage (theo mode)
- Firebase Auth
- Firestore
- Firebase Storage (asset URL cache qua PWA workbox)
- REST API client bằng Axios (khi `VITE_USE_API=true`)

### Testing
- Vitest + Testing Library + jsdom

---

## 3) Kiến trúc tổng thể

## 3.1 Cấu trúc thư mục logic
- `src/features/*`: tổ chức theo tính năng (admin, auth, books, cart, orders).
- `src/services/*`: business logic và data access.
- `src/shared/*`: component dùng chung, type, utils, config.
- `src/layouts/*`: lớp layout và route-guard cấp ứng dụng.
- `src/lib/firebase.ts`: bootstrap Firebase và export API Firebase dùng chung.

## 3.2 Pattern kiến trúc
- **Feature-Based Architecture**: mỗi miền nghiệp vụ có component/context/page riêng.
- **Service Layer Pattern**: UI gọi `db` facade thay vì thao tác Firestore trực tiếp.
- **Adapter Pattern** (`src/services/db/adapter.ts`): chuyển đổi giữa API mode và Firebase mode.
- **Context API** cho trạng thái ứng dụng:
  - `AuthProvider`
  - `BookProvider`
  - `CartProvider`

## 3.3 Luồng dữ liệu chuẩn
`Component -> Hook/Context -> db facade -> adapter/module service -> Firestore hoặc REST API`

---

## 4) Entry point, routing và lifecycle

## 4.1 Entry point
- `src/index.tsx`:
  - Khởi tạo Provider stack: `HelmetProvider -> AuthProvider -> BookProvider -> CartProvider -> App`.
  - Đăng ký Service Worker (PWA, auto-update).

## 4.2 Router
- Dùng `HashRouter` trong `src/App.tsx` để tương thích hosting tĩnh.
- Route chính:
  - Public: `/`, `/book/:slug`, `/search/:query`, `/category/:categoryName`, `/authors`, `/author/:authorName`, `/wishlist`, `/checkout`, `/order-success`, `/my-orders`, `/my-orders/:orderId`, `/profile`.
  - Admin: `/admin/*` với guard `AdminRoute`.
- Mọi route không hợp lệ redirect về `/`.

## 4.3 Lazy loading
- Hầu hết page dùng `React.lazy` + `Suspense` để giảm bundle initial.
- Admin routes tách chunk độc lập.

---

## 5) Đặc tả module nghiệp vụ

## 5.1 Auth module
- Context: `src/features/auth/contexts/AuthContext.tsx`.
- Chức năng:
  - Đăng nhập Google / email-password.
  - Đăng ký tài khoản email-password.
  - Đổi mật khẩu, quên mật khẩu.
  - Đồng bộ hồ sơ user với collection `users`.
  - Chặn đăng nhập khi `status='banned'`.
  - Đồng bộ wishlist local <-> cloud.
- `isAdmin` được suy ra từ `role` trong profile Firestore.

## 5.2 Books module
- Context: `src/features/books/contexts/BookContext.tsx`.
- Chức năng:
  - Tải danh sách sách phân trang (`getBooksPaginated`).
  - Tải danh mục sách.
  - Hỗ trợ quick view, chi tiết sách, trang theo category/author.
- Service sách (Firebase mode):
  - `saveBook` tự tạo `slug`, `searchKeywords`, set `updatedAt`.
  - Có Tiki integration qua proxy (`searchBooksFromTiki`).

## 5.3 Cart module
- Context: `src/features/cart/contexts/CartContext.tsx`.
- Chức năng:
  - Lưu localStorage (`digibook_cart`).
  - Merge cart local/cloud khi user đăng nhập.
  - Đồng bộ `userCarts` khi cart thay đổi.
  - Kiểm tra tồn kho trước khi thêm/tăng số lượng (`checkBookStock`).
  - Chọn/bỏ chọn item để checkout.

## 5.4 Orders module
- Chức năng người dùng:
  - Tạo đơn từ checkout.
  - Xem danh sách đơn và chi tiết đơn.
- Service orders (Firebase mode):
  - Tạo đơn bằng transaction:
    - đọc tồn kho,
    - validate đủ hàng,
    - trừ kho,
    - ghi order + items.
  - Cập nhật trạng thái đơn (`status`, `statusStep`, `updatedAt`).

## 5.5 Admin module
- Trang điều phối: `src/features/admin/pages/AdminDashboard.tsx`.
- Các tab chính:
  - Overview/Analytics
  - Books
  - Orders
  - Categories
  - Authors
  - Coupons
  - Users
  - Logs
  - Tiki Inspector
- Đặc điểm:
  - Tải dữ liệu tổng hợp từ `db`.
  - Có phân trang log kiểu “load more”.
  - Có đổi theme quản trị và responsive sidebar.

---

## 6) Service layer và adapter mode

## 6.1 `db` facade
`src/services/db/index.ts` gom toàn bộ operation nghiệp vụ thành một interface thống nhất cho UI.

## 6.2 API/Firebase switch
- Cờ môi trường: `VITE_USE_API`.
- `adapter.ts` quyết định route call:
  - `true`: gọi các `*.api.ts` qua Axios.
  - `false`: gọi các `modules/*.service.ts` Firebase.
- Một số nghiệp vụ vẫn giữ Firebase-only khi API chưa parity đầy đủ (ví dụ một số truy vấn phức tạp/pagination specific).

## 6.3 Logging & error
- `core.logActivity()` ghi console log chuẩn hóa + ghi `system_logs` có điều kiện theo level/category.
- `ErrorHandler.handle(error, context)`:
  - map thông báo lỗi thân thiện người dùng,
  - hiển thị toast,
  - log lỗi lên hệ thống.

---

## 7) Mô hình dữ liệu

## 7.1 Kiểu dữ liệu TypeScript (nguồn sự thật)
Nằm tại `src/shared/types/index.ts`:
- `Book`
- `UserProfile`
- `Order`, `OrderItem`
- `Review`
- `Coupon`
- `SystemLog`
- `Author`, `CategoryInfo`, `Address`, `CartItem`

## 7.2 Firestore collections chính
- `users`
- `books`
- `books/{bookId}/reviews`
- `orders`
- `userCarts`
- `categories`
- `authors`
- `coupons`
- `system_logs`

## 7.3 Quy ước dữ liệu
- Field dùng `camelCase`.
- Collection/sub-collection dùng `lowercase_plural`.
- Timestamp mutation ưu tiên `serverTimestamp()`.

---

## 8) Bảo mật và phân quyền

## 8.1 Firestore Security Rules
- User chỉ đọc/sửa hồ sơ của chính mình (trừ admin).
- User không tự nâng quyền `role` hay đổi `status`.
- `books` đọc công khai; ghi chủ yếu cho admin; user chỉ được update các field giới hạn (`stockQuantity`, `viewCount`, `rating`, `reviewCount`).
- `orders`:
  - user tạo đơn cho chính mình,
  - user đọc đơn của mình,
  - update/delete chỉ admin.
- `system_logs`: admin đọc; create mở để phục vụ logging từ client.

## 8.2 App-level guard
- Route admin được khóa bằng `AdminRoute` (dựa trên `user.isAdmin`).
- AuthContext chặn user bị `banned` ngay sau đăng nhập.

---

## 9) Hiệu năng, build và deploy

## 9.1 Hiệu năng
- Route-level lazy loading.
- Vite `manualChunks` cho Firebase, Framer Motion, Router, Toast.
- Pagination sách ở tầng context (`BookContext`).
- PWA Workbox runtime cache cho ảnh Firebase Storage và nguồn external.

## 9.2 Build/runtime config
- `vite.config.ts`:
  - `base: '/DigiBook/'` (GitHub Pages).
  - Dev server port 3000.
  - Proxy `/api/nominatim` cho OpenStreetMap Nominatim.

## 9.3 Deploy
- Build output: `dist/`.
- Router dùng HashRouter phù hợp static hosting.

---

## 10) Biến môi trường

### Bắt buộc (Firebase)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Tùy chọn (API mode)
- `VITE_USE_API` (`true`/`false`)
- `VITE_API_BASE_URL`
- `VITE_API_TIMEOUT`

---

## 11) Testing strategy hiện trạng

- Framework: Vitest.
- Đã có thiết lập test với jsdom và Testing Library.
- Nên ưu tiên test ở các lớp:
  - context logic (Auth/Cart/Books),
  - service adapter,
  - utility formatting,
  - component critical flows (checkout, admin actions).

---

## 12) Rủi ro kỹ thuật & ghi chú

1. **Tài liệu chưa đồng bộ hoàn toàn**: README tham chiếu `DOCS/DATABASE_SCHEMA.md` nhưng file chưa tồn tại.
2. **Dual backend complexity**: API mode và Firebase mode cần theo dõi parity tính năng để tránh lệch hành vi.
3. **Client-side log create mở**: collection `system_logs` cho phép create từ mọi client; cần kiểm soát volume/chống spam ở lớp vận hành.
4. **Một số kiểu dữ liệu thời gian đang mixed** (`date` string + `createdAt` timestamp), cần chuẩn hóa dần.

---

## 13) Đề xuất kỹ thuật giai đoạn tiếp theo

1. Bổ sung tài liệu schema chính thức (`DOCS/DATABASE_SCHEMA.md`) được generate từ source type + rules.
2. Xây test integration cho adapter để đảm bảo parity API/Firebase mode.
3. Chuẩn hóa contract timestamp (`createdAt`, `updatedAt`) xuyên suốt modules.
4. Tách dashboard admin thành các sub-container nhỏ hơn để giảm độ phức tạp của `AdminDashboard.tsx`.

---

## 14) Kết luận

DigiBook đã có nền tảng kỹ thuật tốt theo hướng scalable frontend (feature-based + service layer + adapter mode). Hệ thống phù hợp mở rộng thêm nghiệp vụ e-commerce và có sẵn lớp quản trị vận hành. Trọng tâm tối ưu tiếp theo là: đồng bộ tài liệu-schema, kiểm soát parity giữa 2 backend mode và nâng độ phủ test cho các luồng quan trọng.
