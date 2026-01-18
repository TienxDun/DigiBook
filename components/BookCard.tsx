
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
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div 
        className={`relative group flex flex-col h-full bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 w-full ring-1 ring-transparent hover:ring-indigo-100/50 ${stockQuantity <= 0 ? 'grayscale opacity-60' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Media Container - Fixed Aspect Ratio 3:4 */}
        <div className="relative aspect-[3/4.2] w-full rounded-xl overflow-hidden bg-slate-50 mb-4 border border-slate-50 flex-shrink-0">
          {/* Status Badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5 items-start">
            {stockQuantity <= 0 && (
              <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest rounded-full border border-white/10 shadow-lg">Hết hàng</span>
            )}
            {book.badge && (
              <span className="px-2 py-0.5 bg-rose-500/90 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest rounded-full border border-white/20 shadow-lg shadow-rose-500/20">{book.badge}</span>
            )}
            {!book.badge && book.rating >= 4.8 && (
              <span className="px-2 py-0.5 bg-amber-500/90 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest rounded-full border border-white/20 shadow-lg shadow-amber-500/20">Hot</span>
            )}
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 transform ${isHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0'} ${
              isWishlisted 
                ? 'bg-rose-500 text-white shadow-lg' 
                : 'bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 shadow-md hover:scale-110'
            }`}
          >
            <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-[10px]`}></i>
          </button>

          {/* Book Image */}
          <Link to={`/book/${book.id}`} className="block w-full h-full overflow-hidden">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                <i className="fa-solid fa-book-open text-slate-200 text-xl"></i>
              </div>
            )}
            <img 
              src={getOptimizedImageUrl(book.cover)} 
              alt={book.title} 
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
              className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          </Link>
        </div>

        {/* Info Container */}
        <div className="flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-widest">
              {book.category}
            </span>
            <div className="flex items-center gap-1">
              <i className="fa-solid fa-star text-[9px] text-amber-500"></i>
              <span className="text-[9px] font-bold text-slate-600">{book.rating}</span>
            </div>
          </div>

          <Link to={`/book/${book.id}`} className="block mb-1 group/title">
            <h3 className="font-bold text-slate-800 text-xs leading-tight line-clamp-2 min-h-[2.5rem] group-hover/title:text-indigo-600 transition-colors duration-300">
              {book.title}
            </h3>
          </Link>
          <p className="text-slate-400 text-[10px] font-medium mb-2 truncate uppercase tracking-tight">{book.author}</p>
          
          <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
            <div className="flex flex-col">
              {book.original_price && (
                <span className="text-[10px] text-slate-300 line-through font-bold">
                  {formatPrice(book.original_price)}
                </span>
              )}
              <span className="text-sm font-extrabold text-slate-900">
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
                  ? 'bg-slate-50 text-slate-200 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-md active:scale-90'
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
