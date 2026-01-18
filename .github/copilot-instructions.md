# DigiBook AI Coding Instructions

You are an expert AI developer working on **DigiBook**, a modern bookstore application built with **React 19**, **Vite**, **Firebase (Firestore/Auth)**, and **Tailwind CSS**.



## 🏗️ Architecture & Service Boundaries

- **Database Logic**: All Firestore interactions must be centralized in [src/services/db.ts](src/services/db.ts). Use the exported `db` instance. Avoid raw Firebase calls in components.
- **Authentication**: Usage of [src/AuthContext.tsx](src/AuthContext.tsx) is preferred via the `useAuth()` hook for user state and auth actions (login, logout, wishlist).
- **Admin Hub**: Admin-specific components are isolated in [src/components/admin/](src/components/admin/). They follow a "Dashboard-as-Container" pattern where [src/pages/AdminDashboard.tsx](src/pages/AdminDashboard.tsx) coordinates them.
- **Error Handling**: Use `ErrorHandler.handle(error, context)` from [src/services/errorHandler.ts](src/services/errorHandler.ts) for all admin operations to ensure consistent logging to Firestore and user notifications via `react-hot-toast`.

##  Data Modeling & Types

- **Source of Truth**: All TypeScript interfaces are defined in [src/types.ts](src/types.ts). Always refer to this file when creating or modifying data models.
- **Key Models**:
    - `Book`: Includes metadata like `isbn`, `pages`, and `badge` (e.g., "Bán chạy").
    - `UserProfile`: Contains `role` ('admin' | 'user') and `status` ('active' | 'banned').
    - `Order`: Deeply nested object containing `customer`, `payment`, and `items`.
- **Dates**: Use Firestore `serverTimestamp()` for `createdAt`/`updatedAt` fields in mutations. Handle local display with `toDate()` or `toLocaleDateString()`.

##  Styling & UI Conventions

- **Tailwind CSS**: Use utility classes exclusively. Avoid custom CSS files unless absolutely necessary.
- **Icons**: Use **FontAwesome** classes (e.g., `fas fa-book`).
- **Feedback**: Use `react-hot-toast` for temporary feedback.
- **Badges**: Use consistent status ribbons for books:
    - [src/components/BookCard.tsx](src/components/BookCard.tsx): `badge` property handles "Bán chạy", "Kinh điển", etc.

##  Critical Workflows & Commands

- **Local Dev**: Run `npm run dev` to start the Vite server on port 5173 (standard) or 3000 (as per README).
- **Environment**: Firebase config requires `VITE_FIREBASE_*` variables in `.env`.
- **Logging**: For any significant data mutation in the Admin panel, call `db.logActivity(action, detail, status)` to maintain the system audit trail in the `system_logs` collection.

##  Common Pitfalls

- **Hardcoded Emails**: Do NOT hardcode admin emails. Use `user.role === 'admin'` check instead.
- **Firestore Persistence**: If you encounter `BloomFilterError`, clear IndexedDB persistence using `db.clearPersistence()` (exposed via `firebase.ts`).
- **Null Checks**: Always check `db_fs` and `auth` availability from `services/firebase.ts` before use, as initialization might fail due to missing environment variables.

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


## 🌐 Communication & Workflow

- **Language**: Always respond to the user in **Vietnamese**.
- **Execution**: For any task, first create a structured **TODO list** and execute it step-by-step. Use the `manage_todo_list` tool to track progress.
- **Validation**: Sau khi hoàn thành tất cả, kiểm tra lỗi 1 lần cuối trước khi chấm dứt tác vụ.