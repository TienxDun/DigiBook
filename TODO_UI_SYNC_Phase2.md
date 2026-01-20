# TODO List: Đồng bộ hóa UI Admin - Phase 2.4 (Hoàn thành), Phase 2.5, 2.6 & Testing Cơ Bản

## Phase 2.4: Buttons và Interactive Elements (All Components) ✅ HOÀN THÀNH

### 2.4.1 Primary Buttons
- [x] Kiểm tra AdminBooks.tsx: Đảm bảo primary buttons sử dụng `bg-primary hover:bg-primary/90 text-primary-foreground`
- [x] Kiểm tra AdminUsers.tsx: Cập nhật primary buttons với consistent background và hover states
- [x] Kiểm tra AdminOrders.tsx: Đồng bộ primary button styling với pattern chung
- [x] Kiểm tra AdminCategories.tsx: Áp dụng primary button theme classes
- [x] Kiểm tra AdminAuthors.tsx: Đảm bảo primary buttons nhất quán

### 2.4.2 Secondary Buttons
- [x] Cập nhật secondary buttons trong tất cả admin components: `hover:bg-white/5` cho midnight, `hover:bg-secondary` cho light
- [x] Đảm bảo secondary buttons có border colors theme-aware: `border-white/10` vs `border-border`
- [x] Kiểm tra action buttons (Edit, Delete, etc.) có hover states đúng

### 2.4.3 Active và Focus States
- [x] Thêm focus states cho tất cả buttons: `focus:ring-2 focus:ring-primary/50 focus:outline-none`
- [x] Đảm bảo active states có visual feedback: `active:scale-95` hoặc background changes
- [x] Test keyboard navigation cho accessibility

### 2.4.4 Disabled States
- [x] Thống nhất disabled buttons: `opacity-50 cursor-not-allowed` cho tất cả themes
- [x] Đảm bảo disabled buttons không có hover effects

## Phase 2.5: Modals và Forms (All Components) 🚀 ĐANG TIẾN HÀNH

### 2.5.1 Modal Backgrounds
- [ ] Cập nhật modal overlays: `bg-slate-900/50` cho midnight, `bg-black/50` cho light
- [ ] Đảm bảo modal content backgrounds: `bg-[#1e293b]/40 border-white/5` vs `bg-card border-border`

### 2.5.2 Form Inputs
- [ ] Đồng bộ input borders: `border-white/10 focus:border-primary` vs `border-border focus:border-primary`
- [ ] Cập nhật input backgrounds: `bg-white/5` vs `bg-secondary/20`
- [ ] Thêm focus states cho inputs: `focus:ring-1 focus:ring-primary/50`

### 2.5.3 Form Validation
- [ ] Error states: `border-destructive text-destructive` với theme-aware colors
- [ ] Success states: `border-green-500 text-green-600` cho cả hai themes
- [ ] Validation messages styling nhất quán

### 2.5.4 Modal Buttons
- [ ] Close buttons: consistent positioning và styling
- [ ] Action buttons (Save, Cancel): theme-aware colors và hover states
- [ ] Button spacing và alignment thống nhất

## Phase 2.6: Status Badges và Indicators

### 2.6.1 Success Badges
- [ ] Áp dụng pattern: `text-green-400 bg-green-400/10 border-green-400/20` cho midnight
- [ ] Light theme: `text-green-600 bg-green-600/10 border-green-600/20`
- [ ] Đảm bảo contrast ratios cho accessibility

### 2.6.2 Error/Danger Badges
- [ ] Midnight: `text-red-400 bg-red-400/10 border-red-400/20`
- [ ] Light: `text-red-600 bg-red-600/10 border-red-600/20`
- [ ] Sử dụng trong AdminUsers (banned status), AdminOrders (failed payments)

### 2.6.3 Warning Badges
- [ ] Midnight: `text-amber-400 bg-amber-400/10 border-amber-400/20`
- [ ] Light: `text-amber-600 bg-amber-600/10 border-amber-600/20`
- [ ] Áp dụng cho pending states, low stock alerts

### 2.6.4 Info/Active Badges
- [ ] Midnight: `text-blue-400 bg-blue-400/10 border-blue-400/20`
- [ ] Light: `text-blue-600 bg-blue-600/10 border-blue-600/20`
- [ ] Sử dụng cho active users, processing orders

## Phase 3: Testing Cơ Bản

### 3.1 Theme Switching Test
- [ ] Manual test: Chuyển đổi theme giữa light và midnight trên AdminDashboard
- [ ] Kiểm tra tất cả admin tabs (Books, Users, Orders, Categories, Authors, AI)
- [ ] Đảm bảo không có elements bị thiếu styling hoặc vỡ layout
- [ ] Check contrast ratios với browser dev tools (WCAG AA compliance)

### 3.2 Component Rendering Test
- [ ] Verify tất cả admin components render đúng với cả hai themes
- [ ] Test responsive behavior: resize browser window với theme switching
- [ ] Kiểm tra modal opening/closing với theme changes
- [ ] Test form interactions (inputs, buttons) trong cả hai themes

### 3.3 Performance Check
- [ ] Monitor layout shifts khi switch theme (should be minimal)
- [ ] Check memory usage khi navigate giữa admin tabs
- [ ] Test theme persistence across page reloads

### 3.4 Cross-browser Quick Test
- [ ] Test trên Chrome và Firefox (nếu có)
- [ ] Basic mobile responsiveness check với theme switching
- [ ] Touch interactions trên mobile devices (nếu có)

## Checklist Hoàn Thành
- [ ] Tất cả primary buttons đã được cập nhật
- [ ] Secondary buttons có hover states đúng
- [ ] Modals và forms theme-aware
- [ ] Status badges nhất quán
- [ ] Theme switching hoạt động mượt mà
- [ ] Không có layout breaks khi switch theme
- [ ] Basic testing hoàn thành</content>
<parameter name="filePath">c:\Users\leuti\Desktop\GitHub\digibook\TODO_UI_SYNC_Phase2.md