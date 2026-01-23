# 🏛️ Kiến Trúc DigiBook

## 📐 Cấu Trúc Thư Mục

```
src/
├── features/              # Feature modules (admin, auth, books, cart, orders)
│   └── [feature]/
│       ├── components/    # Feature-specific UI
│       ├── contexts/      # State management
│       ├── pages/         # Route pages
│       └── index.ts       # Public exports
│
├── services/              # Business logic
│   ├── db/
│   │   ├── modules/       # books.service.ts, orders.service.ts, etc.
│   │   └── index.ts       # Exported db instance
│   └── errorHandler.ts
│
├── shared/                # Shared resources
│   ├── components/        # Reusable UI (Button, Modal, Pagination)
│   ├── hooks/             # Custom hooks
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Helpers (format, toast)
│   └── config/            # App configuration
│
└── layouts/               # Page layouts (Header, Footer, AdminLayout)
```

## 🎯 Design Patterns

**Feature-Based Architecture**: Mỗi feature độc lập với components/contexts/pages riêng

**Service Layer**: Tập trung business logic trong `services/db/modules/`

**Context API**: Global state (Auth, Cart, Books)

**Component Patterns**:
- Container/Presentation
- Compound Components
- Custom Hooks for logic reuse

## 🔄 Data Flow

```
Component → Hook (useAuth, useCart) → Context → Service (db.*) → Firestore
```

## 🔐 Security

- **Client-side**: Protected Routes (role check)
- **Service layer**: Role validation
- **Database**: Firestore Security Rules

## ⚡ Performance

- Code Splitting: `React.lazy()` cho routes
- Memoization: `React.memo()`, `useMemo()`, `useCallback()`
- Firestore: Indexes, batch operations, offline persistence
