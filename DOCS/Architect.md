# Kiến trúc Hệ thống Dữ liệu DigiBook (Firestore)

Tài liệu này phác thảo cấu trúc cơ sở dữ liệu Firestore của ứng dụng DigiBook dựa trên phân tích mã nguồn từ `src/services/db.ts` và `src/types.ts`.

## 1. Danh sách các Collection chính

Hệ thống sử dụng các collection sau:

| Collection | Nội dung | Document ID |
|------------|----------|-------------|
| `users` | Thông tin người dùng và quyền hạn | Firebase UID |
| `books` | Danh mục sách | ISBN hoặc Google Books ID |
| `authors` | Thông tin tác giả | Generated ID (prefix `author-`) |
| `categories` | Danh mục sản phẩm | Tên Category (VD: "Kinh tế") |
| `orders` | Đơn hàng | Auto ID |
| `reviews` | Đánh giá sách | Auto ID |
| `coupons` | Mã giảm giá | Mã Code (Uppercase) |
| `system_logs` | Nhật ký hoạt động hệ thống | Auto ID |
| `ai_models` | Cấu hình các Model AI hỗ trợ | Model ID (VD: "gemini-2.5-flash-lite") |
| `system_configs` | Cấu hình toàn hệ thống | Config Key (VD: "ai_settings") |

---

## 2. Chi tiết cấu trúc dữ liệu

### 2.1. Collection: `users`
Lưu trữ hồ sơ người dùng.
- `id`: `string` (Firebase UID)
- `name`: `string`
- `email`: `string`
- `role`: `'admin' | 'user'` (Mặc định: 'user')
- `status`: `'active' | 'banned'` (Mặc định: 'active')
- `avatar`: `string` (URL)
- `phone`: `string` (Tùy chọn)
- `address`: `string` (Tùy chọn)
- `createdAt`: `serverTimestamp`
- `updatedAt`: `serverTimestamp`

### 2.2. Collection: `books`
Lưu trữ thông tin chi tiết về sách.
- `id`: `string` (ISBN)
- `title`: `string`
- `author`: `string` (Tên hiển thị)
- `authorId`: `string` (FK liên kết với `authors.id`)
- `category`: `string` (Tên danh mục)
- `price`: `number` (Giá hiện tại)
- `original_price`: `number` (Giá gốc, dùng để hiển thị giảm giá)
- `stock_quantity`: `number`
- `rating`: `number`
- `cover`: `string` (URL ảnh bìa)
- `description`: `string`
- `isbn`: `string`
- `pages`: `number`
- `publisher`: `string`
- `publishYear`: `number`
- `language`: `string`
- `badge`: `string` (Tùy chọn, VD: "Bán chạy")
- `updatedAt`: `serverTimestamp`

### 2.3. Collection: `authors`
Thông tin tác giả, được đồng bộ tự động khi thêm sách.
- `id`: `string`
- `name`: `string`
- `bio`: `string` (Mô tả tiểu sử)
- `avatar`: `string` (URL)
- `createdAt`: `serverTimestamp`

### 2.4. Collection: `orders`
Thông tin đơn đặt hàng.
- `id`: `string`
- `userId`: `string` (ID người dùng hoặc 'guest')
- `date`: `string` (Dạng DD/MM/YYYY)
- `status`: `string` (Trạng thái đơn hàng)
- `statusStep`: `number` (Bước quy trình đơn hàng)
- `customer`: `Object`
    - `name`, `phone`, `address`, `email`, `note`
- `payment`: `Object`
    - `method`, `subtotal`, `shipping`, `couponDiscount`, `total`
- `items`: `Array<OrderItem>`
    - `bookId`, `title`, `priceAtPurchase`, `quantity`, `cover`
- `createdAt`: `serverTimestamp`

### 2.5. Collection: `reviews`
Đánh giá và nhận xét từ độc giả.
- `bookId`: `string` (FK `books.id`)
- `userId`: `string` (FK `users.id`)
- `userName`: `string`
- `rating`: `number`
- `content`: `string`
- `isPurchased`: `boolean` (Xác nhận đã mua sách này chưa)
- `createdAt`: `serverTimestamp`

### 2.6. Collection: `coupons`
Quản lý mã giảm giá.
- `code`: `string` (Uppercase ID)
- `discountType`: `'percentage' | 'fixed'`
- `discountValue`: `number`
- `minOrderValue`: `number`
- `expiryDate`: `string` (YYYY-MM-DD)
- `usageLimit`: `number`
- `usedCount`: `number`
- `isActive`: `boolean`
- `updatedAt`: `serverTimestamp`

### 2.7. Collection: `system_logs`
Ghi lại mọi hoạt động quan trọng (Mutation) trên hệ thống Admin.
- `action`: `string` (VD: "SAVE_BOOK", "AUTH_LOGIN")
- `detail`: `string` (Mô tả chi tiết hoặc thông báo lỗi)
- `status`: `'SUCCESS' | 'ERROR'`
- `user`: `string` (Email người thực hiện)
- `createdAt`: `serverTimestamp`

### 2.8. Collection: `ai_models` & `system_configs`
Cấu hình khả năng tích hợp AI.
- `ai_models`: Chứa danh sách các Model hỗ trợ (Gemini, Groq, OpenRouter).
- `system_configs/ai_settings`: Lưu `activeModelId` đang được hệ thống sử dụng.

---

## 3. Quy tắc Ràng buộc & Logic Dữ liệu

1. **Quan hệ 1-N**: Một `Author` có nhiều `Book`. Khi thêm sách mới, hệ thống tự động kiểm tra và tạo `Author` nếu chưa tồn tại dựa trên tên.
2. **Toàn vẹn Kho**: Khi tạo `Order`, hệ thống trừ `stock_quantity` trong `books` tương ứng (sử dụng Firestore `increment(-quantity)`).
3. **Audit Trail**: Mọi thao tác lưu/xóa dữ liệu quan trọng đều phải gọi `db.logActivity()` để lưu vào `system_logs`.
4. **Xác thực**: Quyền quản trị dựa trên thuộc tính `role === 'admin'` trong document của `users`.
