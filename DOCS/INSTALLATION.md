# 🚀 Cài Đặt Nhanh

## Yêu Cầu

- Node.js 18+
- npm 9+

## Bước 1: Clone & Install

```bash
git clone https://github.com/tienxdun/DigiBook.git
cd DigiBook
npm install
```

## Bước 2: Firebase Setup

1. Tạo Firebase project tại [console.firebase.google.com](https://console.firebase.google.com)
2. Kích hoạt: **Authentication** (Email/Password, Google), **Firestore**, **Storage**
3. Copy Firebase config

## Bước 3: Environment Variables

Tạo file `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Bước 4: Firestore Security Rules

Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /books/{bookId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || isAdmin();
    }

    match /orders/{orderId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }

    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId || isAdmin();
    }

    match /{collection}/{document} {
      allow read: if collection in ['categories', 'authors', 'coupons'];
      allow write: if isAdmin();
    }

    match /system_logs/{logId} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Bước 5: Chạy

```bash
npm run dev          # http://localhost:5173
npm run build        # Production build
npm run test         # Run tests
```

## Tạo Admin User

**Cách 1**: Firebase Console → Authentication → Add user → Firestore → users collection → thêm field `role: "admin"`

**Cách 2**: Sau khi đăng ký user đầu tiên, vào Firestore → `users/{userId}` → Edit → thêm `role: "admin"`

## Troubleshooting

**Lỗi Firebase API key**: Kiểm tra `.env` có prefix `VITE_` và restart dev server

**Lỗi permission denied**: Kiểm tra Firestore Rules đã deploy chưa

**Port 5173 đã dùng**: Đổi port trong `vite.config.ts` hoặc kill process cũ
