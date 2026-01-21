
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/services/db';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import { BookCardSkeleton } from '../components/Skeleton';

import { useCart } from '../contexts/CartContext';
import { useBooks } from '../contexts/BookContext';

const SearchResults: React.FC<{ onQuickView?: (book: Book) => void }> = ({ onQuickView }) => {
  const { addToCart } = useCart();
  const { allBooks, loading } = useBooks();
  const { query } = useParams<{ query: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);


  const filteredBooks = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allBooks.filter(book =>
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.isbn.toLowerCase().includes(q) ||
      book.category.toLowerCase().includes(q)
    );
  }, [allBooks, query]);

  return (
    <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20 pb-16 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg mb-4">
              <i className="fa-solid fa-magnifying-glass text-indigo-500 text-xs"></i>
              <p className="text-micro font-bold text-indigo-500 uppercase tracking-premium">Kết quả tìm kiếm</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {loading ? 'Đang tìm kiếm...' : (
                <>
                  Tìm thấy <span className="text-indigo-600">{filteredBooks.length}</span> kết quả <br className="hidden lg:block" />
                  cho từ khóa "<span className="italic text-slate-400 font-medium">{query}</span>"
                </>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-micro font-bold uppercase tracking-premium text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm">
              <i className="fa-solid fa-arrow-left"></i> Quay lại
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
            {[...Array(10)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
            {filteredBooks.map((book) => (
              <div key={book.id} className="fade-in-up">
                <BookCard book={book} onAddToCart={addToCart} />
              </div>
            ))}
          </div>
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
      {filteredBooks.length === 0 && (
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
            {allBooks.slice(0, 6).map(book => (
              <BookCard key={book.id} book={book} onAddToCart={addToCart} onQuickView={onQuickView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;

