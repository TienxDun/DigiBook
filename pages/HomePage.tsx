
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, CategoryInfo, CartItem } from '../types';
import { db } from '../services/db';
import { useAuth } from '../AuthContext';
import BookCard from '../components/BookCard';
import { BookCardSkeleton } from '../components/Skeleton';

interface HomePageProps {
  onAddToCart: (book: Book) => void;
  categories: CategoryInfo[];
  allBooks: Book[];
}

const HomePage: React.FC<HomePageProps> = ({ onAddToCart, categories, allBooks }) => {
  const { user, wishlist } = useAuth();

  return (
    <div className="space-y-0 fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] lg:min-h-[70vh] flex items-center overflow-hidden bg-white mt-[-80px] lg:mt-[-80px]">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-32 hidden lg:block"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-50/50 to-transparent lg:hidden"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-10 pt-24 pb-12 lg:pt-32">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-extrabold uppercase tracking-ultra mb-6">
              <i className="fa-solid fa-wand-magic-sparkles"></i> New Generation Bookstore
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 lg:mb-8 tracking-tighter">
              Khai phá <br />
              <span className="text-indigo-600">Tiềm năng</span> <br />
              qua từng trang sách.
            </h1>
            <p className="text-slate-500 text-base sm:text-lg lg:text-xl max-w-lg mx-auto lg:mx-0 mb-8 lg:mb-10 leading-relaxed font-medium">
              DigiBook mang đến trải nghiệm đọc sách hiện đại, nơi tri thức và công nghệ hội tụ để thắp sáng tư duy của bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <Link to="/category/Tất cả sách" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-premium hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 text-[11px]">
                Khám phá ngay
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="Độc giả DigiBook" />
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 leading-none">5,000+ Độc giả</p>
                  <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Đã tin dùng</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative group w-full max-w-xl">
             <div className="absolute -inset-10 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>
             <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                   <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4.2] object-cover rounded-[1.5rem] shadow-2xl transition-transform duration-700 hover:-translate-y-2" alt="Không gian đọc sách hiện đại" />
                   <img src="https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4.2] object-cover rounded-[1.5rem] shadow-2xl transition-transform duration-700 hover:-translate-y-2" alt="Sách tri thức thế hệ mới" />
                </div>
                <div className="space-y-4">
                   <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4.2] object-cover rounded-[1.5rem] shadow-2xl transition-transform duration-700 hover:-translate-y-2" alt="Kệ sách DigiBook" />
                   <div className="w-full aspect-[3/4.2] bg-indigo-600 rounded-[1.5rem] shadow-2xl flex flex-col items-center justify-center p-6 text-center text-white">
                      <i className="fa-solid fa-star-half-stroke text-3xl mb-3 text-amber-300"></i>
                      <p className="text-xl font-extrabold">4.9/5</p>
                      <p className="text-micro font-bold uppercase tracking-premium opacity-60">Đánh giá trung bình</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="sr-only">Lý do chọn DigiBook</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 group relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-700 blur-3xl"></div>
               <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl lg:text-2xl mb-6 lg:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-cyan-200 relative z-10">
                  <i className="fa-solid fa-certificate"></i>
               </div>
               <h3 className="text-lg lg:text-xl font-extrabold text-slate-900 mb-3 lg:mb-4 relative z-10">Sách Bản Quyền</h3>
               <p className="text-slate-500 leading-relaxed font-medium text-xs tracking-wide relative z-10">Cam kết 100% sách chính hãng từ các nhà xuất bản uy tín nhất Việt Nam và thế giới.</p>
            </div>
            <div className="bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 group md:-translate-y-8 lg:-translate-y-12 relative overflow-hidden border-b-4 border-b-orange-500/20">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-700 blur-3xl"></div>
               <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center text-white text-xl lg:text-2xl mb-6 lg:mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-xl shadow-orange-200 relative z-10">
                  <i className="fa-solid fa-bolt"></i>
               </div>
               <h3 className="text-lg lg:text-xl font-extrabold text-slate-900 mb-3 lg:mb-4 relative z-10">Giao Tốc Hành</h3>
               <p className="text-slate-500 leading-relaxed font-medium text-xs tracking-wide relative z-10">Dịch vụ giao hàng 2h tại nội thành và đóng gói cẩn thận từng trang sách quý giá của bạn.</p>
            </div>
            <div className="bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group relative overflow-hidden md:col-span-2 lg:col-span-1">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-700 blur-3xl"></div>
               <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white text-xl lg:text-2xl mb-6 lg:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-emerald-200 relative z-10">
                  <i className="fa-solid fa-headset"></i>
               </div>
               <h3 className="text-lg lg:text-xl font-extrabold text-slate-900 mb-3 lg:mb-4 relative z-10">Hỗ Trợ 24/7</h3>
               <p className="text-slate-500 leading-relaxed font-medium text-xs tracking-wide relative z-10">Đội ngũ chuyên gia luôn sẵn sàng tư vấn và giúp bạn tìm ra những cuốn sách phù hợp nhất.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 lg:gap-8 mb-12 lg:mb-16 text-center md:text-left">
            <div className="max-w-xl mx-auto md:mx-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg mb-4">
                 <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                 <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-premium">Danh mục nổi bật</p>
              </div>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">Khai phá tri thức theo <span className="text-indigo-600">chủ đề</span>.</h2>
            </div>
            <p className="text-slate-500 font-medium max-w-sm text-xs sm:text-sm leading-relaxed mx-auto md:mx-0">Duyệt qua hàng ngàn tựa sách được phân loại tỉ mỉ để giúp bạn tìm thấy nguồn cảm hứng nhanh nhất.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
            {categories.length > 0 ? categories.map((cat, i) => {
              const colors = [
                { border: 'hover:border-indigo-500/50', bg: 'bg-indigo-50', icon: 'text-indigo-500', shadow: 'hover:shadow-indigo-500/20', glow: 'from-indigo-500/20' },
                { border: 'hover:border-emerald-500/50', bg: 'bg-emerald-50', icon: 'text-emerald-500', shadow: 'hover:shadow-emerald-500/20', glow: 'from-emerald-500/20' },
                { border: 'hover:border-rose-500/50', bg: 'bg-rose-50', icon: 'text-rose-500', shadow: 'hover:shadow-rose-500/20', glow: 'from-rose-500/20' },
                { border: 'hover:border-amber-500/50', bg: 'bg-amber-50', icon: 'text-amber-500', shadow: 'hover:shadow-amber-500/20', glow: 'from-amber-500/20' },
                { border: 'hover:border-cyan-500/50', bg: 'bg-cyan-50', icon: 'text-cyan-500', shadow: 'hover:shadow-cyan-500/20', glow: 'from-cyan-500/20' },
                { border: 'hover:border-violet-500/50', bg: 'bg-violet-50', icon: 'text-violet-500', shadow: 'hover:shadow-violet-500/20', glow: 'from-violet-500/20' },
              ];
              const color = colors[i % colors.length];
              
              return (
                <Link 
                  key={i} 
                  to={`/category/${cat.name}`}
                  className={`group relative bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-slate-100 transition-all duration-500 ${color.border} ${color.shadow} hover:-translate-y-2 overflow-hidden flex flex-col items-start`}
                >
                  {/* Background Glow */}
                  <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${color.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl`}></div>
                  
                  <div className={`w-12 h-12 lg:w-16 lg:h-16 ${color.bg} ${color.icon} rounded-2xl flex items-center justify-center mb-6 lg:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm`}>
                    <i className={`fa-solid ${cat.icon} text-xl lg:text-2xl`}></i>
                  </div>
                  
                  <div className="relative z-10 w-full">
                    <h3 className="text-base lg:text-xl font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{cat.name}</h3>
                    <p className="text-slate-500 text-[10px] lg:text-xs font-medium leading-relaxed mb-4 lg:mb-6 line-clamp-2 md:line-clamp-none lg:line-clamp-2">{cat.description}</p>
                    
                    <div className="flex items-center gap-2 text-[8px] lg:text-[10px] font-bold uppercase tracking-premium text-slate-400 group-hover:text-indigo-600 transition-all">
                      <span className="hidden sm:inline">Khám phá ngay</span>
                      <i className="fa-solid fa-chevron-right group-hover:translate-x-2 transition-transform"></i>
                    </div>
                  </div>

                  {/* Decorative Large Icon in Background */}
                  <i className={`fa-solid ${cat.icon} absolute -right-4 -top-4 text-5xl lg:text-7xl opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-125 -rotate-12`}></i>
                </Link>
              );
            }) : (
              <div className="col-span-2 md:col-span-2 lg:col-span-3 text-center py-20 bg-slate-50/50 rounded-[2rem] lg:rounded-[3rem] border-2 border-dashed border-slate-200">
                 <p className="text-slate-400 font-extrabold tracking-premium uppercase text-[10px]">Đang tải vũ trụ tri thức...</p>
              </div>
            )}
          </div>

          <div className="mt-16 flex justify-center">
            <Link to="/category/Tất cả sách" className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-micro uppercase tracking-premium overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/20 transition-all active:scale-95">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center gap-3">
                Xem tất cả danh mục <i className="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-transform"></i>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Spotlight Section */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-3 lg:gap-4 h-auto md:h-[600px]">
            {/* Main Featured Book (Large) */}
            <div className="col-span-2 md:row-span-2 bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-12 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.15),transparent)]"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] lg:text-[10px] font-bold uppercase tracking-premium rounded-full mb-4 lg:mb-6 inline-block">Bán chạy nhất</span>
                  <h3 className="text-2xl lg:text-5xl font-display font-extrabold mb-4 leading-tight">Khám phá tri thức <br/>thế hệ mới.</h3>
                  <p className="text-slate-400 text-xs lg:text-sm max-w-[200px] lg:max-w-xs font-medium leading-relaxed mb-6 lg:mb-0">Bộ sưu tập những cuốn sách thay đổi tư duy xuất sắc nhất năm 2026.</p>
                </div>
                <Link to="/category/Kỹ năng" className="w-fit px-5 py-2.5 lg:px-6 lg:py-3 bg-white text-slate-900 rounded-xl font-bold text-[10px] lg:text-micro uppercase tracking-premium hover:bg-indigo-500 hover:text-white transition-all">Xem bộ sưu tập</Link>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop" 
                className="absolute -right-16 -bottom-16 lg:-right-20 lg:-bottom-20 w-48 lg:w-80 h-auto rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-700 opacity-30 lg:opacity-100" 
                alt="" 
              />
            </div>

            {/* Category Spotlight (Bento Small) */}
            <div className="col-span-1 bg-amber-50 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-400 text-white rounded-full flex items-center justify-center mb-3 lg:mb-4">
                <i className="fa-solid fa-briefcase text-lg lg:text-xl"></i>
              </div>
              <h4 className="text-xs lg:text-md font-display font-extrabold text-slate-900">Kinh doanh</h4>
              <p className="text-amber-600/60 text-[8px] lg:text-[10px] font-extrabold uppercase mt-1 tracking-premium">120+ Tựa sách</p>
            </div>

            {/* Coupon (Bento Small) */}
            <div className="col-span-1 bg-rose-50 rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden group flex flex-col justify-center items-center text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(244,63,94,0.1),transparent)]"></div>
              <span className="text-[8px] lg:text-micro font-bold text-rose-500 uppercase tracking-ultra mb-2">Mã giảm giá</span>
              <div className="text-sm lg:text-2xl font-display font-black text-slate-900 border-2 border-dashed border-rose-200 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-white group-hover:scale-110 transition-transform">DIGI26</div>
              <p className="text-slate-400 text-[8px] lg:text-[9px] font-bold uppercase mt-3 lg:mt-4">Giảm 15% đơn hàng</p>
            </div>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section className="py-16 lg:py-24 bg-slate-50/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 lg:gap-8 mb-12 lg:mb-16">
            <div className="max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg mb-4">
                <i className="fa-solid fa-wand-magic-sparkles text-rose-500 text-[10px]"></i>
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-premium">Curated For You</p>
              </div>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">Sách mới nhất <span className="text-rose-500">hôm nay</span>.</h2>
            </div>
            <Link to="/category/Tất cả sách" className="hidden md:flex text-indigo-600 font-bold text-micro uppercase tracking-premium items-center gap-2 group">
              Xem toàn bộ kho sách <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {allBooks.length > 0 ? allBooks.slice(0, 10).map(book => (
              <BookCard key={book.id} book={book} onAddToCart={onAddToCart} />
            )) : (
              [...Array(10)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))
            )}
          </div>
          
          <div className="mt-12 flex justify-center md:hidden">
             <Link to="/category/Tất cả sách" className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-premium shadow-sm active:scale-95 transition-all">
                Xem toàn bộ kho sách
             </Link>
          </div>
        </div>
      </section>

      {/* Promo Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
           <div className="bg-slate-900 rounded-[2.5rem] lg:rounded-[4rem] p-8 lg:p-20 flex flex-col lg:flex-row items-center gap-10 lg:gap-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#4f46e5,transparent)] opacity-20"></div>
              
              <div className="flex-1 relative z-10 text-center lg:text-left">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-6 text-indigo-300 text-[10px] font-bold uppercase tracking-premium">
                    <i className="fa-solid fa-gift"></i> Đặc quyền thành viên
                 </div>
                 <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                    Chào mừng bạn đến với <br className="hidden lg:block" />
                    vũ trụ tri thức <span className="text-indigo-400">DigiBook</span>.
                 </h2>
                 <p className="text-slate-400 text-[11px] lg:text-xs mb-8 max-w-lg mx-auto lg:mx-0">Sử dụng mã <strong>WELCOME5</strong> cho đơn hàng từ 200k. Chỉ áp dụng cho tài khoản mới đăng ký.</p>
                 <button className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-premium hover:bg-white hover:text-slate-900 transition-all active:scale-95 text-[10px]">
                    Đăng ký thành viên
                 </button>
              </div>
              <div className="flex-1 relative hidden lg:block">
                 <img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop" className="w-full rounded-2xl shadow-2xl rotate-2" alt="" />
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
