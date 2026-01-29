
import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '@/shared/types';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';

interface AuthorBookCardProps {
  book: Book;
  index: number;
  onQuickView?: (book: Book) => void;
}

const AuthorBookCard: React.FC<AuthorBookCardProps> = ({ book, index, onQuickView }) => {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useAuth();

  const isWishlisted = wishlist.some(b => b.id === book.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white rounded-3xl p-3 md:p-4 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-500"
    >
      <div className="flex gap-3 md:gap-5">
        {/* Book Cover */}
        <Link
          to={`/book/${book.slug || book.id}`}
          className="relative w-24 md:w-28 h-36 md:h-40 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500 block"
        >
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 transition-opacity duration-300 group-hover:opacity-0">
            {book.badge && (
              <div className="px-2 py-0.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-rose-500/30 border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-crown text-[9px] text-yellow-200"></i>
                {book.badge}
              </div>
            )}
            {!book.badge && book.rating >= 4.8 && (
              <div className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-orange-500/30 border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-fire text-[9px]"></i>
                Hot
              </div>
            )}
          </div>
        </Link>

        {/* Book Info */}
        <div className="flex-1 flex flex-col justify-between py-0.5 md:py-1 min-w-0">
          <div>
            <div className="flex justify-between items-start gap-2 mb-1">
              <Link to={`/book/${book.slug || book.id}`} className="flex-1">
                <h3 className="font-extrabold text-slate-800 text-sm lg:text-base leading-tight line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors">
                  {book.title}
                </h3>
              </Link>
              <button
                onClick={() => toggleWishlist(book)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isWishlisted ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
              >
                <i className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart text-xs`}></i>
              </button>
            </div>

            <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
              {book.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-2">
              {/* Rating */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                <i className="fa-solid fa-star text-[10px] text-amber-500"></i>
                <span className="text-[10px] font-bold text-amber-700">{book.rating || 5.0}</span>
              </div>

              {/* Category */}
              {book.category && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100/50">
                  <i className="fa-solid fa-tag text-[10px] text-indigo-400"></i>
                  <span className="text-[10px] font-bold text-indigo-700">{book.category}</span>
                </div>
              )}

              {/* Pages */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                <i className="fa-solid fa-layer-group text-[10px] text-slate-400"></i>
                <span className="text-[10px] font-bold text-slate-600">{book.pages} trang</span>
              </div>

              {/* Year & Publisher */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 max-w-[180px]">
                <i className="fa-solid fa-building-columns text-[10px] text-slate-400"></i>
                <span className="text-[10px] font-bold text-slate-600 truncate">
                  {book.publishYear} {book.publisher && `• ${book.publisher}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex flex-col">
              {book.originalPrice && (
                <span className="text-xs text-slate-400 line-through leading-none mb-1">
                  {formatPrice(book.originalPrice)}
                </span>
              )}
              <span className="text-base font-black text-rose-600 leading-none">
                {formatPrice(book.price)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onQuickView?.(book)}
                className="w-9 h-9 border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-all"
              >
                <i className="fa-solid fa-expand text-xs"></i>
              </button>
              <button
                onClick={(e) => addToCart(book, 1, { x: e.clientX, y: e.clientY })}
                disabled={book.stockQuantity <= 0}
                className="px-4 h-9 bg-slate-900 text-white rounded-xl text-micro font-bold uppercase tracking-premium flex items-center justify-center gap-2 hover:bg-indigo-600 disabled:bg-slate-200 transition-all shadow-lg shadow-slate-200"
              >
                {book.stockQuantity > 0 ? (
                  <>
                    <i className="fa-solid fa-cart-plus text-xs"></i>
                    Thêm
                  </>
                ) : 'Hết hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthorBookCard;
