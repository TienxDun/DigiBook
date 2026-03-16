
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '@/shared/components/seo/SEO';
import { Book } from '@/shared/types';
import BookCard from '../components/BookCard/index';
import { useBooks } from '@/features/books';
import { useAuth } from '@/features/auth';

import { useCart } from '@/features/cart';
import { BookCardSkeleton } from '@/shared/components';

const HomePage: React.FC<{ onQuickView?: (book: Book) => void }> = ({ onQuickView }) => {
  const { allBooks, categories, hasMore, loadingMore, loadMore } = useBooks();
  const { addToCart } = useCart();
  const { user, wishlist, setShowLoginModal, setAuthMode } = useAuth();

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://tienxdun.github.io/DigiBook/",
    "name": "DigiBook",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://tienxdun.github.io/DigiBook/#/search/{search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DigiBook",
    "url": "https://tienxdun.github.io/DigiBook/",
    "logo": "https://tienxdun.github.io/DigiBook/favicon.ico",
    "sameAs": [
      "https://facebook.com/digibook",
      "https://twitter.com/digibook"
    ]
  };

  return (
    <div className="space-y-0 fade-in">
      <SEO
        title="Trang chủ"
        description="Chào mừng bạn đến với DigiBook - Nhà sách trực tuyến hiện đại nhất Việt Nam. Khám phá kho sách khổng lồ."
        url="/"
        schemaMarkup={{ "@graph": [homeSchema, orgSchema] }}
      />
      {/* Master Hero Section - Bento Integrated UI */}
      <section className="relative flex flex-col items-center justify-center min-vh-[85vh] sm:min-h-screen xl:min-h-[85vh] lg:h-auto overflow-hidden bg-white/70 backdrop-blur-3xl pt-24 pb-12 sm:pt-28 sm:pb-24 lg:pt-36 lg:pb-32 -mt-20 sm:-mt-24 px-4 w-full border-b border-white/50 relative">
        <div className="absolute top-0 right-0 w-full lg:w-3/5 h-[80%] bg-[radial-gradient(ellipse_at_top_right,rgba(112,51,255,0.1),transparent)] rounded-full -z-10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full lg:w-2/5 h-[50%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent)] rounded-full -z-10 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl w-full mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/50 rounded-full text-indigo-600 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-4 md:mb-6 ring-1 ring-black/[0.04] whitespace-nowrap fade-in-up transition-shadow hover:shadow-md cursor-default">
              <i className="fa-solid fa-swatchbook text-[10px] text-indigo-500 animate-pulse"></i>
              <span>Thế hệ khám phá tri thức mới</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-7xl font-display font-black text-slate-800 tracking-tighter leading-[1.05] sm:leading-[1.1] mb-4 sm:mb-6 uppercase fade-in-up" style={{ animationDelay: '100ms' }}>
              Khai phá<br />
              <span className="text-indigo-600 drop-shadow-[0_2px_20px_rgba(79,70,229,0.2)]">Trí tuệ</span><br />
              chỉ qua từng<br className="lg:hidden" /> trang sách
            </h1>

            <p className="text-slate-500 text-sm sm:text-base lg:text-lg max-w-lg mb-8 sm:mb-10 leading-relaxed font-medium mx-auto lg:mx-0 fade-in-up" style={{ animationDelay: '150ms' }}>
              Trải nghiệm mua sắm thư viện số cá nhân đầu tiên, nơi khơi nguồn và thắp sáng tư duy một cách sống động.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 fade-in-up w-full sm:w-auto" style={{ animationDelay: '200ms' }}>
              <Link to="/category/Tất cả sách" className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all duration-300 shadow-[0_8px_30px_rgba(79,70,229,0.25)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.35)] active:scale-[0.97] hover:-translate-y-1 block text-center">
                Khám phá ngay
              </Link>

              <div className="flex items-center gap-4 bg-white/60 p-2 sm:p-2.5 rounded-2xl ring-1 ring-black/[0.03]">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i + 42}`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-white object-cover" alt="Member avatar" />
                  ))}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 ring-2 ring-white">+2k</div>
                </div>
                <div className="text-left pr-2">
                  <div className="flex gap-1 mb-0.5">
                    <i className="fa-solid fa-star text-[10px] sm:text-xs text-amber-400"></i>
                    <i className="fa-solid fa-star text-[10px] sm:text-xs text-amber-400"></i>
                    <i className="fa-solid fa-star text-[10px] sm:text-xs text-amber-400"></i>
                    <i className="fa-solid fa-star text-[10px] sm:text-xs text-amber-400"></i>
                    <i className="fa-solid fa-star text-[10px] sm:text-xs text-amber-400"></i>
                  </div>
                  <p className="text-[10px] font-bold text-slate-800 leading-none">Cộng đồng Độc giả</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-none fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="relative w-full aspect-square sm:aspect-video lg:aspect-square flex items-center justify-center">
              {/* Decorative elements behind cards */}
              <div className="absolute inset-x-12 top-10 bottom-24 bg-gradient-to-tr from-indigo-50 to-rose-50 rounded-[3rem] ring-1 ring-black/[0.03] shadow-inner -z-10 rotate-3"></div>

              <div className="relative grid grid-cols-2 gap-4 sm:gap-6 p-4">
                <div className="space-y-4 sm:space-y-6 pt-8 sm:pt-12">
                  <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop" loading="eager" className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-500 hover:-translate-y-2 ring-1 ring-black/[0.05]" alt="Hero book 1" />
                  <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] shadow-xl ring-1 ring-black/[0.03] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-bolt text-orange-500"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phân phối</p>
                      <p className="text-xs font-black text-slate-800">Tốc hành 2H</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] shadow-xl ring-1 ring-black/[0.03] flex flex-col justify-center gap-1.5 h-32 sm:h-40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <i className="fa-solid fa-bookmark text-4xl"></i>
                    </div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest relative z-10">Chứng nhận</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none relative z-10">Bản quyền<br />100%</p>
                  </div>
                  <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop" loading="eager" className="w-full aspect-[4/5] object-cover rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-500 hover:-translate-y-2 ring-1 ring-black/[0.05]" alt="Hero book 3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Category Bar - Premium Navigation */}
      <section className="sticky top-[64px] lg:top-[64px] z-40 py-1.5 lg:py-2 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-[1.2rem] lg:rounded-[2rem] border border-white/10 p-1 lg:p-2 shadow-[0_25px_50px_-12px_rgba(99,102,241,0.4)] flex items-center gap-2 lg:gap-3 overflow-hidden">
            <div className="flex-shrink-0 flex items-center gap-2 pl-3 pr-4 sm:pl-4 sm:pr-5 border-r border-white/10 mr-1">
              <div className="relative">
                <i className="fa-solid fa-compass text-indigo-400 text-sm"></i>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </div>
              <span className="text-xs font-black text-white uppercase tracking-[0.2em] leading-none hidden sm:block">Khám phá</span>
            </div>

            <div className="flex-1 flex items-center gap-2 lg:gap-3 overflow-x-auto no-scrollbar scroll-smooth">
              {categories.map((cat, i) => (
                <Link
                  key={i}
                  to={`/category/${cat.name}`}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 hover:bg-indigo-500/10 rounded-xl transition-all group border border-white/5 hover:border-indigo-500/30 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <i className={`fa-solid ${cat.icon} text-xs text-indigo-400/40 group-hover:text-indigo-300 transition-transform group-hover:scale-110 z-10`}></i>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white whitespace-nowrap z-10">{cat.name}</span>

                  {/* Subtle hover glow */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-indigo-500/60 group-hover:w-1/2 transition-all duration-500"></div>
                </Link>
              ))}
            </div>

            <Link
              to="/category/Tất cả sách"
              className="flex-shrink-0 flex items-center justify-center w-11 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-90"
              title="Tất cả danh mục"
            >
              <i className="fa-solid fa-plus text-sm"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Intro Spotlight - Bento Integrated */}
      <section className="py-10 lg:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 lg:gap-4">
            <div className="md:col-span-1 bg-cyan-50/50 p-5 lg:p-6 rounded-[2rem] lg:rounded-3xl border border-cyan-100/50 flex flex-col gap-4 group">
              <div className="w-10 h-10 bg-cyan-500 text-white rounded-xl flex items-center justify-center text-sm shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform"><i className="fa-solid fa-certificate"></i></div>
              <div>
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-1">Bản Quyền</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Sách chính hãng 100%.</p>
              </div>
            </div>
            <div className="md:col-span-1 bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50 flex flex-col gap-4 group">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center text-sm shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform"><i className="fa-solid fa-bolt"></i></div>
              <div>
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-1">Giao Tốc Hành</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Nhận hàng trong 2h nội thành.</p>
              </div>
            </div>
            <div className="md:col-span-2 bg-foreground rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
              <div className="relative z-10 flex items-center justify-between h-full">
                <div>
                  <span className="text-micro font-black text-primary uppercase tracking-[0.2em] mb-2 block">Chào mừng bạn mới</span>
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
      <section className="py-6 sm:py-10 lg:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-6 grid-rows-none auto-rows-fr gap-2 sm:gap-3 lg:gap-4 lg:h-[450px]">
            {/* Main Featured Book (Large) */}
            <div className="col-span-6 lg:col-span-3 lg:row-span-2 bg-foreground rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 lg:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(112,51,255,0.2),transparent)]"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-premium rounded-full mb-3 sm:mb-4 lg:mb-6 inline-block">Editor's Choice</span>
                  <h3 className="text-lg sm:text-xl lg:text-4xl font-extrabold mb-1 lg:mb-4 leading-tight tracking-tighter">Bestsellers <br />của tháng.</h3>
                  <p className="text-slate-400 text-[9px] sm:text-[10px] lg:text-sm font-medium leading-relaxed max-w-[130px] lg:max-w-[200px]">Bộ sưu tập tinh hoa hội tụ.</p>
                </div>
                <Link to="/category/Bán chạy" className="w-fit px-4 py-2 sm:px-5 sm:px-6 sm:py-2.5 lg:py-3 bg-white text-foreground rounded-xl font-bold text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-premium hover:bg-primary hover:text-white transition-all">Khám phá</Link>
              </div>
              <img
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop"
                className="absolute -right-4 -bottom-4 lg:-right-10 lg:-bottom-10 w-24 sm:w-32 lg:w-64 h-auto rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-all duration-700 opacity-20 lg:opacity-100"
                alt=""
              />
            </div>

            {/* Community Promo */}
            <div className="col-span-6 lg:col-span-3 bg-accent rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 lg:p-8 relative overflow-hidden group">
              <div className="relative z-10 flex items-center justify-between h-full">
                <div className="max-w-[80%] lg:max-w-[60%]">
                  <h4 className="text-xs sm:text-sm lg:text-lg font-black text-foreground mb-0.5 lg:mb-2 text-primary uppercase tracking-wider">Cộng đồng</h4>
                  <p className="text-[9px] sm:text-[10px] lg:text-sm text-slate-500 font-medium mb-2 lg:mb-4 leading-relaxed">Tham gia cùng 15,000+ độc giả đam mê sách.</p>
                  <Link to="/category/Tất cả sách" className="text-primary font-bold text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-widest flex items-center gap-1.5 group/link">Tham gia ngay <i className="fa-solid fa-arrow-right group-hover/link:translate-x-1 transition-transform"></i></Link>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-16 lg:h-16 bg-white rounded-lg sm:rounded-xl lg:rounded-full flex items-center justify-center shadow-xl shadow-accent/20 text-primary text-base lg:text-2xl animate-bounce">
                  <i className="fa-solid fa-users"></i>
                </div>
              </div>
            </div>

            {/* Small High-Density Info Cards */}
            <div className="col-span-2 lg:col-span-1 bg-amber-50 rounded-[2rem] p-4 lg:p-5 flex flex-col items-center justify-center text-center group hover:bg-amber-100 transition-colors">
              <i className="fa-solid fa-bolt text-amber-500 text-lg lg:text-xl mb-2"></i>
              <span className="text-[9px] lg:text-xs font-black text-foreground uppercase">Flash Sale</span>
              <p className="hidden xs:block text-micro font-bold text-amber-600 mt-1">Đang diễn ra</p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-emerald-50 rounded-[2rem] p-4 lg:p-5 flex flex-col items-center justify-center text-center group hover:bg-emerald-100 transition-colors">
              <i className="fa-solid fa-truck-fast text-emerald-500 text-lg lg:text-xl mb-2"></i>
              <span className="text-[9px] lg:text-xs font-black text-foreground uppercase">Free Ship</span>
              <p className="hidden xs:block text-micro font-bold text-emerald-600 mt-1">Đơn từ 500k</p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-secondary rounded-[2rem] p-4 lg:p-5 flex flex-col items-center justify-center text-center group hover:bg-muted transition-colors">
              <i className="fa-solid fa-users text-slate-400 text-lg lg:text-xl mb-2"></i>
              <span className="text-[9px] lg:text-xs font-black text-foreground uppercase">Cộng đồng</span>
              <p className="hidden xs:block text-micro font-bold text-slate-500 mt-1">15k Member</p>
            </div>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-secondary/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/30 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3"></div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
            <div className="max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/5 rounded-lg mb-3 sm:mb-4">
                <i className="fa-solid fa-wand-magic-sparkles text-primary text-[10px] sm:text-micro"></i>
                <p className="text-[10px] sm:text-micro font-bold text-primary uppercase tracking-premium">Curated For You</p>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">Sách mới nhất <span className="text-primary">hôm nay</span>.</h2>
            </div>
            <Link to="/category/Tất cả sách" className="hidden md:flex text-primary font-bold text-xs uppercase tracking-premium items-center gap-2 group">
              Xem toàn bộ kho sách <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {allBooks.length > 0 ? (
              <>
                {allBooks.map(book => (
                  <BookCard key={book.id} book={book} onAddToCart={addToCart} onQuickView={onQuickView} />
                ))}
                {loadingMore && [...Array(5)].map((_, i) => (
                  <BookCardSkeleton key={i} />
                ))}
              </>
            ) : (
              [...Array(10)].map((_, i) => (
                <BookCardSkeleton key={i} />
              ))
            )}
          </div>

          {hasMore && !loadingMore && allBooks.length > 0 && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={loadMore}
                className="group px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/20 active:scale-95 flex items-center gap-3"
              >
                <span>Tải thêm tri thức</span>
                <i className="fa-solid fa-chevron-down text-[10px] group-hover:translate-y-1 transition-transform"></i>
              </button>
            </div>
          )}

        </div>
      </section>

      {/* Promo Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-foreground rounded-[2.5rem] lg:rounded-[4rem] p-8 lg:p-16 flex flex-col lg:flex-row items-center gap-10 lg:gap-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#7033ff,transparent)] opacity-20"></div>

            <div className="flex-1 relative z-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-6 text-primary text-xs font-bold uppercase tracking-premium">
                <i className="fa-solid fa-gift"></i> Đặc quyền thành viên
              </div>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                Chào mừng bạn đến với <br className="hidden lg:block" />
                vũ trụ tri thức <span className="text-primary">DigiBook</span>.
              </h2>
              <p className="text-slate-400 text-xs mb-8 max-w-lg mx-auto lg:mx-0">Sử dụng mã <strong>WELCOME5</strong> cho đơn hàng từ 200k. Chỉ áp dụng cho tài khoản mới đăng ký.</p>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setShowLoginModal(true);
                }}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-premium hover:bg-white hover:text-foreground transition-all active:scale-95 text-xs">
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
