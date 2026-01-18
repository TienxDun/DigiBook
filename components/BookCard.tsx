
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import { useAuth } from '../AuthContext';
import { db } from '../services/db';

interface BookCardProps {
  book: Book;
  onAddToCart: (book: Book) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const getOptimizedImageUrl = (url: string) => {
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format,compress&fm=webp&q=80&w=500&fit=max`;
  }
  return url;
};

const BookCard: React.FC<BookCardProps> = ({ book, onAddToCart }) => {
  const { wishlist, toggleWishlist } = useAuth();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const isWishlisted = useMemo(() => wishlist.some(b => b.id === book.id), [wishlist, book.id]);

  useEffect(() => {
    const fetchStock = async () => {
      const dbBook = await db.getBookById(book.id);
      if (dbBook) setStockQuantity(dbBook.stock_quantity);
    };
    fetchStock();
  }, [book.id]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(book);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -10,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full h-full"
    >
      <div 
        className={`relative group flex flex-col h-full bg-white rounded-3xl p-3.5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(79,70,229,0.15)] transition-all duration-500 w-full ring-1 ring-transparent hover:ring-indigo-100/50 ${stockQuantity <= 0 ? 'grayscale opacity-60' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Media Container - Optimized Aspect Ratio 3:4 */}
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-50 mb-3 border border-slate-50 flex-shrink-0 perspective-1000">
          {/* Shine Effect Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <div className={`absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/20 to-transparent skew-x-[-25deg] transition-transform duration-1000 ease-in-out ${isHovered ? 'translate-x-[200%]' : '-translate-x-full'}`} />
          </div>

          {/* Status Badges - Glassmorphism Refined */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5 items-start">
            {stockQuantity <= 0 && (
              <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-[0.1em] rounded-lg border border-white/10 shadow-xl">Hết hàng</span>
            )}
            {book.badge && (
              <span className="px-2.5 py-1 bg-indigo-600/80 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-[0.1em] rounded-lg border border-white/20 shadow-xl shadow-indigo-500/20">{book.badge}</span>
            )}
            {!book.badge && book.rating >= 4.8 && (
              <span className="px-2.5 py-1 bg-rose-500/80 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-[0.1em] rounded-lg border border-white/20 shadow-xl shadow-rose-500/20">Tuyệt hảo</span>
            )}
          </div>

          {/* Wishlist Button - Floating Glass */}
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 transform ${isHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0'} ${
              isWishlisted 
                ? 'bg-rose-500 text-white shadow-lg' 
                : 'bg-white/80 backdrop-blur-md text-slate-500 hover:text-rose-500 shadow-xl hover:bg-white hover:scale-110'
            }`}
          >
            <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-[12px]`}></i>
          </button>

          {/* Book Image with Depth Effect */}
          <Link to={`/book/${book.id}`} className="block w-full h-full overflow-hidden relative">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                <i className="fa-solid fa-book-open text-slate-200 text-xl"></i>
              </div>
            )}
            <motion.img 
              src={getOptimizedImageUrl(book.cover)} 
              alt={book.title} 
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
              animate={isHovered ? {
                scale: 1.12,
                rotate: 1,
              } : {
                scale: 1,
                rotate: 0,
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full h-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Ambient Dark Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
          </Link>
        </div>

        {/* Info Container - Editorial Style */}
        <div className="flex flex-col flex-grow px-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50 uppercase tracking-[0.1em]">
              {book.category}
            </span>
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-star text-[8px] text-amber-400"></i>
              <span className="text-[10px] font-extrabold text-slate-700">{book.rating}</span>
            </div>
          </div>

          <Link to={`/book/${book.id}`} className="block mb-0.5 group/title">
            <h3 className="font-extrabold text-slate-900 text-xs lg:text-[13px] leading-tight line-clamp-2 min-h-[2.2rem] group-hover/title:text-indigo-600 transition-colors duration-300 tracking-tight">
              {book.title}
            </h3>
          </Link>
          <p className="text-slate-400 text-[10px] font-bold mb-2 truncate uppercase tracking-widest opacity-80">{book.author}</p>
          
          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              {book.original_price && (
                <span className="text-[10px] text-slate-300 line-through font-bold tracking-tight">
                  {formatPrice(book.original_price)}
                </span>
              )}
              <span className="text-[14px] font-black text-slate-900 tracking-tighter">
                {formatPrice(book.price)}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(book);
              }}
              disabled={stockQuantity <= 0}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${
                stockQuantity <= 0 
                  ? 'bg-slate-50 text-slate-200 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-[0_8px_16px_-4px_rgba(79,70,229,0.4)] shadow-lg active:scale-90'
              }`}
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookCard;
