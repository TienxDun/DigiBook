# Cấu trúc Dữ liệu DigiBook (Firestore NoSQL)

Hệ thống sử dụng **Google Cloud Firestore** - Cơ sở dữ liệu tài liệu (Document-oriented) linh hoạt, hỗ trợ thời gian thực.

## 1. Collections (Bộ sưu tập)

### Collection: `books`
Mỗi tài liệu đại diện cho một cuốn sách.
- `id`: String (Document ID)
- `title`: String
- `author`: String (Tên hiển thị)
- `authorId`: String (Liên kết đến collection `authors`)
- `category`: String (Tên danh mục)
- `price`: Number
- `original_price`: Number (Tùy chọn)
- `stock_quantity`: Number
- `rating`: Number (Điểm trung bình)
- `cover`: String (Đường dẫn URL từ Firebase Storage - Thay thế hoàn toàn Unsplash)
- `description`: String
- `isbn`: String
- `pages`: Number
- `publisher`: String
- `publishYear`: Number
- `language`: String
- `badge`: String (Ví dụ: "Bán chạy", "Kinh điển")
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Collection: `categories`
- `name`: String (Document ID - Duy nhất)
- `icon`: String (FontAwesome class)
- `description`: String

### Collection: `authors`
- `id`: String (Document ID)
- `name`: String
- `bio`: String
- `avatar`: String (URL từ Firebase Storage)

### Collection: `orders`
- `id`: String (Document ID)
- `userId`: String
- `status`: String ("Đang xử lý", "Đã giao",...)
- `statusStep`: Number (0-3)
- `date`: String (Ngày hiển thị)
- `customer`: Object { name, phone, address, email }
- `payment`: Object { method, subtotal, shipping, couponDiscount, total }
- `items`: Array [ { bookId, title, priceAtPurchase, quantity, cover } ]
- `createdAt`: Timestamp

### Collection: `reviews`
- `id`: String (Document ID)
- `bookId`: String (Index lọc)
- `userId`: String
- `userName`: String
- `rating`: Number
- `content`: String
- `createdAt`: Timestamp

### Collection: `system_logs`
- `action`: String
- `detail`: String
- `status`: String ("SUCCESS", "ERROR")
- `user`: String (Email)
- `createdAt`: Timestamp

## 2. Quy tắc chỉ mục (Indexes)
Firestore mặc định tạo chỉ mục đơn cho từng trường. 
- **Chỉ mục tổ hợp (Composite Index):** Cần thiết khi thực hiện truy vấn lọc theo một trường và sắp xếp theo trường khác.

## 3. Bảo mật (Security Rules)
- `allow read`: Công khai cho mọi người.
- `allow write`: Chỉ cho phép người dùng Admin (kiểm tra email `admin@gmail.com`).