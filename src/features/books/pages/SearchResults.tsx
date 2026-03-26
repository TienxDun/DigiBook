
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { db } from '@/services/db';
import { Book } from '@/shared/types';
import { BookCardSkeleton } from '@/shared/components';
import { useBooks } from '@/features/books';
import BookCard from '../components/BookCard/index';
import { useCart } from '@/features/cart';

const SearchResults: React.FC<{ onQuickView?: (book: Book) => void }> = ({ onQuickView }) => {
  const { addToCart } = useCart();
  const { allBooks: contextBooks } = useBooks();
  const { query } = useParams();

  // State
  const [allResults, setAllResults] = useState<Book[]>([]);
  const [displayBooks, setDisplayBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const observer = React.useRef<IntersectionObserver | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);

  // Fetch and Filter
  useEffect(() => {
    let isActive = true;

    if (!query) {
      setAllResults([]);
      setDisplayBooks([]);
      setLoading(false);
      setSearching(false);
      return () => {
        isActive = false;
      };
    }

    const timer = window.setTimeout(() => {
      if (!isActive) return;

      const performSearch = async () => {
        setLoading(true);
        setSearching(true);
        try {
          // Fetch ALL books to ensure accurate search
          // Note: For large datasets, this should be replaced with server-side search (e.g., Algolia)
          const allBooks = await db.getBooks();

          const q = query.toLowerCase();
          const results = allBooks.filter(book =>
            book.title.toLowerCase().includes(q) ||
            book.author.toLowerCase().includes(q) ||
            book.isbn.toLowerCase().includes(q) ||
            book.category.toLowerCase().includes(q)
          );

          if (!isActive) return;
          setAllResults(results);
          setDisplayBooks(results.slice(0, ITEMS_PER_PAGE));
          setPage(1);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          if (isActive) {
            setLoading(false);
            setSearching(false);
          }
        }
      };

      performSearch();
    }, 350);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  // Infinite Scroll
  const lastBookElementRef = React.useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayBooks.length < allResults.length) {
        setPage(prev => {
          const nextPage = prev + 1;
          setDisplayBooks(allResults.slice(0, nextPage * ITEMS_PER_PAGE));
          return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, displayBooks.length, allResults.length]);

  return (
    <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20 pb-32 lg:pb-16 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-10">
        <div className="bg-white/70 backdrop-blur-3xl p-4 sm:p-5 rounded-[2.2rem] border border-white/60 ring-1 ring-black/[0.03] shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group min-h-[100px] sm:min-h-[110px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-3xl rounded-full -z-10 translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-100/50 transition-colors duration-700"></div>

          <div className="relative z-10 flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
              <i className="fa-solid fa-magnifying-glass text-lg sm:text-xl"></i>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-slate-900 tracking-tighter leading-none truncate">
                  {loading ? 'Đang tìm...' : (
                    <>
                      Kết quả cho <span className="text-indigo-600">"{query}"</span>
                    </>
                  )}
                </h1>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50/50 rounded-lg ring-1 ring-indigo-100/50 shrink-0">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Discovery</p>
                </div>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Tìm thấy <span className="text-indigo-600 font-black">{allResults.length}</span> vật phẩm tương ứng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <Link
              to="/"
              className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-primary shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-primary/20 transition-all flex items-center gap-2 active:scale-95 group/btn"
            >
              <i className="fa-solid fa-arrow-left group-hover/btn:-translate-x-1 transition-transform"></i>
              Quay lại
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading && allResults.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
            {[...Array(10)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : allResults.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
              {displayBooks.map((book, index) => {
                if (displayBooks.length === index + 1) {
                  return (
                    <div ref={lastBookElementRef} key={book.id} className="fade-in-up">
                      <BookCard book={book} onAddToCart={addToCart} onQuickView={onQuickView} />
                    </div>
                  )
                } else {
                  return (
                    <div key={book.id} className="fade-in-up">
                      <BookCard book={book} onAddToCart={addToCart} onQuickView={onQuickView} />
                    </div>
                  )
                }
              })}

              {/* Show skeleton when loading more pages? No, it's instant from memory usually. */}
            </div>

            {displayBooks.length < allResults.length && (
              <div className="flex justify-center mt-8">
                <BookCardSkeleton />
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-8">
                <i className="fa-solid fa-book-open-reader text-5xl"></i>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-4 uppercase tracking-premium">Không tìm thấy tác phẩm</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed font-medium mb-10">
                Rất tiếc, DigiBook không tìm thấy kết quả phù hợp với từ khóa này. <br /> Hãy thử tìm kiếm theo tên tác giả hoặc thể loại xem sao nhé!
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Văn học', 'Kinh tế', 'Kỹ năng', 'Thiếu nhi'].map(tag => (
                  <Link key={tag} to={`/category/${tag}`} className="px-5 py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-full text-micro font-bold uppercase tracking-premium transition-all">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Section if no results */}
      {allResults.length === 0 && (
        <div className="max-w-7xl mx-auto mt-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Có thể bạn quan tâm</h2>
              <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">Gợi ý dành riêng cho bạn</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {contextBooks.slice(0, 6).map(book => (
              <BookCard key={book.id} book={book} onAddToCart={addToCart} onQuickView={onQuickView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;

