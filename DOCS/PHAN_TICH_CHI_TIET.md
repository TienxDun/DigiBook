# Phân Tích Chi Tiết Dự Án DigiBook

Tài liệu này đi sâu vào kiến trúc phần mềm, luồng dữ liệu và đánh giá chất lượng mã nguồn (Code Review) của dự án DigiBook.

## 1. Kiến trúc Data Layer: Service Facade Pattern

Dự án sử dụng một mẫu thiết kế rất tốt cho lớp dữ liệu là **Facade Pattern**.

### Cấu trúc
Thay vì gọi trực tiếp các hàm từ nhiều file rải rác, toàn bộ thao tác database được tập trung vào `src/services/db/index.ts`.

*   **Modular Sub-services:** Các logic cụ thể được chia nhỏ vào các file con:
    *   `books.ts`: CRUD sách, tìm kiếm.
    *   `orders.ts`: Xử lý đơn hàng.
    *   `users.ts`: Profile người dùng.
    *   `ai.ts`, `system.ts`, `coupons.ts`: Các tính năng phụ trợ.
*   **Centralized Access:** Class `DataService` trong `index.ts` import và gộp tất cả các hàm này lại.
*   **Singleton:** Xuất ra một instance duy nhất `export const db = new DataService();`.

### Ưu điểm
*   **Dễ bảo trì:** Khi cần sửa logic "Lấy danh sách sách", chỉ cần sửa file `books.ts`.
*   **Dễ sử dụng:** Ở Component chỉ cần gọi `db.getBooks()` thay vì nhớ file nào chứa hàm nào.
*   **Decoupling:** Nếu sau này thay đổi từ Firebase sang REST API, chỉ cần viết lại các services trong `src/services/db/`, các Components không bị ảnh hưởng.

## 2. Luồng dữ liệu (Data Flow)

Luồng dữ liệu trong DigiBook tuân theo mô hình đơn chiều (Uni-directional flow) kết hợp với Context API.

```mermaid
graph TD
    Firebase[(Firestore)] <--> Service[Service Layer (db.*)]
    Service <--> Context[Context Providers (Auth, Book, Cart)]
    Context --> Component[UI Components]
    Component --Action--> Service
```

### Ví dụ: Luồng "Thêm vào giỏ hàng"
1.  **UI:** User click "Thêm vào giỏ" tại `BookDetails`.
2.  **Context:** Hàm `addToCart` trong `CartContext` được gọi.
3.  **Service (nếu đã login):** `CartContext` gọi `db.syncUserCart` để lưu giỏ hàng lên Firestore.
4.  **State Update:** `CartContext` cập nhật state `cartItems`.
5.  **UI Update:** Header (số lượng giỏ hàng) tự động render lại.

## 3. Quản lý trạng thái (State Management)

Dự án sử dụng **React Context API** chia theo domain:

1.  **AuthContext:**
    *   Quản lý `currentUser` (Firebase User) và `userProfile` (Custom DB Profile).
    *   Xử lý loading state toàn ứng dụng khi mới vào (`authLoading`).
2.  **CartContext:**
    *   Quản lý danh sách items trong giỏ.
    *   Tính toán tổng tiền (`subtotal`, `total`, `discount`).
    *   Logic đồng bộ giỏ hàng giữa LocalStorage (Guest) và Firestore (User).
3.  **BookContext:**
    *   Có vẻ được dùng để cache danh sách sách hoặc các filter, giúp tránh fetch lại data không cần thiết khi chuyển trang.

## 4. Routing & Performance

*   **Lazy Loading:** `src/App.tsx` sử dụng `React.lazy` và `Suspense` cho hầu hết các trang. Điều này giúp giảm `initial bundle size` đáng kể.
*   **Code Splitting:** File cấu hình `vite.config.ts` đã setup `manualChunks` để tách các thư viện nặng (Firebase, Framer Motion) ra khỏi main bundle -> Tối ưu tốc độ tải trang lần đầu.
*   **Admin Routes:** Được tách thành một chunk riêng (`AdminRoutes`), người dùng thường sẽ không bao giờ phải tải code của trang Admin.

## 5. Đánh giá Code (Code Review)

### Điểm mạnh
*   **Type Safety:** `src/types.ts` được định nghĩa rõ ràng. Các interface `Book`, `Order`, `User` bao quát đủ các trường dữ liệu.
*   **Clean Architecture:** Việc tách biệt UI (Components) và Logic (Services/Contexts) được thực hiện rất tốt.
*   **Modern Practices:** Sử dụng các hook hiện đại, functional components, và các thư viện mới nhất (React 19).
*   **PWA Ready:** Cấu hình Vite PWA rất chi tiết, hỗ trợ offline caching cho images và static assets.

### Điểm cần lưu ý / Cải thiện
1.  **Error Handling:**
    *   Cần kiểm tra xem trong `services`, các lỗi từ Firebase có được `try-catch` và trả về thông báo thân thiện người dùng không, hay chỉ `console.error`.
2.  **Validation:**
    *   Các form (Checkout, Login) nên sử dụng thư viện validate form (như `react-hook-form` + `zod`) để chặt chẽ hơn thay vì state thủ công.
3.  **Security Rules:**
    *   Vì logic nằm nhiều ở Client (Service Layer), cần đảm bảo **Firestore Security Rules** được cấu hình chặt chẽ để ngăn user thường gọi hàm admin (ví dụ: `updateUserRole`).
4.  **Hardcoded Strings:**
    *   Một số text thông báo có thể đang hardcode trong component. Nên cân nhắc tách ra file i18n hoặc constants nếu dự án muốn mở rộng đa ngôn ngữ sau này.

## 6. Kết luận
DigiBook là một dự án có nền tảng kỹ thuật vững chắc, cấu trúc code clear và dễ mở rộng. Việc áp dụng Facade Pattern cho Service Layer là điểm sáng lớn nhất giúp code sạch sẽ.

---
*Tài liệu phân tích chuyên sâu cho đội ngũ phát triển.*
