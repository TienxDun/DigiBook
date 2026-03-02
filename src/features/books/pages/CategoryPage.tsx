
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/services/db';
import { Book, CategoryInfo } from '@/shared/types';
import { BookCardSkeleton } from '@/shared/components';
import SEO from '@/shared/components/seo/SEO';
import { useBooks } from '@/features/books';
import BookCard from '../components/BookCard/index';
import { useCart } from '@/features/cart';

const ITEMS_PER_PAGE = 10;

const CategoryPage: React.FC<{ onQuickView?: (book: Book) => void }> = ({ onQuickView }) => {
  const { addToCart } = useCart();
  const { categories } = useBooks(); // Only needed for category info

  const { categoryName } = useParams();

  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [promoBooks, setPromoBooks] = useState<Book[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  // Promotion Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });
  const topRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Infinite Scroll Observer
  const lastBookElementRef = React.useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Load Data Function
  const loadBooks = async (isInitial = false) => {
    setLoading(true);
    try {
      // Map UI sort to DB sort
      let dbSort: 'newest' | 'price_asc' | 'price_desc' | 'rating' = 'newest';
      if (sortBy === 'price-low') dbSort = 'price_asc';
      else if (sortBy === 'price-high') dbSort = 'price_desc';
      else if (sortBy === 'rating') dbSort = 'rating';

      const currentLastDoc = isInitial ? null : lastDoc;

      // Normalize category for query: "all" or "Tất cả sách" -> undefined (fetch all)
      const queryCategory = (categoryName === 'all' || categoryName === 'Tất cả sách' || !categoryName)
        ? undefined
        : categoryName;

      const result = await db.getBooksPaginated(ITEMS_PER_PAGE, currentLastDoc, queryCategory, dbSort);

      if (isInitial) {
        setBooks(result.books);
        // Chọn 2-3 sách ngẫu nhiên cho banner Flash Sale
        const shuffled = [...result.books].sort(() => 0.5 - Math.random());
        setPromoBooks(shuffled.slice(0, 2));
      } else {
        setBooks(prev => {
          const existingIds = new Set(prev.map(b => b.id));
          const uniqueNewBooks = result.books.filter(b => !existingIds.has(b.id));
          return [...prev, ...uniqueNewBooks];
        });
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.books.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    loadBooks(false);
  };

  const isPromotionPage = !categoryName || categoryName === 'all' || categoryName === 'Tất cả sách' || categoryName.toLowerCase().includes('sale') || categoryName.toLowerCase().includes('khuyến mãi');

  // Trigger load on category/sort change
  useEffect(() => {
    setBooks([]);
    setLastDoc(null);
    setHasMore(true);
    loadBooks(true);

    if (isPromotionPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [categoryName, sortBy]);

  // Removed memoized client-side filtering logic

  const currentCategory = categories.find(c => c.name.toLowerCase() === categoryName?.toLowerCase()) || categories[0] || { name: categoryName || 'Danh mục', icon: 'fa-book', description: 'Khám phá thế giới tri thức' };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10 fade-in">
      <SEO
        title={categoryName}
        description={`Khám phá danh mục ${categoryName} tại DigiBook. ${currentCategory.description}`}
        url={`/category/${categoryName}`}
      />
      {isPromotionPage && (
        <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 pt-8 pb-12 sm:pt-12 sm:pb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-20"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-12">
              <div className="text-white text-center lg:text-left flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500 rounded-full text-[10px] sm:text-micro font-bold uppercase tracking-premium mb-3 sm:mb-4 animate-pulse">
                  <i className="fa-solid fa-bolt"></i>
                  Flash Sale Đang Diễn Ra
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold mb-2 sm:mb-4 tracking-tight leading-none">
                  Đại Tiệc <span className="text-amber-400">Ưu Đãi</span>
                </h1>
                <p className="text-indigo-100 text-[11px] sm:text-base max-w-lg mb-6 sm:mb-8 font-medium opacity-90">
                  Sở hữu ngay những siêu phẩm tri thức với mức giá giảm sâu đến 50%. Duy nhất trong hôm nay!
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3">
                  {[
                    { label: 'Giờ', value: timeLeft.hours },
                    { label: 'Phút', value: timeLeft.minutes },
                    { label: 'Giây', value: timeLeft.seconds }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black mb-1 sm:mb-1.5 border border-white/20 shadow-2xl">
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      <span className="text-[9px] sm:text-micro font-bold uppercase tracking-premium opacity-60">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 hidden lg:flex justify-end items-center gap-6 relative">
                {/* Sách ngẫu nhiên Highlight */}
                {promoBooks.map((book, idx) => (
                  <div
                    key={book.id}
                    className={`relative group transition-all duration-700 hover:scale-105 ${idx === 1 ? 'mt-12' : '-mt-4'}`}
                  >
                    <div className="absolute -inset-4 bg-indigo-500 rounded-2xl blur-2xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-white p-2 rounded-2xl shadow-2xl transform transition-transform duration-500 group-hover:rotate-0" style={{ transform: `rotate(${idx % 2 === 0 ? '-6deg' : '6deg'})` }}>
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-40 h-56 object-cover rounded-xl shadow-lg"
                      />
                      <div className="absolute top-4 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl uppercase tracking-tighter">
                        -{Math.floor(Math.random() * 20 + 30)}%
                      </div>
                    </div>
                  </div>
                ))}

                {/* Decorative elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400/20 blur-[100px] rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div
        ref={topRef}
        className="max-w-7xl mx-auto px-4 relative z-20 scroll-mt-20 lg:scroll-mt-24 mt-4"
      >

        {/* STICKY CATEGORY BAR - SUPER PREMIUM IMPACT */}
        <div className="sticky top-[64px] lg:top-[80px] z-40 mb-5 sm:mb-6 p-1 sm:p-1.5 bg-white/80 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] border border-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)] flex items-center gap-2 sm:gap-3 overflow-hidden transition-all duration-700 hover:shadow-[0_20px_60px_rgba(79,70,229,0.12)]">

          {/* Label Section - Elegant & Professional */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[1.2rem] sm:rounded-[2rem] shadow-xl relative overflow-hidden group/label">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/label:animate-[shimmer_1.5s_infinite]"></div>
            <div className="relative">
              <i className="fa-solid fa-wand-magic-sparkles text-amber-400 text-[10px] animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"></i>
            </div>
            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] hidden md:block">Khám phá</span>
          </div>

          {/* Categories List - Premium Scrolling */}
          <div className="flex-1 flex overflow-x-auto pb-1 gap-1.5 sm:gap-2 no-scrollbar scroll-smooth py-1 relative pr-12">
            {[
              { name: 'Tất cả sách', icon: 'fa-book-open' },
              ...categories.filter(c => c.name !== 'Tất cả sách')
            ].map((cat, i) => {
              const isAllTab = cat.name === 'Tất cả sách';
              const isActive = (isAllTab && (categoryName === 'all' || categoryName === 'Tất cả sách' || !categoryName)) ||
                categoryName === cat.name;

              // Premium Color Palette with Mesh Gradients
              const colors = [
                { active: 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.5)]', inactive: 'text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-md' },
                { active: 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-[0_10px_20px_-5px_rgba(244,63,94,0.5)]', inactive: 'text-slate-600 hover:bg-white hover:text-rose-500 hover:shadow-md' },
                { active: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_10px_20px_-5px_rgba(16,185,129,0.5)]', inactive: 'text-slate-600 hover:bg-white hover:text-emerald-500 hover:shadow-md' },
                { active: 'bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-[0_10px_20px_-5px_rgba(245,158,11,0.5)]', inactive: 'text-slate-600 hover:bg-white hover:text-amber-500 hover:shadow-md' },
                { active: 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-[0_10px_20px_-5px_rgba(6,182,212,0.5)]', inactive: 'text-slate-600 hover:bg-white hover:text-cyan-500 hover:shadow-md' },
                { active: 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_10px_20px_-5px_rgba(139,92,246,0.5)]', inactive: 'text-slate-600 hover:bg-white hover:text-violet-500 hover:shadow-md' },
              ][i % 6];

              return (
                <Link
                  key={i}
                  to={isAllTab ? '/category/all' : `/category/${cat.name}`}
                  className={`flex-shrink-0 relative group/item px-3.5 py-2 lg:px-4.5 lg:py-2.5 rounded-[1rem] sm:rounded-[2rem] font-bold text-[10px] lg:text-[11px] uppercase tracking-wide flex items-center gap-2 transition-all duration-500 border border-transparent ${isActive ? colors.active : `bg-transparent ${colors.inactive}`
                    }`}
                >
                  <i className={`fa-solid ${cat.icon} transition-all duration-500 ${isActive ? 'scale-110 rotate-[360deg]' : 'group-hover/item:scale-120 group-hover/item:rotate-12'
                    }`}></i>
                  <span className="relative z-10">{cat.name}</span>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white rounded-full shadow-[0_0_10px_#fff]"></div>
                  )}

                  {/* Hover Background Effect */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/50 rounded-xl sm:rounded-[1.8rem] opacity-0 group-hover/item:opacity-100 transition-opacity -z-10 blur-sm"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Fade Effect on Scroll */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-10"></div>
        </div>

        {/* HEADER & SORTING - ULTRA COMPACT PREMIUM UI */}
        <div className="bg-white/90 backdrop-blur-xl p-2 sm:p-2.5 lg:p-3 rounded-2xl lg:rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/80 flex flex-col xl:flex-row items-center justify-between gap-3 mb-5 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full xl:w-auto text-center sm:text-left px-2">
            {!isPromotionPage && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Modern Inline Icon */}
                <div className="relative group shrink-0">
                  <div className="absolute -inset-2 bg-indigo-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <i className={`fa-solid ${currentCategory.icon} text-xl sm:text-2xl text-indigo-600 relative z-10 drop-shadow-[0_2px_10px_rgba(79,70,229,0.2)] group-hover:scale-110 transition-transform duration-300`}></i>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight whitespace-nowrap">
                    {categoryName || 'Tất cả sách'}
                  </h1>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      {books.length} sản phẩm
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isPromotionPage && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Promo Icon */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500 shadow-sm border border-rose-100/50 shrink-0 transform transition-transform hover:rotate-12 duration-300">
                  <i className="fa-solid fa-fire-flame-curved text-base sm:text-lg animate-pulse"></i>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight whitespace-nowrap">Khuyến mãi cực hot</h1>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                    <span>{books.length} ưu đãi độc quyền</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between xl:justify-end bg-slate-50/50 p-1 rounded-2xl border border-slate-200/40 w-full xl:w-auto overflow-x-auto no-scrollbar shadow-inner relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-r border-slate-200/50 mr-1 hidden md:flex bg-white rounded-xl shadow-sm z-10">
              <i className="fa-solid fa-sort-amount-down text-indigo-500 text-xs"></i>
              <span className="text-xs font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Sắp xếp</span>
            </div>

            <div className="flex items-center gap-1 relative z-10 w-full md:w-auto">
              {[
                { id: 'newest', label: 'Mới nhất', icon: 'fa-sparkles' },
                { id: 'price-low', label: 'Giá thấp', icon: 'fa-arrow-down-1-9' },
                { id: 'price-high', label: 'Giá cao', icon: 'fa-arrow-up-9-1' },
                { id: 'rating', label: 'Đánh giá', icon: 'fa-star' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`flex flex-1 md:flex-none justify-center items-center gap-1.5 px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${sortBy === option.id
                    ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100 ring-1 ring-indigo-50'
                    : 'bg-transparent text-slate-500 hover:text-indigo-600 hover:bg-white'
                    }`}
                >
                  <i className={`fa-solid ${option.icon} text-xs ${sortBy === option.id ? 'text-indigo-600' : 'text-slate-400'}`}></i>
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="inline sm:hidden">{option.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-5 mb-8">
          {books.map((book, index) => {
            if (books.length === index + 1) {
              return (
                <div ref={lastBookElementRef} key={book.id} className="fade-in-up">
                  <BookCard book={book} onAddToCart={addToCart} onQuickView={onQuickView} />
                </div>
              );
            } else {
              return (
                <div key={book.id} className="fade-in-up">
                  <BookCard book={book} onAddToCart={addToCart} onQuickView={onQuickView} />
                </div>
              )
            }
          })}
          {loading && (
            [...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <BookCardSkeleton key={`skeleton-${i}`} />
            ))
          )}
        </div>

        {!hasMore && books.length > 0 && (
          <div className="text-center mt-10 text-slate-400 text-sm pb-32 lg:pb-8">
            Bạn đã xem hết danh sách.
          </div>
        )}

        {books.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <i className="fa-solid fa-book-open-reader text-4xl text-slate-200 mb-5"></i>
            <h3 className="text-lg font-extrabold text-slate-900">Không tìm thấy sản phẩm nào</h3>
            <Link to="/" className="inline-block mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all hover:scale-105">Quay lại trang chủ</Link>
          </div>
        )}

        {isPromotionPage && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-5 group hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-lg group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 mb-1 text-sm">Giao hàng tốc hành</h4>
                <p className="text-micro text-slate-500 font-bold uppercase tracking-premium leading-relaxed">Nhận sách chỉ trong 2-3 ngày làm việc.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-5 group hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 text-lg group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-shield-heart"></i>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 mb-1 text-sm">Sách bản quyền</h4>
                <p className="text-micro text-slate-500 font-bold uppercase tracking-premium leading-relaxed">Cam kết 100% sách chính hãng.</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-start gap-5 group hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-lg group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 mb-1 text-sm">Hỗ trợ 24/7</h4>
                <p className="text-micro text-slate-500 font-bold uppercase tracking-premium leading-relaxed">Đội ngũ hỗ trợ nhiệt tình, giải đáp mọi thắc mắc.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;

