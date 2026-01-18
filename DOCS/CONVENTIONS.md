# Quy tắc đặt tên (Naming Convention) - DigiBook

Để đảm bảo tính thống nhất và dễ bảo trì, dự án DigiBook tuân thủ các quy tắc đặt tên sau:

## 1. Mã nguồn (Source Code)
- **Components**: `PascalCase` (vídụ: `BookCard.tsx`, `AdminDashboard.tsx`)
- **Hooks/Utilities/Services**: `camelCase` (ví dụ: `useAuth`, `db.ts`, `errorHandler.ts`)
- **Variables & Functions**: `camelCase` (ví dụ: `getBooks`, `totalPrice`)
- **Constants**: `UPPER_SNAKE_CASE` (ví dụ: `INITIAL_CATEGORIES`, `VITE_FIREBASE_API_KEY`)
- **Types/Interfaces**: `PascalCase` (ví dụ: `Book`, `UserProfile`)

## 2. Firestore (Database)
- **Collections**: `lowercase_plural` (ví dụ: `books`, `users`, `orders`, `system_logs`)
- **Sub-collections**: `lowercase_plural` (ví dụ: `books/{bookId}/reviews`)
- **Fields**: `camelCase` (ví dụ: `updatedAt`, `stockQuantity`, `originalPrice`)
    - *Lưu ý*: Chuyển đổi các trường cũ `stock_quantity` -> `stockQuantity`, `original_price` -> `originalPrice`.

## 3. CSS (Tailwind)
- Ưu tiên sử dụng utility classes của Tailwind.
- Nếu dùng class tùy chỉnh (hạn chế): `kebab-case`.

## 4. File & Folder
- Folders: `kebab-case` hoặc `lowercase`.
- Assets/Images: `kebab-case`.
