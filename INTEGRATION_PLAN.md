# Kế hoạch Vận hành và Mở rộng DigiBook (Firebase Cloud)

Hệ thống đã loại bỏ các URL hình ảnh từ Unsplash để đảm bảo tính ổn định và chuyên nghiệp bằng cách sử dụng **Firebase Storage**.

## 1. Kiến trúc Quản lý Hình ảnh
- **Storage:** Sử dụng `Firebase Storage` để lưu trữ ảnh bìa sách và avatar tác giả.
- **Phân phối:** Hình ảnh được truy xuất thông qua `getDownloadURL()` của Firebase SDK.
- **Tối ưu:** Ảnh khi upload cần được nén và chuyển sang định dạng WebP để tăng tốc độ tải trang.

## 2. Các dịch vụ chính trong `services/db.ts`

### A. Quản lý Authentication
- Tích hợp Google OAuth2 và Email Auth.
- Session đồng bộ thời gian thực.

### B. Quản lý Kho sách (Firestore)
- **Trường `cover`:** Chứa URL trực tiếp dẫn tới tệp tin trong Firebase Storage.
- **Quy trình:** Khi thêm sách mới trong Admin Dashboard, ảnh sẽ được upload lên Storage trước, sau đó lưu URL trả về vào document của sách trong Firestore.

### C. Hệ thống Giao dịch (Orders)
- Sử dụng `writeBatch` để đảm bảo tính nhất quán dữ liệu giữa đơn hàng và tồn kho.

## 3. Lộ trình Triển khai Hình ảnh (Phase 2)

1. **Migration:** Tải các ảnh bìa hiện tại từ Unsplash xuống và upload lên thư mục `book-covers/` trên Firebase Console.
2. **Update Database:** Cập nhật lại trường `cover` trong collection `books` với link mới từ Firebase.
3. **Cloud Functions:** Thiết lập Function tự động tạo ảnh thu nhỏ (Thumbnail) khi có ảnh gốc được upload lên Storage để tiết kiệm băng thông.

## 4. Bảo trì và Sao lưu
- **Export Dữ liệu:** Backup định kỳ Firestore document sang JSON.
- **Storage Policy:** Thiết lập lifecycle để xóa các ảnh cũ không còn sử dụng trong database.