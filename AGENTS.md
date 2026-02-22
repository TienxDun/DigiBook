# DigiBook - AI Agent Guide

> **DigiBook** is a modern online bookstore e-commerce application built with React 19, TypeScript, Firebase, and Vite. The documentation and codebase primarily use Vietnamese language.

---

## 📋 Project Overview

DigiBook is a feature-based React application for an online bookstore with the following key characteristics:

- **Architecture**: Feature-Based Architecture with Service Layer Pattern
- **Frontend**: React 19.2 + TypeScript 5.8 + Vite 6.2
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Styling**: Tailwind CSS 3.4 + Framer Motion for animations
- **Testing**: Vitest + React Testing Library + jsdom
- **Deployment**: Static hosting (GitHub Pages configured with base path `/DigiBook/`)

---

## 🏗️ Project Structure

```
src/
├── features/              # Feature modules (self-contained)
│   ├── admin/            # Admin dashboard, analytics, content management
│   ├── auth/             # Authentication, user profiles
│   ├── books/            # Book catalog, search, categories
│   ├── cart/             # Shopping cart, checkout
│   └── orders/           # Order history, tracking
│       ├── components/   # Feature-specific UI components
│       ├── contexts/     # State management (Context API)
│       ├── pages/        # Route-level pages
│       └── index.ts      # Public exports
│
├── services/             # Business logic layer
│   ├── db/              # Database operations
│   │   ├── modules/     # Service modules (books, orders, users, etc.)
│   │   ├── adapter.ts   # API/Firebase routing adapter
│   │   ├── core.ts      # Core database utilities
│   │   └── index.ts     # Main db service facade
│   ├── api/             # REST API client and modules
│   ├── errorHandler.ts  # Centralized error handling
│   └── map.ts           # Map/location services
│
├── shared/              # Shared resources across features
│   ├── components/      # Reusable UI components
│   │   ├── form/       # Form components (AddressInput, MapPicker)
│   │   ├── layout/     # Layout utilities (ScrollToTop, PageTransition)
│   │   ├── seo/        # SEO components (Helmet)
│   │   └── ui/         # UI primitives (Pagination, Skeleton, Toast)
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions (format, toast)
│   └── config/         # App configuration
│
├── layouts/            # Page layout components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Layout.tsx
│   ├── AdminLayout.tsx
│   └── MobileNav.tsx
│
└── lib/                # Library configurations
    └── firebase.ts     # Firebase initialization
```

---

## 🔧 Build and Development Commands

```bash
# Development server (http://localhost:5173 or port 3000 via vite.config.ts)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 🎨 Code Style Guidelines

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `BookCard.tsx`, `AdminDashboard.tsx` |
| Files (non-components) | camelCase | `useAuth.ts`, `formatPrice.ts`, `books.service.ts` |
| Variables & Functions | camelCase | `const bookList = getBooks()` |
| Constants | UPPER_SNAKE_CASE | `const SHIPPING_FEE = 30000` |
| Types/Interfaces | PascalCase | `interface Book { ... }` |
| Firestore Collections | lowercase_plural | `books`, `users`, `orders` |
| Firestore Fields | camelCase | `stockQuantity`, `originalPrice` |

### Component Structure

```typescript
import React, { useState, useCallback } from 'react';

interface BookCardProps {
  book: Book;
  onAddToCart?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onAddToCart }) => {
  // 1. State
  const [loading, setLoading] = useState(false);
  
  // 2. Hooks
  const { user } = useAuth();
  
  // 3. Handlers
  const handleClick = useCallback(() => {
    onAddToCart?.(book);
  }, [book, onAddToCart]);
  
  // 4. Render
  return <div>{/* UI */}</div>;
};
```

### TypeScript Best Practices

- Use strict typing; avoid `any`
- Define interfaces for all props
- Use type imports: `import type { Book } from '@/shared/types'`

---

## 🧪 Testing Instructions

Test files are co-located with source files or use `.test.tsx` extension.

### Test Configuration

- **Framework**: Vitest
- **Environment**: jsdom
- **Setup**: `src/setupTests.ts` (imports `@testing-library/jest-dom`)

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
npm run test              # Single run
npm run test:coverage     # With coverage report
npm run test:watch        # Watch mode
```

---

## 🔐 Security Considerations

### Firestore Security Rules

Security is enforced at multiple layers:

1. **Client-side**: Protected routes with role checks (`AdminRoute`)
2. **Service layer**: Role validation in business logic
3. **Database**: Firestore Security Rules (`firestore.rules`)

Key security patterns in rules:
- Users can only read/write their own data
- Admins have elevated privileges
- Certain fields (like `role`, `status`) are protected from user modification
- Reviews can only be edited by their creators or admins

### Environment Variables

All Firebase and API keys use `VITE_` prefix for Vite exposure:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
```

---

## 📦 Key Dependencies

### Production
- `react` ^19.2.3 - React framework
- `react-router-dom` 6.22.3 - Routing
- `firebase` ^12.8.0 - Backend services
- `framer-motion` ^12.26.2 - Animations
- `recharts` ^3.6.0 - Charts/visualizations
- `react-leaflet` ^5.0.0 - Maps
- `react-hot-toast` ^2.6.0 - Notifications
- `react-helmet-async` ^2.0.5 - SEO management

### Development
- `vite` ^6.2.0 - Build tool
- `vitest` ^4.0.17 - Testing
- `typescript` ~5.8.2 - Type checking
- `tailwindcss` ^3.4.1 - CSS framework
- `@vitejs/plugin-react` ^5.0.0 - React plugin for Vite
- `vite-plugin-pwa` ^1.2.0 - PWA support

---

## 🚀 Deployment

The project is configured for GitHub Pages deployment:

- **Base Path**: `/DigiBook/` (configured in `vite.config.ts`)
- **Router**: Uses `HashRouter` for static hosting compatibility
- **PWA**: Configured with auto-update service worker

Build output goes to `dist/` directory.

---

## 📝 Git Workflow

### Branch Naming
```bash
feature/book-search
bugfix/cart-calculation
hotfix/security-patch
chore/update-deps
```

### Commit Messages
```bash
feat(books): add ISBN search
fix(cart): correct total calculation
docs(api): update Books service
refactor(auth): extract login logic
test(cart): add unit tests
```

---

## 🔗 Path Aliases

The project uses `@/` alias for `src/` directory:

```typescript
import { BookCard } from '@/features/books';
import { formatPrice } from '@/shared/utils/format';
import type { Book } from '@/shared/types';
```

---

## 📖 Documentation

Additional documentation in `DOCS/` directory:

- `INSTALLATION.md` - Setup and configuration guide
- `ARCHITECTURE.md` - Detailed architecture overview
- `DEVELOPMENT.md` - Coding conventions and git workflow
- `API.md` - API reference and usage examples
- `DATABASE_SCHEMA.md` - Firestore data model

---

## 🌐 Language

The project primarily uses **Vietnamese** for:
- UI text and labels
- Comments in source code
- Documentation
- Commit messages

---

## ⚡ Performance Optimizations

- **Code Splitting**: `React.lazy()` for route-based code splitting
- **Manual Chunks**: Firebase, Framer Motion separated in `vite.config.ts`
- **Memoization**: `React.memo()`, `useMemo()`, `useCallback()`
- **PWA**: Service worker caching for offline support
- **Images**: Lazy loading with `loading="lazy"`
