
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '@/services/db';
import { BookCard, QuickViewModal } from '../features/books';
import Pagination from '../components/ui/Pagination';
import { Book, CategoryInfo } from '../types/';
import { BookCardSkeleton } from '../components/common/Skeleton';
import SEO from '../components/common/SEO';

import { useCart } from '../contexts/CartContext';
import { useBooks } from '../contexts/BookContext';

const ITEMS_PER_PAGE = 10;

const CategoryPage: React.FC<{ onQuickView?: (book: Book) => void }> = ({ onQuickView }) => {
  const { addToCart } = useCart();
  const { categories } = useBooks(); // Only needed for category info

  const { categoryName } = useParams();

  // State
  const [books, setBooks] = useState<Book[]>([]);
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
      const result = await db.getBooksPaginated(ITEMS_PER_PAGE, currentLastDoc, categoryName, dbSort);

      setBooks(prev => isInitial ? result.books : [...prev, ...result.books]);
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

  // Trigger load on category/sort change
  useEffect(() => {
    setBooks([]);
    setLastDoc(null);
    setHasMore(true);
    loadBooks(true);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [categoryName, sortBy]);

  const isPromotionPage = categoryName?.toLowerCase().includes('sale') || categoryName?.toLowerCase().includes('khuyến mãi');

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
        <section className="bg-indigo-600 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-20"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="text-white text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500 rounded-full text-micro font-bold uppercase tracking-premium mb-4 animate-bounce">
                  <i className="fa-solid fa-bolt"></i>
                  Flash Sale Đang Diễn Ra
                </div>
                <h1 className="text-4xl lg:text-6xl font-extrabold mb-4 tracking-tight">
                  Đại Tiệc <span className="text-amber-400">Ưu Đãi</span>
                </h1>
                <p className="text-indigo-100 text-base max-w-lg mb-8 font-medium opacity-90">
                  Cơ hội sở hữu những tựa sách tinh hoa với mức giá cực kỳ hấp dẫn. Giảm giá lên đến 50%!
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  {[
                    { label: 'Giờ', value: timeLeft.hours },
                    { label: 'Phút', value: timeLeft.minutes },
                    { label: 'Giây', value: timeLeft.seconds }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-xl font-extrabold mb-1.5 border border-white/20">
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      <span className="text-micro font-bold uppercase tracking-premium opacity-60">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block relative group">
                <div className="absolute -inset-4 bg-amber-400 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop"
                  alt="Promotion"
                  className="w-[380px] h-[260px] object-cover rounded-3xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <div
        ref={topRef}
        className={`max-w-7xl mx-auto px-4 relative z-20 scroll-mt-20 lg:scroll-mt-24 ${isPromotionPage ? '-mt-8' : 'mt-2'}`}
      >
        <div className="sticky top-[64px] lg:top-[80px] z-40 mb-4 p-2.5 bg-white/80 backdrop-blur-lg rounded-[2rem] border border-white/50 shadow-xl shadow-slate-200/50 flex items-center gap-3 overflow-hidden group transition-all duration-300">
          <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 border-r border-slate-200 mr-2 bg-white/50 rounded-l-[1.8rem]">
            <i className="fa-solid fa-layer-group text-indigo-500"></i>
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest hidden sm:block">Chân dung tri thức</span>
          </div>

          <div className="flex-1 flex overflow-x-auto pb-1 gap-3 no-scrollbar scroll-smooth py-1 relative pr-12">
            {[{ name: 'Tất cả sách', icon: 'fa-book-open' }, ...categories].map((cat, i) => {
              const isActive = categoryName === cat.name || (!categoryName && cat.name === 'Tất cả sách');
              const color = [
                { active: 'bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-50', inactive: 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200' },
                { active: 'bg-rose-500 text-white shadow-rose-200 ring-4 ring-rose-50', inactive: 'bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200' },
                { active: 'bg-emerald-500 text-white shadow-emerald-200 ring-4 ring-emerald-50', inactive: 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200' },
                { active: 'bg-amber-500 text-white shadow-amber-200 ring-4 ring-amber-50', inactive: 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200' },
                { active: 'bg-cyan-500 text-white shadow-cyan-200 ring-4 ring-cyan-50', inactive: 'bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-500 hover:border-cyan-200' },
                { active: 'bg-violet-500 text-white shadow-violet-200 ring-4 ring-violet-50', inactive: 'bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-500 hover:border-violet-200' },
              ][i % 6];

              return (
                <Link
                  key={i}
                  to={`/category/${cat.name}`}
                  className={`flex-shrink-0 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-premium flex items-center gap-3 transition-all duration-500 border border-slate-100 relative group/cat ${isActive ? `${color.active} z-10 -translate-y-1` : `${color.inactive} hover:-translate-y-0.5 shadow-sm`
                    }`}
                >
                  <i className={`fa-solid ${cat.icon} ${isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover/cat:scale-110 group-hover/cat:text-current transition-all'}`}></i>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
            {/* Scroll Indicator Gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-20"></div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {!isPromotionPage && (
              <div className="flex items-center gap-3.5 mr-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <i className={`fa-solid ${currentCategory.icon} text-xl`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-micro font-bold uppercase tracking-premium text-indigo-500">Danh mục</p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <p className="text-micro font-bold uppercase tracking-premium text-slate-400">
                      {books.length}{hasMore ? '+' : ''} sản phẩm
                    </p>
                  </div>
                  <h1 className="text-xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{categoryName || 'Tất cả sách'}</h1>
                </div>
              </div>
            )}
            {isPromotionPage && (
              <div className="flex flex-col gap-1 mr-4">
                <div className="flex items-center gap-2">
                  <p className="text-micro font-bold uppercase tracking-premium text-rose-500">Chương trình</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <p className="text-micro font-bold uppercase tracking-premium text-slate-400">
                    {books.length}{hasMore ? '+' : ''} ưu đãi
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-micro font-bold uppercase tracking-premium border border-rose-100">Sale 50%</button>
                  <button className="px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-micro font-bold uppercase tracking-premium border border-amber-100">Hot</button>
                  <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-micro font-bold uppercase tracking-premium border border-emerald-100">Freeship</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto no-scrollbar shadow-inner">
            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-200 mr-1 hidden lg:flex">
              <i className="fa-solid fa-sort-amount-down text-xs text-slate-400"></i>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sắp xếp</span>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: 'newest', label: 'Mới nhất', icon: 'fa-clock' },
                { id: 'price-low', label: 'Giá thấp', icon: 'fa-chevron-up' },
                { id: 'price-high', label: 'Giá cao', icon: 'fa-chevron-down' },
                { id: 'rating', label: 'Đánh giá', icon: 'fa-star' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${sortBy === option.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-100 shadow-sm'
                    }`}
                >
                  <i className={`fa-solid ${option.icon} ${sortBy === option.id ? 'text-white' : 'text-slate-300 group-hover:text-indigo-400'}`}></i>
                  {option.label}
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
          <div className="text-center mt-10 text-slate-400 text-sm pb-8">
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
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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

