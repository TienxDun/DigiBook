# DigiBook AI Development Guide

## ⚠️ Quy Tắc Giao Tiếp / Communication Rules
**ALWAYS respond to the user in Vietnamese (Tiếng Việt)** - This is a Vietnamese bookstore project and all communication with the developer must be in Vietnamese. Code comments and documentation can be in English, but explanations and responses to the user must be in Vietnamese.

## Architecture Overview
This is a **Vietnamese online bookstore SPA** built with React 19, TypeScript, Vite, Firebase (Firestore + Auth), and Tailwind CSS. The app uses HashRouter for client-side routing and supports both online (Firebase) and offline (mock data) modes with automatic fallback.

### Core Structure
- **App Entry**: `index.tsx` → `App.tsx` (main router + context providers)
- **State Management**: React Context (`AuthContext`) + local state + localStorage for cart/wishlist
- **Database Layer**: `services/db.ts` - single abstraction over Firestore with automatic mock fallback
- **Authentication**: Firebase Auth with Google OAuth and email/password via `services/firebase.ts`
- **Routing**: HashRouter with routes in [App.tsx](App.tsx) (pages: Home, BookDetails, Category, Author, Checkout, Orders, Admin)
- **Components**: Shared UI in `components/` (Header, BookCard, CartSidebar, Footer, etc.)

### Critical Data Flow Pattern
1. `db.ts` auto-detects Firebase connectivity on init and sets `useMock` flag
2. All CRUD operations first check `useMock` - if true, use `MOCK_BOOKS` from [constants.tsx](constants.tsx); if false, use Firestore
3. Cart/wishlist persist to `localStorage` with keys `digibook_cart` and `digibook_wishlist`
4. Admin detection: User email must equal `admin@gmail.com` (checked in [App.tsx](App.tsx#L102))

## Development Workflow

### Essential Commands
```bash
npm run dev       # Start dev server on localhost:3000 (Vite HMR enabled)
npm run build     # Production build → dist/ folder
npm run preview   # Preview production build locally
```

### Firebase Setup (Required for Online Mode)
- Config in [services/firebase.ts](services/firebase.ts) - credentials are hardcoded (not environment-based)
- If Firebase fails, app automatically uses mock data from [constants.tsx](constants.tsx)
- To test offline mode: comment out `initializeApp` in [services/firebase.ts](services/firebase.ts#L47)

### Admin Access
- Login with `admin@gmail.com` (Google or email/password)
- AdminDashboard route protected by `<AdminRoute>` wrapper in [App.tsx](App.tsx#L62)
- Admin features: Book/Author/Category CRUD, Order management, System logs, Data seeding

## Project-Specific Conventions

### TypeScript Types
- All domain types in [types.ts](types.ts): `Book`, `Author`, `CartItem`, `CategoryInfo`
- Extended types in [services/db.ts](services/db.ts): `Review`, `Order`, `SystemLog`, `OrderItem`

### Component Patterns
- **BookCard**: Receives `Book` prop, handles add-to-cart + wishlist toggle via context
- **CartSidebar**: Controlled by `isCartOpen` state in [App.tsx](App.tsx), uses `cart` state
- **Pagination**: Reusable component in `components/Pagination.tsx` for book lists and logs

### Firestore Collections Schema (See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md))
```
books/        - title, author, authorId, category, price, stock_quantity, rating, cover, description, isbn
categories/   - name (ID), icon (FontAwesome), description
authors/      - name, bio, avatar
orders/       - userId, status, statusStep, customer{}, payment{}, items[]
reviews/      - bookId, userId, rating, content
system_logs/  - action, detail, status, user, createdAt
```

### State Management Pattern
- Global auth state via `useAuth()` hook (exported from [App.tsx](App.tsx#L56))
- Cart/wishlist methods passed as props from [App.tsx](App.tsx) to child components
- No external state library - Context + useState + localStorage

### Styling Approach
- Tailwind utility classes throughout (no component-level CSS files)
- Responsive breakpoints: `md:` (tablets), `lg:` (desktops)
- Font Awesome icons via CDN (loaded in [index.html](index.html))
- Vietnamese text content throughout UI

### Mock Data System
- `MOCK_BOOKS` and `CATEGORIES` in [constants.tsx](constants.tsx) - used when Firebase unavailable
- Mock data includes 50+ Vietnamese books across 8 categories
- All `db.ts` methods have parallel implementations for mock mode

## Integration Points

### Firebase Services
- **Auth**: Google OAuth + Email/Password via `signInWithPopup`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`
- **Firestore**: CRUD operations abstracted in `db.ts` class methods (`getBooks`, `addBook`, `updateBook`, etc.)
- **Security**: Firestore rules check for `admin@gmail.com` for write operations

### Environment Variables
- `GEMINI_API_KEY` (optional) - exposed as `process.env.GEMINI_API_KEY` via [vite.config.ts](vite.config.ts#L13-L14)
- No `.env` file in repo - credentials hardcoded in [services/firebase.ts](services/firebase.ts#L31-L37)

### Deployment Configuration
- Target platform: Railway (static hosting or Node.js with `npm run preview`)
- [railway.json](railway.json) specifies build/start commands
- [DEPLOY_PLAN.md](DEPLOY_PLAN.md) contains full deployment steps

## Common Patterns to Follow

### Adding a New Book Field
1. Update `Book` interface in [types.ts](types.ts#L9-L27)
2. Add field to `MOCK_BOOKS` entries in [constants.tsx](constants.tsx)
3. Update Firestore schema docs in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
4. Modify `db.ts` methods if field requires special handling
5. Update AdminDashboard book form in [pages/AdminDashboard.tsx](pages/AdminDashboard.tsx)

### Adding a New Page
1. Create `pages/NewPage.tsx` component
2. Add route in [App.tsx](App.tsx) `<Routes>` section
3. Add navigation link in [components/Header.tsx](components/Header.tsx) or [components/MobileNav.tsx](components/MobileNav.tsx)
4. For admin pages, wrap route in `<AdminRoute>` component

### Working with Orders
- Orders created via `db.createOrder()` in [pages/CheckoutPage.tsx](pages/CheckoutPage.tsx)
- Order status: "Đang xử lý" / "Đang giao" / "Đã giao" / "Đã hủy"
- Status step: 0-3 (for progress indicator)
- User views orders at `/my-orders`, admin views all orders in dashboard

### System Logging
- All admin actions logged via `db.logSystemAction(action, detail, status, user)`
- Visible in Admin Dashboard → Logs tab
- Used for audit trail of CRUD operations

## Key Files Reference
- [App.tsx](App.tsx) - Main app logic, routing, auth context
- [services/db.ts](services/db.ts) - Database abstraction layer (Firebase + mock fallback)
- [services/firebase.ts](services/firebase.ts) - Firebase initialization
- [constants.tsx](constants.tsx) - Mock data and category definitions
- [types.ts](types.ts) - TypeScript type definitions
- [pages/AdminDashboard.tsx](pages/AdminDashboard.tsx) - Admin CRUD interface (826 lines)
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Firestore collections documentation
