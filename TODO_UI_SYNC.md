# TODO List: Đồng bộ hóa UI Admin Tabs

## Phase 1: Thêm Theme Support Cơ Bản - COMPLETED ✅

### 1.1 AdminAI.tsx - COMPLETED ✅
- [x] Thêm `const isMidnight = theme === 'midnight';` ngay sau khai báo component
- [x] Cập nhật header section: sử dụng `bg-[#1e293b]/40 border-white/5` cho midnight, `bg-card border-border shadow-sm` cho light
- [x] Cập nhật icon containers: `bg-primary/20 text-primary` cho midnight, `bg-primary/10 text-primary` cho light
- [x] Cập nhật text colors: `text-white` vs `text-foreground`, `text-slate-500` vs `text-muted-foreground`
- [x] Áp dụng theme cho modal backgrounds và borders
- [x] Đồng bộ hóa tab styling với pattern của AdminLogs

### 1.2 AdminOrders.tsx - COMPLETED ✅
- [x] Thêm `const isMidnight = theme === 'midnight';` ngay sau khai báo component
- [x] Cập nhật header section với theme classes như AdminLogs
- [x] Áp dụng theme cho order cards: background, borders, hover states
- [x] Cập nhật status badges với theme-aware colors
- [x] Đồng bộ hóa button styling: hover states, colors
- [x] Áp dụng theme cho modal và form elements

### 1.3 AdminUsers.tsx - COMPLETED ✅
- [x] Thêm `const isMidnight = theme === 'midnight';` ngay sau khai báo component
- [x] Cập nhật header với theme classes
- [x] Áp dụng theme cho user cards: `hover:bg-white/5` vs `hover:bg-secondary/20`
- [x] Cập nhật filter buttons và action buttons với theme
- [x] Đảm bảo Pagination component nhận theme prop đúng cách
- [x] Đồng bộ hóa text colors và border colors

### 1.4 AdminAuthors.tsx - COMPLETED ✅
- [x] Thêm `const isMidnight = theme === 'midnight';` ngay sau khai báo component
- [x] Cập nhật header section với theme classes
- [x] Áp dụng theme cho author cards và list items
- [x] Đồng bộ hóa modal styling với AdminCategories pattern
- [x] Cập nhật form elements: inputs, buttons với theme
- [x] Áp dụng theme cho bulk action buttons

### 1.5 AdminCategories.tsx - COMPLETED ✅
- [x] Thêm `const isMidnight = theme === 'midnight';` ngay sau khai báo component
- [x] Cập nhật header với theme classes như AdminLogs
- [x] Áp dụng theme cho category cards: backgrounds, borders
- [x] Đồng bộ hóa icon selection modal styling
- [x] Cập nhật button hover states và active states
- [x] Áp dụng theme cho form validation states

### 1.6 AdminBooks.tsx - COMPLETED ✅
- [x] Thêm `const isMidnight = theme === 'midnight';` ngay sau khai báo component
- [x] Cập nhật header với theme classes như AdminLogs
- [x] Áp dụng theme cho book cards: backgrounds, borders, hover states
- [x] Cập nhật status badges với theme-aware colors
- [x] Đồng bộ hóa button styling: hover states, colors
- [x] Áp dụng theme cho modal và form elements

## Phase 2: Đồng bộ hóa Styling Patterns - IN PROGRESS 🚧

### 2.1 Header Components (All Components)
- [ ] Đảm bảo tất cả headers sử dụng cùng pattern:
  - Midnight: `bg-[#1e293b]/40 border-white/5`
  - Light: `bg-card border-border shadow-sm`
- [ ] Icon containers thống nhất: `bg-primary/20 text-primary` vs `bg-primary/10 text-primary`
- [ ] Title text: `text-white` vs `text-foreground`
- [ ] Subtitle text: `text-slate-500` vs `text-muted-foreground`

### 2.2 Card/List Items (All Components) - COMPLETED ✅
- [ ] Table rows và cards: `hover:bg-white/5` cho midnight, `hover:bg-secondary/20` cho light
- [ ] Border colors: `border-white/5` vs `border-border`
- [ ] Background colors: `bg-white/[0.02]` vs `bg-secondary/30`
- [ ] Selected states: consistent highlight colors

### 2.3 Text Colors (All Components) - COMPLETED ✅
- [x] Primary text: `text-white` vs `text-foreground`
- [x] Secondary text: `text-slate-500` vs `text-muted-foreground`
- [x] Accent text: `text-slate-200` vs `text-slate-700`
- [x] Link colors: proper contrast cho cả hai themes

### 2.4 Buttons và Interactive Elements (All Components)
- [ ] Primary buttons: consistent background và hover states
- [ ] Secondary buttons: `hover:bg-white/5` vs `hover:bg-secondary`
- [ ] Active states: visual feedback thống nhất
- [ ] Focus states: proper contrast và accessibility
- [ ] Disabled states: opacity và cursor thống nhất

### 2.5 Modals và Forms (All Components)
- [ ] Modal backgrounds: `bg-slate-900/50` vs `bg-black/50`
- [ ] Modal content: `bg-[#1e293b]/40` vs `bg-card`
- [ ] Form inputs: border colors, focus states
- [ ] Validation states: error/success colors theme-aware
- [ ] Close buttons và action buttons thống nhất

### 2.6 Status Badges và Indicators
- [ ] Success badges: `text-success bg-success/10 border-success/20`
- [ ] Error badges: `text-destructive bg-destructive/10 border-destructive/20`
- [ ] Warning badges: `text-amber-500 bg-amber-500/10 border-amber-500/20`
- [ ] Info badges: `text-blue-500 bg-blue-500/10 border-blue-500/20`

## Phase 3: Testing và Validation

### 3.1 Theme Switching Test
- [ ] Test chuyển đổi theme giữa light và midnight trên tất cả admin tabs
- [ ] Đảm bảo không có elements bị thiếu styling hoặc vỡ layout
- [ ] Check contrast ratios cho accessibility (WCAG standards)
- [ ] Test trên các kích thước màn hình khác nhau

### 3.2 Component Integration Test
- [ ] Verify tất cả admin components render đúng với theme
- [ ] Test responsive behavior với cả hai themes
- [ ] Performance check khi switch theme (no layout shifts)
- [ ] Memory leak check khi unmount components

### 3.3 Cross-browser Testing
- [ ] Test trên Chrome, Firefox, Safari, Edge
- [ ] Mobile responsiveness với theme switching
- [ ] Touch device interactions

## Phase 4: Documentation và Maintenance

### 4.1 Update Component Documentation
- [ ] Document theme prop usage trong JSDoc comments
- [ ] Add examples cho theme implementation trong code comments
- [ ] Update README với theme usage guidelines

### 4.2 Create Theme Guidelines
- [ ] Centralized theme color palette trong constants file
- [ ] Consistent naming conventions cho theme classes
- [ ] Reusable CSS classes cho common patterns
- [ ] Theme utility functions nếu cần

### 4.3 Code Review và Refactoring
- [ ] Extract common theme utilities vào separate file
- [ ] Reduce code duplication across components
- [ ] Optimize bundle size nếu có thể
- [ ] Add TypeScript types cho theme props

## Phase 3: Testing và Validation

### 3.1 Theme Switching Test
- [ ] Test chuyển đổi theme giữa light và midnight
- [ ] Đảm bảo không có elements bị thiếu styling
- [ ] Check contrast ratios cho accessibility

### 3.2 Component Integration Test
- [ ] Verify tất cả admin components render đúng với theme
- [ ] Test responsive behavior với cả hai themes
- [ ] Performance check khi switch theme

### 3.3 Cross-browser Testing
- [ ] Test trên Chrome, Firefox, Safari
- [ ] Mobile responsiveness với theme switching

## Phase 4: Documentation và Maintenance

### 4.1 Update Component Documentation
- [ ] Document theme prop usage trong JSDoc
- [ ] Add examples cho theme implementation

### 4.2 Create Theme Guidelines
- [ ] Centralized theme color palette
- [ ] Consistent naming conventions
- [ ] Reusable CSS classes cho common patterns

### 4.3 Code Review và Refactoring
- [ ] Extract common theme utilities
- [ ] Reduce code duplication
- [ ] Optimize bundle size nếu cần</content>
<parameter name="filePath">c:\Users\leuti\Desktop\GitHub\digibook\TODO_UI_SYNC.md