
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
        y: -5,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full h-full"
    >
      <div 
        className={`relative group flex flex-col h-[330px] bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 w-full ${stockQuantity <= 0 ? 'grayscale opacity-60' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Media Container - Fixed Height */}
        <div className="relative h-[180px] w-full rounded-xl overflow-hidden bg-slate-50 mb-3 flex-shrink-0">
          
          {/* Status Badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
            {stockQuantity <= 0 && (
              <span className="px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/10">Hết hàng</span>
            )}
            {book.badge && (
              <span className="px-2 py-0.5 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/20">{book.badge}</span>
            )}
            {!book.badge && book.rating >= 4.8 && (
              <span className="px-2 py-0.5 bg-rose-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/20">Hot</span>
            )}
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
              isWishlisted 
                ? 'bg-rose-500 text-white shadow-sm' 
                : 'bg-white/90 text-slate-400 hover:text-rose-500 shadow-sm hover:bg-white'
            }`}
          >
            <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-[12px]`}></i>
          </button>

          {/* Rating Badge on Image */}
          <div className="absolute bottom-2 right-2 z-20 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-md flex items-center gap-1 shadow-sm border border-white/50">
             <i className="fa-solid fa-star text-[10px] text-amber-400"></i>
             <span className="text-[11px] font-bold text-slate-700">{book.rating}</span>
          </div>

          {/* Book Image */}
          <Link to={`/book/${book.id}`} className="block w-full h-full">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                <i className="fa-solid fa-book-open text-slate-300"></i>
              </div>
            )}
            <motion.img 
              src={getOptimizedImageUrl(book.cover)} 
              alt={book.title} 
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`w-full h-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </Link>
        </div>

        {/* Info Container */}
        <div className="flex flex-col flex-grow min-h-0 justify-between">
          <div>
            <Link to={`/book/${book.id}`} className="block group/title mb-1">
              <h3 className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-2 group-hover/title:text-indigo-600 transition-colors">
                {book.title}
              </h3>
            </Link>
            <p className="text-slate-500 text-xs font-medium truncate">{book.author}</p>
          </div>
          
          <div className="pt-2 flex items-end justify-between border-t border-slate-50 mt-2">
            <div className="flex flex-col">
              {book.original_price && (
                <span className="text-[11px] text-slate-400 line-through">
                  {formatPrice(book.original_price)}
                </span>
              )}
              <span className="text-[14px] font-bold text-slate-900 leading-tight">
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
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                stockQuantity <= 0 
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-sm active:scale-95'
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
