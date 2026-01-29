# 🛠️ Development Guide

## Coding Conventions

### Naming

```typescript
// Components: PascalCase
BookCard.tsx, AdminDashboard.tsx

// Files: camelCase
useAuth.ts, formatPrice.ts, books.service.ts

// Variables & Functions: camelCase
const bookList = getBooks();
const totalPrice = 123000;

// Constants: UPPER_SNAKE_CASE
const SHIPPING_FEE = 30000;

// Types: PascalCase
interface Book { ... }
type UserRole = 'admin' | 'user';

// Firestore Collections: lowercase_plural
books, users, orders

// Firestore Fields: camelCase
stockQuantity, originalPrice, createdAt
```

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

### TypeScript

```typescript
// ✅ Type-safe
const [books, setBooks] = useState<Book[]>([]);

// ❌ Tránh any
const [data, setData] = useState<any>([]);
```

## Git Workflow

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

### Pull Request

1. `git checkout -b feature/my-feature`
2. Code & commit
3. `git push origin feature/my-feature`
4. Create PR với mô tả rõ ràng
5. Code review
6. Merge sau khi approved

## Testing

```bash
npm run test              # Run all tests
npm run test:coverage     # Coverage report
npm run test:watch        # Watch mode
```

```typescript
describe('CartContext', () => {
  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider
    });

    act(() => {
      result.current.addItem(mockBook, 1);
    });

    expect(result.current.items).toHaveLength(1);
  });
});
```

## Deployment

### Railway/Vercel

1. Connect GitHub repo
2. Set environment variables (`VITE_*`)
3. Auto-deploy on push to `main`

### Firebase Hosting

```bash
firebase init hosting
npm run build
firebase deploy --only hosting
```

## Performance

- Code splitting: `React.lazy()` cho routes
- Memoization: `React.memo()`, `useMemo()`, `useCallback()`
- Firestore: Batch operations, indexes
- Images: `loading="lazy"`
