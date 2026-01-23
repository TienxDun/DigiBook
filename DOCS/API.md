# 📖 API Reference

## Database Service

Import: `import { db } from '@/services/db';`

### Books

```typescript
// Get all books
db.getBooks(filters?: BookFilters): Promise<Book[]>

// Get by ID
db.getBookById(id: string): Promise<Book | null>

// Save/Update
db.saveBook(book: Omit<Book, 'id'>, id?: string): Promise<string>

// Delete
db.deleteBook(id: string): Promise<void>

// Search
db.fetchBookByISBN(isbn: string): Promise<Book | null>
```

### Users

```typescript
db.getUserProfile(userId: string): Promise<UserProfile | null>
db.updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void>
db.updateWishlist(userId: string, wishlistIds: string[]): Promise<void>
db.getAllUsers(): Promise<UserProfile[]>  // Admin only
```

### Orders

```typescript
db.createOrder(order: Omit<Order, 'id'>): Promise<string>
db.getOrdersByUserId(userId: string): Promise<Order[]>
db.updateOrderStatus(orderId: string, status: string, step: number): Promise<void>
```

### Reviews

```typescript
db.getReviewsByBookId(bookId: string): Promise<Review[]>
db.addReview(review: Omit<Review, 'id'>): Promise<string>
```

### Coupons

```typescript
db.validateCoupon(code: string, orderTotal: number): Promise<{
  valid: boolean;
  coupon?: Coupon;
  message?: string;
}>
db.incrementCouponUsage(couponId: string): Promise<void>
```

### System

```typescript
db.logActivity(action: string, detail: string, status: LogStatus, metadata?: any): Promise<void>
db.getSystemLogs(filters?: LogFilters): Promise<SystemLog[]>
```

## Authentication

```typescript
import { useAuth } from '@/features/auth';

const {
  user,                    // Current user
  wishlist,               // User's wishlist
  loginWithGoogle,        // () => Promise<void>
  loginWithEmail,         // (email, password) => Promise<void>
  registerWithEmail,      // (name, email, password, confirmPw) => Promise<void>
  logout,                 // () => Promise<void>
  toggleWishlist,         // (book) => void
  loading,                // boolean
} = useAuth();
```

## Custom Hooks

```typescript
// Debounce value
useDebounce<T>(value: T, delay: number): T

// Local storage
useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]

// Media query
useMediaQuery(query: string): boolean

// Pagination
usePagination<T>(items: T[], itemsPerPage: number): {
  currentPage: number;
  totalPages: number;
  currentItems: T[];
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}
```

## Utilities

```typescript
import { formatPrice, formatDate } from '@/shared/utils/format';
import toast from '@/shared/utils/toast';

// Format
formatPrice(250000);         // "250.000đ"
formatDate(new Date());      // "23/01/2026"

// Toast
toast.success('Thành công!');
toast.error('Có lỗi!');
toast.loading('Đang xử lý...');
```

## Error Handling

```typescript
import ErrorHandler from '@/services/errorHandler';

try {
  await db.saveBook(book);
} catch (error) {
  await ErrorHandler.handle(error as Error, {
    context: 'AdminBooks',
    action: 'CREATE_BOOK'
  });
}
```

## Types

```typescript
import { 
  Book, 
  Order, 
  UserProfile, 
  Review, 
  Coupon,
  CartItem,
  OrderItem,
  SystemLog 
} from '@/shared/types';
```
