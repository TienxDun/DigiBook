# Kế Hoạch Cải Thiện DigiBook

## 📊 Tổng Quan
**Đánh giá tổng thể:** 7.5/10  
**Ngày phân tích:** 16/01/2026  
**Trạng thái:** Dự án hoàn chỉnh về chức năng, cần cải thiện về bảo mật và hiệu năng

---

## 🚨 PHASE 1 - CRITICAL (1-2 tuần) - ƯU TIÊN CAO NHẤT

### 1. Bảo mật Firebase Credentials
**Mức độ:** 🔴 CRITICAL  
**Vấn đề:** API keys và credentials đang được hardcoded trong source code

**Vị trí:**
- `services/firebase.ts` (lines 30-37)
- `App.tsx` (line 10 - Firebase SDK URL)

**Giải pháp:**
```typescript
// 1. Tạo file .env.local
VITE_FIREBASE_API_KEY=AIzaSyD-wlKR1855xqamk5qdi7vhVCDO4ykcG78
VITE_FIREBASE_AUTH_DOMAIN=digibook-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=digibook-2026
VITE_FIREBASE_STORAGE_BUCKET=digibook-2026.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=684984926015
VITE_FIREBASE_APP_ID=1:684984926015:web:8ba46740804318d7eedd8a

// 2. Cập nhật services/firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 3. Thêm vào .gitignore
.env
.env.local
.env.*.local

// 4. Tạo .env.example (để hướng dẫn setup)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
...
```

**Thời gian ước tính:** 30 phút  
**Rủi ro nếu không fix:** Quota abuse, unauthorized access, potential data breach

---

### 2. Cải thiện Admin Authorization
**Mức độ:** 🔴 CRITICAL  
**Vấn đề:** Admin check dựa vào hardcoded email string

**Vị trí:**
- `App.tsx` (line 102): `isAdmin: firebaseUser.email === 'admin@gmail.com'`

**Giải pháp:**
```typescript
// Option 1: Firestore Custom Claims (Khuyến nghị)
// 1. Cập nhật Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth.token.admin == true;
    }
    match /books/{bookId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}

// 2. Tạo collection 'users' trong Firestore với field 'role'
// 3. Cập nhật App.tsx
const checkAdminRole = async (uid: string) => {
  const userDoc = await db.collection('users').doc(uid).get();
  return userDoc.data()?.role === 'admin';
};

// Option 2: Admin email whitelist từ Firestore (Đơn giản hơn)
const adminEmails = await db.getAdminEmails(); // Lưu trong Firestore
const isAdmin = adminEmails.includes(firebaseUser.email);
```

**Thời gian ước tính:** 2-3 giờ  
**Lợi ích:** Flexible admin management, better security, audit trail

---

### 3. Thêm Error Handling System
**Mức độ:** 🟠 HIGH  
**Vấn đề:** Error handling chưa toàn diện, nhiều nơi chỉ console.error

**Vị trí:**
- `AdminDashboard.tsx` - nhiều try/catch blocks với alert()
- `services/db.ts` - error handling cơ bản

**Giải pháp:**
```typescript
// 1. Tạo services/errorHandler.ts
class ErrorHandler {
  static handle(error: Error, context: string) {
    console.error(`[${context}]`, error);
    
    // Log to external service (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      this.logToService(error, context);
    }
    
    // User-friendly message
    const message = this.getUserMessage(error);
    return { success: false, error: message };
  }
  
  static getUserMessage(error: Error): string {
    if (error.message.includes('permission-denied')) {
      return 'Bạn không có quyền thực hiện hành động này';
    }
    if (error.message.includes('network')) {
      return 'Lỗi kết nối mạng. Vui lòng thử lại';
    }
    return 'Có lỗi xảy ra. Vui lòng thử lại sau';
  }
}

// 2. Sử dụng trong code
try {
  await db.saveBook(book);
} catch (error) {
  const result = ErrorHandler.handle(error as Error, 'SaveBook');
  alert(result.error); // Hoặc dùng toast notification
}
```

**Thời gian ước tính:** 4-5 giờ  
**Lợi ích:** Better debugging, improved UX, error tracking

---

### 4. Setup Error Monitoring Service
**Mức độ:** 🟠 HIGH  
**Công cụ đề xuất:** Sentry (free tier 5K events/month)

**Các bước:**
```bash
# 1. Install Sentry
npm install @sentry/react

# 2. Initialize in main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

# 3. Wrap App với ErrorBoundary
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

**Thời gian ước tính:** 2 giờ  
**Lợi ích:** Real-time error tracking, user session replay, performance monitoring

---

## ⚡ PHASE 2 - IMPORTANT (2-3 tuần) - CẢI THIỆN HIỆU NĂNG

### 5. Code Splitting & Lazy Loading
**Mức độ:** 🟡 MEDIUM  
**Vấn đề:** Tất cả pages được import trực tiếp, bundle size lớn

**Vị trí:**
- `App.tsx` (lines 17-25) - tất cả pages imported synchronously

**Giải pháp:**
```typescript
// 1. Cập nhật App.tsx
import { lazy, Suspense } from 'react';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// 2. Wrap routes with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    {/* ... other routes */}
  </Routes>
</Suspense>

// 3. Tạo component LoadingSpinner
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);
```

**Thời gian ước tính:** 1 giờ  
**Lợi ích:** Giảm initial bundle size 40-60%, faster first load

---

### 6. Refactor AdminDashboard Component
**Mức độ:** 🟡 MEDIUM  
**Vấn đề:** AdminDashboard.tsx quá lớn (1393 lines), quá nhiều state (38+ useState)

**Cấu trúc hiện tại:**
- 1 file, 1393 lines
- 38+ useState declarations
- Logic mix lẫn UI

**Giải pháp:**
```
pages/
  admin/
    AdminDashboard.tsx (main container - ~200 lines)
    tabs/
      OverviewTab.tsx
      BooksTab.tsx
      AuthorsTab.tsx
      CategoriesTab.tsx
      OrdersTab.tsx
      LogsTab.tsx
    modals/
      BookModal.tsx
      AuthorModal.tsx
      CategoryModal.tsx
      OrderDetailModal.tsx
    hooks/
      useAdminData.ts (custom hook quản lý state)
      useOrderStatus.ts
      useLogFilters.ts
```

**useAdminData.ts example:**
```typescript
export const useAdminData = () => {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  
  const refreshData = useCallback(async () => {
    dispatch({ type: 'LOADING_START' });
    try {
      const [books, categories, authors, orders] = await Promise.all([
        db.getBooks(),
        db.getCategories(),
        db.getAuthors(),
        db.getOrdersByUserId('admin')
      ]);
      dispatch({ 
        type: 'DATA_LOADED', 
        payload: { books, categories, authors, orders } 
      });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error });
    }
  }, []);
  
  return { state, refreshData };
};
```

**Thời gian ước tính:** 1 tuần  
**Lợi ích:** Maintainable code, easier testing, better performance

---

### 7. State Management Upgrade
**Mức độ:** 🟡 MEDIUM  
**Vấn đề:** 38+ useState trong một component, khó maintain

**Giải pháp:**

**Option 1: useReducer (Không cần thêm dependencies)**
```typescript
type AdminState = {
  books: Book[];
  orders: Order[];
  categories: CategoryInfo[];
  authors: Author[];
  logs: SystemLog[];
  searchQuery: string;
  filterStock: 'all' | 'low' | 'out';
  // ... other states
};

type AdminAction = 
  | { type: 'SET_BOOKS'; payload: Book[] }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: 'all' | 'low' | 'out' };

const adminReducer = (state: AdminState, action: AdminAction): AdminState => {
  switch (action.type) {
    case 'SET_BOOKS':
      return { ...state, books: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    // ... other cases
    default:
      return state;
  }
};

// Usage
const [state, dispatch] = useReducer(adminReducer, initialState);
```

**Option 2: Zustand (Lightweight, 1KB)**
```bash
npm install zustand

# store/adminStore.ts
import { create } from 'zustand';

export const useAdminStore = create((set) => ({
  books: [],
  orders: [],
  setBooks: (books) => set({ books }),
  setOrders: (orders) => set({ orders }),
  refreshData: async () => {
    const data = await db.getBooks();
    set({ books: data });
  }
}));

# Usage in component
const { books, setBooks } = useAdminStore();
```

**Thời gian ước tính:** 3-4 giờ (useReducer) hoặc 2 giờ (Zustand)  
**Lợi ích:** Centralized state, easier debugging, better performance

---

### 8. Add Unit Testing
**Mức độ:** 🟡 MEDIUM  
**Công cụ:** Vitest + Testing Library

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# vite.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});

# package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "coverage": "vitest --coverage"
  }
}
```

**Ví dụ test:**
```typescript
// components/__tests__/BookCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BookCard } from '../BookCard';

describe('BookCard', () => {
  it('renders book information correctly', () => {
    const book = {
      id: '1',
      title: 'Test Book',
      author: 'Test Author',
      price: 100000
    };
    
    render(<BookCard book={book} />);
    
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });
  
  it('calls addToCart when button clicked', () => {
    const mockAddToCart = jest.fn();
    render(<BookCard book={mockBook} onAddToCart={mockAddToCart} />);
    
    fireEvent.click(screen.getByText('Thêm vào giỏ'));
    expect(mockAddToCart).toHaveBeenCalledWith(mockBook);
  });
});
```

**Coverage targets:**
- Utils functions: 90%
- Components: 70%
- Services: 80%

**Thời gian ước tính:** 1 tuần  
**Lợi ích:** Catch bugs early, refactor confidence, documentation

---

## 🎨 PHASE 3 - ENHANCEMENTS (3-4 tuần) - TÍNH NĂNG BỔ SUNG

### 9. React Query Integration
**Mức độ:** 🟢 NICE TO HAVE  
**Lợi ích:** Automatic caching, background refetching, optimistic updates

**Setup:**
```bash
npm install @tanstack/react-query

# App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  }
});

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**Usage:**
```typescript
// hooks/useBooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useBooks = () => {
  return useQuery({
    queryKey: ['books'],
    queryFn: () => db.getBooks(),
    staleTime: 5 * 60 * 1000
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (book: Book) => db.saveBook(book),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
  });
};

// Component
const { data: books, isLoading, error } = useBooks();
const updateBook = useUpdateBook();
```

**Thời gian ước tính:** 2-3 ngày  
**Lợi ích:** Less boilerplate, automatic caching, loading states, error handling

---

### 10. SEO Optimization
**Mức độ:** 🟢 NICE TO HAVE  
**Vấn đề:** SPA không có server-side rendering, SEO kém

**Giải pháp:**
```bash
npm install react-helmet-async

# App.tsx wrapper
import { HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  <App />
</HelmetProvider>

# pages/HomePage.tsx
import { Helmet } from 'react-helmet-async';

<Helmet>
  <title>DigiBook - Nhà Sách Trực Tuyến Uy Tín</title>
  <meta name="description" content="Mua sách online giá rẻ, giao hàng nhanh. Hơn 10,000 đầu sách đa dạng thể loại." />
  <meta property="og:title" content="DigiBook - Nhà Sách Trực Tuyến" />
  <meta property="og:image" content="/og-image.jpg" />
  <link rel="canonical" href="https://digibook.vn/" />
</Helmet>

# pages/BookDetails.tsx
<Helmet>
  <title>{book.title} - {book.author} | DigiBook</title>
  <meta name="description" content={book.description.slice(0, 160)} />
  <meta property="og:type" content="book" />
  <meta property="og:title" content={book.title} />
  <meta property="og:image" content={book.cover} />
  <meta property="book:author" content={book.author} />
  <meta property="book:isbn" content={book.isbn} />
</Helmet>
```

**Thời gian ước tính:** 1 ngày  
**Lợi ích:** Better Google ranking, social media sharing

---

### 11. Accessibility Improvements
**Mức độ:** 🟢 NICE TO HAVE  
**Checklist:**

```typescript
// 1. Keyboard Navigation
<button
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>

// 2. ARIA Labels
<button aria-label="Thêm vào giỏ hàng">
  <i className="fa-solid fa-cart-plus"></i>
</button>

<div role="alert" aria-live="polite">
  {successMessage}
</div>

// 3. Focus Management
const modalRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen) {
    modalRef.current?.focus();
  }
}, [isOpen]);

// 4. Color Contrast (WCAG AA)
// Đảm bảo tỷ lệ tương phản text/background >= 4.5:1
// Tools: https://webaim.org/resources/contrastchecker/

// 5. Screen Reader Support
<img src={book.cover} alt={`Bìa sách ${book.title} của tác giả ${book.author}`} />
```

**Testing tools:**
- axe DevTools (Chrome extension)
- Lighthouse Accessibility audit
- NVDA/JAWS screen readers

**Thời gian ước tính:** 3-4 ngày  
**Lợi ích:** Inclusive design, legal compliance, SEO benefits

---

### 12. Performance Optimization
**Mức độ:** 🟢 NICE TO HAVE  

**Danh sách tối ưu:**

1. **Image Optimization**
```typescript
// Dùng next/image hoặc tự implement lazy loading
<img 
  src={book.cover} 
  loading="lazy"
  decoding="async"
  alt={book.title}
/>

// Hoặc dùng Intersection Observer
const [isVisible, setIsVisible] = useState(false);
const imgRef = useRef<HTMLImageElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setIsVisible(true);
      observer.disconnect();
    }
  });
  
  if (imgRef.current) {
    observer.observe(imgRef.current);
  }
  
  return () => observer.disconnect();
}, []);
```

2. **Memo & useMemo**
```typescript
// AdminDashboard.tsx - wrap expensive computations
const stats = useMemo(() => {
  // ... calculations
}, [orders, books]);

// Wrap components that don't need re-render
const BookCard = React.memo(({ book, onAddToCart }) => {
  // ...
});
```

3. **Virtual Scrolling** (for long lists)
```bash
npm install react-window

import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={books.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <BookCard book={books[index]} />
    </div>
  )}
</FixedSizeList>
```

4. **Bundle Size Analysis**
```bash
npm install -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});

npm run build # Sẽ tạo stats.html
```

**Targets:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Bundle size: < 200KB (gzipped)

**Thời gian ước tính:** 1 tuần  
**Lợi ích:** Better UX, lower bounce rate, SEO boost

---

### 13. Caching Strategy
**Mức độ:** 🟢 NICE TO HAVE  

**Service Worker với Workbox:**
```bash
npm install -D workbox-webpack-plugin

# vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-data',
              expiration: {
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      }
    })
  ]
});
```

**LocalStorage caching cho static data:**
```typescript
// utils/cache.ts
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = <T>(key: string): T | null => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(key);
    return null;
  }
  
  return data;
};

export const setCachedData = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

// Usage in db.ts
async getBooks(): Promise<Book[]> {
  const cached = getCachedData<Book[]>('books');
  if (cached) return cached;
  
  const books = await this.fetchBooks();
  setCachedData('books', books);
  return books;
}
```

**Thời gian ước tính:** 2-3 ngày  
**Lợi ích:** Offline support, faster load times, reduced API calls

---

## 📋 Checklist Tổng Hợp

### Security
- [ ] Move Firebase credentials to .env
- [ ] Implement proper admin role system
- [ ] Add Firestore security rules
- [ ] Setup HTTPS (Railway auto-provides)
- [ ] Add rate limiting for API calls
- [ ] Implement CSRF protection

### Performance
- [ ] Code splitting với React.lazy()
- [ ] Image lazy loading
- [ ] Virtual scrolling for long lists
- [ ] Memoize expensive calculations
- [ ] Bundle size optimization
- [ ] Service Worker caching

### Code Quality
- [ ] Refactor AdminDashboard (1393 lines → modules)
- [ ] Replace 38+ useState với useReducer/Zustand
- [ ] Remove magic numbers (extract constants)
- [ ] Add TypeScript strict mode
- [ ] Remove duplicate code patterns
- [ ] Add JSDoc comments

### Testing
- [ ] Setup Vitest + Testing Library
- [ ] Unit tests for utils (90% coverage)
- [ ] Component tests (70% coverage)
- [ ] Service tests (80% coverage)
- [ ] E2E tests với Playwright (optional)

### DevOps
- [ ] Setup Sentry error monitoring
- [ ] Add Google Analytics / Plausible
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated testing on PR
- [ ] Lighthouse CI checks
- [ ] Automated deployment to Railway

### UX/UI
- [ ] Add loading skeletons
- [ ] Toast notifications (react-hot-toast)
- [ ] Better error messages
- [ ] Accessibility improvements
- [ ] Mobile responsiveness review
- [ ] Add empty states illustrations

### SEO
- [ ] react-helmet-async meta tags
- [ ] sitemap.xml generation
- [ ] robots.txt configuration
- [ ] Open Graph tags
- [ ] Schema.org structured data
- [ ] Canonical URLs

---

## 🎯 Roadmap Timeline

```
Week 1-2 (CRITICAL)
├── Day 1-2: Security fixes (Firebase .env, admin roles)
├── Day 3-4: Error handling system + Sentry setup
└── Day 5-10: Testing setup + initial tests

Week 3-4 (IMPORTANT)
├── Day 11-12: Code splitting implementation
├── Day 13-17: AdminDashboard refactoring
└── Day 18-20: State management upgrade

Week 5-8 (ENHANCEMENTS)
├── Week 5: React Query integration
├── Week 6: SEO & Accessibility
├── Week 7: Performance optimization
└── Week 8: Caching & PWA features
```

---

## 💰 Chi Phí Dự Kiến

### Công cụ miễn phí
- Sentry: Free tier (5K events/month) ✅
- Vercel/Railway: Free tier ✅
- Firebase: Spark plan (free) ✅
- Google Analytics: Free ✅

### Chi phí dev time (nếu outsource)
- Phase 1 (Critical): 40-60 giờ × 300K = 12-18 triệu VNĐ
- Phase 2 (Important): 60-80 giờ × 300K = 18-24 triệu VNĐ
- Phase 3 (Enhancements): 80-100 giờ × 300K = 24-30 triệu VNĐ

**Tổng: 54-72 triệu VNĐ** (nếu thuê dev)  
**Tự làm: 0đ + thời gian**

---

## 📚 Tài Liệu Tham Khảo

### Security
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

## ✅ Tiếp Theo

**Hành động ngay:**
1. **Critical security fix** - Move Firebase credentials (30 phút)
2. **Admin role system** - Implement proper authorization (2-3 giờ)
3. **Error monitoring** - Setup Sentry (2 giờ)

**Câu hỏi cho bạn:**
- Bạn muốn bắt đầu với item nào trước?
- Có timeline cụ thể cho việc deploy production không?
- Budget cho dev time là bao nhiêu? (tự làm hay thuê?)

---

*Tài liệu này sẽ được cập nhật khi có thêm phát hiện hoặc yêu cầu mới.*
