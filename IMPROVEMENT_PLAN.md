# K? Ho?ch C?i Thi?n DigiBook (C?p nh?t 17/01/2026)

##  T?ng Quan Hi?n T?i
**Ði?m dánh giá:** 7.5/10  
**Tình tr?ng:** D? án dã có khung ch?c nang t?t (React 19, Vite, Firebase), giao di?n hi?n d?i nhung dang g?p v?n d? v? kh? nang m? r?ng (scalability) và qu?n lý tr?ng thái t?p trung.

---

##  1. T?i Uu Hóa Hi?u Nang (Performance)

### 1.1. Chi?n Lu?c Truy V?n D? Li?u
*   **V?n d?:** `db.getBooks()` dang t?i TOÀN B? collection sách v? client. Khi s? lu?ng sách tang lên 1000+, web s? b? treo.
*   **Gi?i pháp:** 
    *   S? d?ng **Firestore Pagination** (startAfter, limit).
    *   Thêm tính nang **Infinite Scroll** ho?c **Phân trang th?c t?** thay vì client-side slicing.
    *   T?i uu `getRelatedBooks` d? ch? fetch các field c?n thi?t.

### 1.2. State Management & Caching
*   **V?n d?:** `App.tsx` dang qu?n lý quá nhi?u state (`cart`, `wishlist`, `allBooks`, `user`).
*   **Gi?i pháp:** 
    *   **Zustand**: Tách `cart` và `wishlist` sang `useCartStore` và `useWishlistStore`. Ði?u này giúp code g?n hon và d? tái s? d?ng.
    *   **TanStack Query (React Query)**: Thay th? vi?c th? công fetch d? li?u trong `useEffect`. Nó s? t? d?ng caching, x? lý tr?ng thái loading/error cho toàn b? app.

### 1.3. Hình ?nh & Tài Nguyên
*   **Gi?i pháp:** 
    *   S? d?ng d?nh d?ng **WebP** cho ?nh bìa sách.
    *   Thêm component `SmartImage` v?i placeholder màu s?c ho?c blur-up effect.
    *   T?i uu hóa bundle size b?ng cách ki?m tra các thu vi?n l?n qua `rollup-plugin-visualizer`.

---

##  2. Nâng C?p Tr?i Nghi?m Ngu?i Dùng (UX)

### 2.1. Tìm Ki?m Thông Minh (AI & Search)
*   **Gi?i pháp:** 
    *   S? d?ng **Debounce** cho thanh tìm ki?m (hi?n t?i có v? dang kích ho?t search liên t?c).
    *   Hi?n th? k?t qu? tìm ki?m nhanh (Quick Suggestions).
    *   Tích h?p sâu hon Admin AI d? g?i ý sách d?a trên hành vi ngu?i dùng.

### 2.2. Giao Di?n & Animation
*   **Gi?i pháp:** 
    *   **Framer Motion**: Thêm hi?u ?ng chuy?n trang (Page Transitions) và micro-interactions khi thêm vào gi? hàng.
    *   **Skeleton Standard**: T?o b? Skeleton th?ng nh?t cho BookCard, Category, Profile.
    *   **Dark Mode**: Tri?n khai giao di?n t?i hoàn ch?nh.

### 2.3. Quy Trình Thanh Toán (Checkout)
*   **Gi?i pháp:** 
    *   Thêm bu?c xác nh?n d?a ch? qua b?n d? ho?c g?i ý d?a ch? (Google Maps API).
    *   Tích h?p da d?ng phuong th?c thanh toán tr?c tuy?n (Momo, VNPay, Zalopay - gi? l?p ho?c th?t).

---

##  3. B?o M?t & Logic H? Th?ng

### 3.1. Phân Quy?n (RBAC)
*   **V?n d?:** Hardcoded check email admin trong code.
*   **Gi?i pháp:**
    *   Hoàn thi?n chuy?n d?i sang `profile.role === 'admin'`.
    *   Thi?t l?p **Firestore Security Rules** ch?t ch?, ch? cho phép admin ghi vào collection `books` và `system_logs`.

### 3.2. Error Handling & Monitoring
*   **Gi?i pháp:**
    *   Tích h?p **Sentry** d? theo dõi l?i real-time t? phía ngu?i dùng.
    *   Hoàn thi?n `ErrorHandler` d? ghi log chi ti?t m?i thao tác nh?y c?m c?a Admin.

---

##  L? Trình Th?c Hi?n (TODO List)

1.  [ ] **Tu?n 1: C?u trúc & State**
    *   Cài d?t `zustand` và `@tanstack/react-query`.
    *   Refactor `App.tsx`: Tách logic auth, cart, wishlist sang hooks/stores.
2.  [ ] **Tu?n 2: Database & Pagination**
    *   C?p nh?t `services/db.ts` h? tr? phân trang.
    *   C?p nh?t `CategoryPage` và `HomePage` d? s? d?ng Query hooks.
3.  [ ] **Tu?n 3: UX/UI & AI**
    *   Thêm Framer Motion cho các tuong tác chính.
    *   C?i thi?n công c? tìm ki?m v?i debounce và g?i ý.
4.  [ ] **Tu?n 4: Testing & Security**
    *   Vi?t unit test cho logic gi? hàng và thanh toán.
    *   C?u hình Security Rules trên Firebase Console.

---
*B?n k? ho?ch này du?c so?n th?o b?i GitHub Copilot nh?m t?i uu hóa DigiBook thành m?t n?n t?ng thuong m?i di?n t? chuyên nghi?p.*
