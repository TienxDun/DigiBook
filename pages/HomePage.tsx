
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, CategoryInfo, CartItem } from '../types';
import { db } from '../services/db';
import { useAuth } from '../AuthContext';
import BookCard from '../components/BookCard';
import { BookCardSkeleton } from '../components/Skeleton';
import SEO from '../components/SEO';

interface HomePageProps {
  onAddToCart: (book: Book) => void;
  categories: CategoryInfo[];
  allBooks: Book[];
}

const HomePage: React.FC<HomePageProps> = ({ onAddToCart, categories, allBooks }) => {
  const { user, wishlist } = useAuth();

  return (
    <div className="space-y-0 fade-in">
      <SEO 
        title="Trang chủ" 
        description="Chào mừng bạn đến với DigiBook - Nhà sách trực tuyến hiện đại nhất Việt Nam. Khám phá kho sách khổng lồ và công nghệ AI phân tích sách."
        url="/"
      />
      {/* Hero Section */}
      <section className="relative min-h-[50vh] lg:min-h-[60vh] flex items-center overflow-hidden bg-white mt-[-80px] lg:mt-[-80px]">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-32 hidden lg:block"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-50/50 to-transparent lg:hidden"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-10 pt-20 pb-8 lg:pt-28">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full text-indigo-600 text-[9px] font-extrabold uppercase tracking-ultra mb-4">
              <i className="fa-solid fa-wand-magic-sparkles"></i> New Generation Bookstore
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-4 lg:mb-6 tracking-tighter">
              Khai phá <br />
              <span className="text-indigo-600">Tiềm năng</span> <br />
              qua từng trang sách.
            </h1>
            <p className="text-slate-500 text-sm sm:text-base lg:text-lg max-w-lg mx-auto lg:mx-0 mb-6 lg:mb-8 leading-relaxed font-medium">
              Trải nghiệm tri thức hiện đại, thắp sáng tư duy của bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/category/Tất cả sách" className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-premium hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 text-[10px]">
                Khám phá ngay
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-8 h-8 rounded-full border-4 border-white shadow-sm" alt="" />
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-none">5,000+ Độc giả</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative group w-full max-w-lg">
             <div className="absolute -inset-10 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>
             <div className="relative grid grid-cols-2 gap-3">
                <div className="space-y-3 pt-6">
                   <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4] object-cover rounded-[1.2rem] shadow-xl transition-transform duration-700 hover:-translate-y-2" alt="" />
                   <img src="https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4] object-cover rounded-[1.2rem] shadow-xl transition-transform duration-700 hover:-translate-y-2" alt="" />
                </div>
                <div className="space-y-3">
                   <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4] object-cover rounded-[1.2rem] shadow-xl transition-transform duration-700 hover:-translate-y-2" alt="" />
                   <div className="w-full aspect-[3/4] bg-indigo-600 rounded-[1.2rem] shadow-xl flex flex-col items-center justify-center p-4 text-center text-white">
                      <i className="fa-solid fa-star-half-stroke text-2xl mb-2 text-amber-300"></i>
                      <p className="text-lg font-extrabold">4.9/5</p>
                      <p className="text-[8px] font-bold uppercase tracking-premium opacity-60 text-white">Đánh giá chung</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Quick Category Bar - Premium Navigation */}
      <section className="sticky top-[72px] z-40 py-4 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-[1.5rem] border border-white/10 p-2 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.3)] flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 flex items-center gap-2 pl-4 pr-5 border-r border-white/10 mr-1">
              <div className="relative">
                <i className="fa-solid fa-compass text-indigo-400 text-sm"></i>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none hidden sm:block">Khám phá</span>
            </div>
            
            <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
              {categories.map((cat, i) => (
                <Link 
                  key={i} 
                  to={`/category/${cat.name}`}
                  className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-indigo-600 rounded-xl transition-all group border border-white/5 hover:border-indigo-400 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <i className={`fa-solid ${cat.icon} text-xs text-indigo-300 group-hover:text-white transition-transform group-hover:scale-110 z-10`}></i>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white whitespace-nowrap z-10">{cat.name}</span>
                  
                  {/* Subtle hover glow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-indigo-400 group-hover:w-1/2 transition-all duration-500"></div>
                </Link>
              ))}
            </div>

            <Link 
              to="/category/Tất cả sách" 
              className="flex-shrink-0 flex items-center justify-center w-11 h-11 bg-indigo-600 hover:bg-white text-white hover:text-indigo-600 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-90"
              title="Tất cả danh mục"
            >
              <i className="fa-solid fa-plus text-sm"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Intro Spotlight - Bento Integrated */}
      <section className="py-8 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 bg-cyan-50/50 p-6 rounded-3xl border border-cyan-100/50 flex flex-col gap-4 group">
               <div className="w-10 h-10 bg-cyan-500 text-white rounded-xl flex items-center justify-center text-sm shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform"><i className="fa-solid fa-certificate"></i></div>
               <div>
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Bản Quyền</h3>
                 <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Sách chính hãng 100%.</p>
               </div>
            </div>
            <div className="md:col-span-1 bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50 flex flex-col gap-4 group">
               <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center text-sm shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform"><i className="fa-solid fa-bolt"></i></div>
               <div>
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Giao Tốc Hành</h3>
                 <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Nhận hàng trong 2h nội thành.</p>
               </div>
            </div>
            <div className="md:col-span-2 bg-indigo-900 rounded-3xl p-6 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent"></div>
               <div className="relative z-10 flex items-center justify-between h-full">
                  <div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 block">Chào mừng bạn mới</span>
                    <h3 className="text-white text-xl font-bold mb-4">Giảm 15% cho đơn đầu tiên</h3>
                    <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg font-black text-xs text-white border border-white/10 tracking-widest">DIGI26</div>
                  </div>
                  <i className="fa-solid fa-gift text-white/5 text-7xl -rotate-12 group-hover:scale-125 transition-transform duration-700"></i>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Spotlight Section - High Density Highlights */}
      <section className="py-8 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 grid-rows-none auto-rows-fr gap-3 lg:gap-4 lg:h-[450px]">
            {/* Main Featured Book (Large) */}
            <div className="col-span-2 lg:col-span-3 lg:row-span-2 bg-slate-900 rounded-[2rem] p-6 lg:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.2),transparent)]"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 bg-indigo-600 text-[10px] font-bold uppercase tracking-premium rounded-full mb-6 inline-block">Editor's Choice</span>
                  <h3 className="text-2xl lg:text-4xl font-extrabold mb-4 leading-tight tracking-tighter">Bestsellers <br/>của tháng.</h3>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[200px]">Bộ sưu tập tinh hoa hội tụ.</p>
                </div>
                <Link to="/category/Bán chạy" className="w-fit px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-micro uppercase tracking-premium hover:bg-indigo-500 hover:text-white transition-all">Khám phá</Link>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop" 
                className="absolute -right-10 -bottom-10 w-48 lg:w-64 h-auto rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-700 opacity-40 lg:opacity-100" 
                alt="" 
              />
            </div>

            {/* AI Assistant Promo */}
            <div className="col-span-2 lg:col-span-3 bg-indigo-50 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden group">
              <div className="relative z-10 flex items-center justify-between h-full">
                <div className="max-w-[60%]">
                  <h4 className="text-lg font-black text-slate-900 mb-2">Trợ lý AI</h4>
                  <p className="text-[11px] text-slate-500 font-medium mb-4">Tìm cuốn sách phù hợp với tâm trạng của bạn ngay tức thì.</p>
                  <Link to="/admin/ai" className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">Thử ngay <i className="fa-solid fa-arrow-right"></i></Link>
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg text-indigo-500 text-2xl animate-bounce">
                  <i className="fa-solid fa-robot"></i>
                </div>
              </div>
            </div>

            {/* Small High-Density Info Cards */}
            <div className="col-span-1 bg-amber-50 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center group hover:bg-amber-100 transition-colors">
              <i className="fa-solid fa-bolt text-amber-500 text-xl mb-2"></i>
              <span className="text-[10px] font-black text-slate-900 uppercase">Flash Sale</span>
              <p className="text-[9px] font-bold text-amber-600 mt-1">Đang diễn ra</p>
            </div>

            <div className="col-span-1 bg-emerald-50 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center group hover:bg-emerald-100 transition-colors">
              <i className="fa-solid fa-truck-fast text-emerald-500 text-xl mb-2"></i>
              <span className="text-[10px] font-black text-slate-900 uppercase">Free Ship</span>
              <p className="text-[9px] font-bold text-emerald-600 mt-1">Đơn từ 500k</p>
            </div>

            <div className="col-span-1 bg-slate-50 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center group hover:bg-slate-200 transition-colors">
               <i className="fa-solid fa-users text-slate-400 text-xl mb-2"></i>
               <span className="text-[10px] font-black text-slate-900 uppercase">Cộng đồng</span>
               <p className="text-[9px] font-bold text-slate-500 mt-1">15k Member</p>
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
