# Kế Hoạch Deploy DigiBook Lên Railway

## Phân Tích Dự Án

Dự án DigiBook là một ứng dụng nhà sách trực tuyến được xây dựng bằng:
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Styling**: Tailwind CSS + Font Awesome
- **Routing**: React Router DOM

### Cấu Trúc Dự Án
- **Build Tool**: Vite (tạo static files trong `dist/`)
- **Database**: Firestore (NoSQL, không cần server riêng)
- **Authentication**: Firebase Auth (Google + Email/Password)
- **Hosting**: Cần host static SPA

### Yêu Cầu Deploy
- Railway hỗ trợ deploy Node.js apps và static sites
- Vì là SPA, cần build static và serve
- Firebase config đã có sẵn trong code
- Environment variables: GEMINI_API_KEY (nếu dùng)

## Kế Hoạch Deploy Chi Tiết

### Bước 1: Chuẩn Bị Dự Án
1. **Kiểm tra build**:
   ```bash
   npm run build
   ```
   - Đảm bảo build thành công, tạo thư mục `dist/`
   - Kiểm tra không có lỗi trong console

2. **Cấu hình Vite cho production**:
   - Đảm bảo `vite.config.ts` có base path nếu cần
   - Kiểm tra environment variables trong `.env` (nếu có)

3. **Tạo file `.env.example`** (nếu chưa có):
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Bước 2: Thiết Lập Repository Git
1. **Khởi tạo Git** (nếu chưa có):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Tạo repository trên GitHub**:
   - Truy cập https://github.com/new
   - Tên repo: `digibook-deploy`
   - Push code:
   ```bash
   git remote add origin https://github.com/your-username/digibook-deploy.git
   git push -u origin main
   ```

### Bước 3: Thiết Lập Railway
1. **Tạo tài khoản Railway**:
   - Truy cập https://railway.app
   - Đăng ký/đăng nhập

2. **Kết nối GitHub**:
   - Trong Railway dashboard, click "New Project"
   - Chọn "Deploy from GitHub repo"
   - Authorize Railway với GitHub
   - Chọn repository `digibook-deploy`

### Bước 4: Cấu Hình Deploy
1. **Railway sẽ tự động detect là Node.js project**

2. **Tạo file `railway.json`** (tùy chọn, để customize):
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm run preview"
     }
   }
   ```

3. **Cấu hình Build Command**:
   - Build Command: `npm run build`
   - Start Command: `npm run preview` (hoặc serve static files)

4. **Environment Variables**:
   - Trong Railway dashboard, thêm:
     - `GEMINI_API_KEY`: your_api_key
   - Nếu dùng Firebase, config đã hardcode trong code

### Bước 5: Deploy và Test
1. **Trigger Deploy**:
   - Push code lên GitHub, Railway tự động deploy
   - Hoặc manual deploy trong dashboard

2. **Kiểm tra Deploy**:
   - Xem logs trong Railway dashboard
   - Truy cập URL được cung cấp
   - Test các tính năng: login, browse books, cart, etc.

3. **Fix Issues** (nếu có):
   - Nếu lỗi build, kiểm tra dependencies
   - Nếu lỗi runtime, kiểm tra Firebase config
   - Nếu SPA routing lỗi, thêm `_redirects` hoặc cấu hình server

### Bước 6: Cấu Hình Domain (Tùy Chọn)
1. **Custom Domain**:
   - Trong Railway, Settings > Domains
   - Thêm domain của bạn
   - Cấu hình DNS theo hướng dẫn

### Bước 7: Monitoring và Maintenance
1. **Monitoring**:
   - Sử dụng Railway logs
   - Set up alerts nếu cần

2. **Updates**:
   - Push changes lên GitHub
   - Railway auto-deploy

3. **Backup**:
   - Firebase tự động backup
   - Export data nếu cần

## Lưu Ý Quan Trọng
- **Firebase Security**: Đảm bảo Firestore rules chỉ cho phép read public, write chỉ admin
- **Environment Variables**: Không commit secrets vào Git
- **CORS**: Firebase đã handle, không cần config thêm
- **Performance**: Bundle size lớn (800KB), cân nhắc code splitting
- **SEO**: Thêm meta tags, sitemap nếu cần

## Troubleshooting
- **Build fails**: Kiểm tra Node version (18+)
- **Firebase errors**: Kiểm tra config và permissions
- **Routing issues**: Đảm bảo server serve index.html cho all routes
- **Environment vars**: Kiểm tra Railway env vars match với code

## Chi Phí Dự Kiến
- Railway: Free tier đủ cho small app
- Firebase: Free tier cho development
- Domain: ~$10-20/năm nếu custom