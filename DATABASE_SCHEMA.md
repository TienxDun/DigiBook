# Cấu trúc Dữ liệu DigiBook (Firestore NoSQL)

Hệ thống sử dụng **Google Cloud Firestore** - Cơ sở dữ liệu tài liệu (Document-oriented) linh hoạt, hỗ trợ thời gian thực.

## 1. Collections (Bộ sưu tập)

### Collection: `books`
Mỗi tài liệu đại diện cho một cuốn sách.
- `id`: String (Document ID - Thường là ISBN)
- `title`: String
- `author`: String (Tên tác giả hiển thị)
- `authorId`: String (Liên kết đến collection `authors`)
- `authorBio`: String (Mô tả ngắn về tác giả)
- `category`: String (Tên danh mục - Liên kết đến `categories`)
- `price`: Number (VND)
- `original_price`: Number (Giá trước giảm giá)
- `stock_quantity`: Number
- `rating`: Number (Điểm trung bình, từ 0-5)
- `cover`: String (URL hình ảnh từ Firebase Storage hoặc Google Books)
- `description`: String (Mô tả chi tiết cuốn sách)
- `isbn`: String (Mã số tiêu chuẩn quốc tế)
- `pages`: Number
- `publisher`: String
- `publishYear`: Number
- `language`: String (Mặc định: "Tiếng Việt")
- `badge`: String (Ví dụ: "Bán chạy", "Kinh điển", "Mới")
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Collection: `categories`
- `name`: String (Document ID - Duy nhất)
- `icon`: String (FontAwesome class, ví dụ: "fas fa-book")
- `description`: String

### Collection: `authors`
- `id`: String (Document ID)
- `name`: String
- `bio`: String (Tiểu sử tác giả)
- `avatar`: String (URL ảnh đại diện)
- `createdAt`: Timestamp

### Collection: `users`
Lưu thông tin chi tiết của người dùng đã đăng ký.
- `id`: String (Document ID - Trùng với Firebase Auth UID)
- `name`: String
- `email`: String (Duy nhất)
- `phone`: String (Tùy chọn)
- `address`: String (Tùy chọn)
- `avatar`: String (URL ảnh đại diện)
- `bio`: String (Giới thiệu bản thân)
- `gender`: String ("Nam", "Nữ", "Khác")
- `birthday`: String (Định dạng YYYY-MM-DD)
- `role`: String ("user", "admin")
- `status`: String ("active", "banned")
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Collection: `orders`
- `id`: String (Document ID)
- `userId`: String (ID người dùng đặt hàng)
- `status`: String ("Đang xử lý", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy")
- `statusStep`: Number (0-4 tương ứng với các trạng thái)
- `date`: String (Ngày đặt hàng định dạng vi-VN)
- `customer`: Object
    - `name`: String
    - `phone`: String
    - `address`: String
    - `email`: String
    - `note`: String (Ghi chú đơn hàng)
- `payment`: Object
    - `method`: String ("COD", "Chuyển khoản")
    - `subtotal`: Number (Tổng tiền hàng chưa giảm)
    - `shipping`: Number (Phí vận chuyển)
    - `couponDiscount`: Number (Tiền giảm giá từ coupon)
    - `total`: Number (Tổng tiền thanh toán cuối cùng)
- `items`: Array (Danh sách sản phẩm trong đơn)
    - `bookId`: String
    - `title`: String
    - `priceAtPurchase`: Number (Giá tại thời điểm mua)
    - `quantity`: Number
    - `cover`: String
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Collection: `reviews`
- `id`: String (Document ID)
- `bookId`: String (ID cuốn sách được đánh giá)
- `userId`: String (ID người đánh giá)
- `userName`: String (Tên hiển thị người đánh giá)
- `rating`: Number (Điểm đánh giá 1-5)
- `content`: String (Nội dung nhận xét)
- `createdAt`: Timestamp

### Collection: `coupons`
- `id`: String (Document ID - Chính là mã Code in hoa)
- `code`: String (Mã giảm giá)
- `discountType`: String ("percentage" hoặc "fixed")
- `discountValue`: Number (Giá trị giảm)
- `minOrderValue`: Number (Giá trị đơn hàng tối thiểu để áp dụng)
- `expiryDate`: String (Ngày hết hạn YYYY-MM-DD)
- `usageLimit`: Number (Giới hạn tổng số lần sử dụng)
- `usedCount`: Number (Số lần đã sử dụng thực tế)
- `isActive`: Boolean (Trạng thái kích hoạt)
- `updatedAt`: Timestamp

### Collection: `system_logs`
Nhật ký hoạt động của hệ thống (Admin).
- `id`: String (Document ID)
- `action`: String (Ví dụ: "SAVE_BOOK", "DELETE_ORDER")
- `detail`: String (Mô tả chi tiết hành động hoặc lỗi)
- `status`: String ("SUCCESS", "ERROR")
- `user`: String (Email người thực hiện hoặc "Anonymous")
- `createdAt`: Timestamp

### Collection: `system_configs`
Cấu hình các cài đặt hệ thống.
#### Document: `ai_settings`
- `activeModelId`: String (ID của AI model đang dùng, ví dụ: "gemini-1.5-flash")
- `updatedAt`: Timestamp
- `updatedBy`: String (Email admin)

## 2. Lưu trữ Local (Local Storage)
Một số dữ liệu không nhạy cảm được lưu tại trình duyệt để tăng trải nghiệm:
- `digibook_cart`: Danh sách giỏ hàng hiện tại.
- `digibook_wishlist`: Danh sách sản phẩm yêu thích của người dùng.

## 3. Quy tắc chỉ mục (Indexes)
Firestore mặc định tạo chỉ mục đơn cho từng trường. 
- **Chỉ mục tổ hợp (Composite Index):** Cần thiết cho các truy vấn phức tạp (ví dụ: lọc `status` và sắp xếp theo `createdAt`).

## 4. Bảo mật (Security Rules)
- `allow read`: Công khai cho hầu hết collection (trừ `system_logs`, `system_configs`).
- `allow write`: Chỉ cho phép người dùng có `role === admin`. Riêng `orders` và `reviews`, người dùng đăng nhập có thể tạo mới.
