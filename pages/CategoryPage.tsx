
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/db';
import { CATEGORIES } from '../constants';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import { Book } from '../types';

interface CategoryPageProps {
  onAddToCart: (book: Book) => void;
}

const ITEMS_PER_PAGE = 10;

const CategoryPage: React.FC<CategoryPageProps> = ({ onAddToCart }) => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // FIX: Load books from DB
    const loadBooks = async () => {
      const books = await db.getBooks();
      setAllBooks(books);
    };
    loadBooks();

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

  const isPromotionPage = categoryName?.toLowerCase().includes('sale') || categoryName?.toLowerCase().includes('khuyến mãi');

  const filteredBooks = useMemo(() => {
    let books = categoryName && categoryName !== 'Tất cả sách'
      ? allBooks.filter(b => b.category.toLowerCase() === categoryName.toLowerCase())
      : allBooks;

    if (sortBy === 'price-low') books = [...books].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') books = [...books].sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') books = [...books].sort((a, b) => b.rating - a.rating);
    
    return books;
  }, [allBooks, categoryName, sortBy]);

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryName, sortBy]);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentCategory = CATEGORIES.find(c => c.name.toLowerCase() === categoryName?.toLowerCase()) || CATEGORIES[0];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20" ref={topRef}>
      {isPromotionPage ? (
        <section className="bg-indigo-600 pt-32 pb-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-20"></div>
          <div className="w-[92%] xl:w-[60%] mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="text-white text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 rounded-full text-xs font-black uppercase tracking-widest mb-6 animate-bounce">
                  <i className="fa-solid fa-bolt"></i>
                  Flash Sale Đang Diễn Ra
                </div>
                <h1 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter">
                  Đại Tiệc <span className="text-amber-400">Ưu Đãi</span>
                </h1>
                <p className="text-indigo-100 text-lg max-w-xl mb-10 font-medium opacity-90">
                  Cơ hội sở hữu những tựa sách tinh hoa với mức giá cực kỳ hấp dẫn. Giảm giá lên đến 50%!
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-4">
                  {[
                    { label: 'Giờ', value: timeLeft.hours },
                    { label: 'Phút', value: timeLeft.minutes },
                    { label: 'Giây', value: timeLeft.seconds }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black mb-2 border border-white/20">
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block relative group">
                <div className="absolute -inset-4 bg-amber-400 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img 
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop" 
                  alt="Promotion" 
                  className="w-[450px] h-[300px] object-cover rounded-[3rem] shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="h-32"></div>
      )}

      <div className="w-[92%] xl:w-[60%] mx-auto px-4 -mt-10 relative z-20">
        {/* Category Navigation Bar - New Feature */}
        <div className="mb-8 flex overflow-x-auto pb-4 gap-4 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat, i) => {
            const isActive = categoryName === cat.name || (!categoryName && cat.name === 'Tất cả sách');
            const colors = [
              { active: 'bg-indigo-600 text-white shadow-indigo-200', inactive: 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600' },
              { active: 'bg-rose-500 text-white shadow-rose-200', inactive: 'bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-500' },
              { active: 'bg-emerald-500 text-white shadow-emerald-200', inactive: 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-500' },
              { active: 'bg-amber-500 text-white shadow-amber-200', inactive: 'bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-500' },
              { active: 'bg-cyan-500 text-white shadow-cyan-200', inactive: 'bg-white text-slate-600 hover:bg-cyan-50 hover:text-cyan-500' },
              { active: 'bg-violet-500 text-white shadow-violet-200', inactive: 'bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-500' },
            ];
            const color = colors[i % colors.length];
            
            return (
              <Link
                key={i}
                to={`/category/${cat.name}`}
                className={`flex-shrink-0 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all duration-300 border border-slate-100 shadow-sm ${
                  isActive ? `${color.active} shadow-xl scale-105 border-transparent` : color.inactive
                }`}
              >
                <i className={`fa-solid ${cat.icon} ${isActive ? 'text-sm' : 'text-base opacity-70'}`}></i>
                {cat.name}
              </Link>
            );
          })}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex flex-wrap items-center gap-3">
             {!isPromotionPage && (
               <div className="flex items-center gap-4 mr-4">
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                   <i className={`fa-solid ${currentCategory.icon} text-xl`}></i>
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-0.5">Danh mục</p>
                   <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{categoryName || 'Tất cả sách'}</h2>
                 </div>
               </div>
             )}
             {isPromotionPage && (
               <div className="flex gap-2">
                 <button className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-100">Sale 50%</button>
                 <button className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-100">Hot</button>
                 <button className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">Freeship</button>
               </div>
             )}
          </div>
          <div className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 w-full md:w-auto group focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-inner">
            <div className="flex items-center gap-2 pl-3">
              <i className="fa-solid fa-arrow-down-wide-short text-slate-400 text-xs"></i>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Sắp xếp theo</span>
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] font-black text-slate-900 outline-none pr-6 py-2 cursor-pointer flex-1 md:flex-none uppercase tracking-wider"
            >
              <option value="newest">Mới nhất</option>
              <option value="price-low">Giá: Thấp đến Cao</option>
              <option value="price-high">Giá: Cao đến Thấp</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </div>
        </div>

        {paginatedBooks.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-8 mb-16">
              {paginatedBooks.map(book => (
                <BookCard key={book.id} book={book} onAddToCart={onAddToCart} />
              ))}
            </div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
          </>
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <i className="fa-solid fa-book-open-reader text-5xl text-slate-200 mb-6"></i>
            <h3 className="text-xl font-black text-slate-900">Không tìm thấy sản phẩm nào</h3>
            <Link to="/" className="inline-block mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Quay lại trang chủ</Link>
          </div>
        )}

        {isPromotionPage && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-start gap-6 group hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-truck-fast"></i>
              </div>
              <div>
                <h4 className="font-black text-slate-900 mb-1">Giao hàng tốc hành</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Nhận sách chỉ trong 2-3 ngày làm việc.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-start gap-6 group hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 text-xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-shield-heart"></i>
              </div>
              <div>
                <h4 className="font-black text-slate-900 mb-1">Sách bản quyền</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Cam kết 100% sách chính hãng.</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-start gap-6 group hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 text-xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <h4 className="font-black text-slate-900 mb-1">Hỗ trợ 24/7</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Đội ngũ hỗ trợ nhiệt tình, giải đáp mọi thắc mắc.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
