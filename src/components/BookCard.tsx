
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import { useAuth } from '../AuthContext';

interface BookCardProps {
  book: Book;
  onAddToCart: (book: Book, quantity?: number, startPos?: { x: number, y: number }) => void;
  onQuickView?: (book: Book) => void;
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

const BookCard: React.FC<BookCardProps> = ({ book, onAddToCart, onQuickView }) => {
  const { wishlist, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const isWishlisted = useMemo(() => wishlist.some(b => b.id === book.id), [wishlist, book.id]);
  const isAvailable = book.isAvailable !== false;
  const hasStock = book.stockQuantity > 0;

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
        className={`relative group flex flex-col h-[340px] bg-white rounded-[2rem] p-3 border border-slate-200/60 shadow-sm transition-all duration-500 w-full ${(!isAvailable || !hasStock) ? 'grayscale opacity-60' : 'hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-300/50 hover:ring-4 hover:ring-indigo-500/5'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow Effect on Hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-rose-500/10 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        {/* Media Container - Fixed Height */}
        <div className="relative h-[170px] w-full rounded-[1.5rem] overflow-hidden bg-slate-50 mb-3 flex-shrink-0">
          
          {/* Status Badges */}
          <div className={`absolute top-2 left-2 z-30 flex flex-col gap-1.5 items-start transition-all duration-300 ${isHovered ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            {!isAvailable && (
              <div className="px-2.5 py-1 bg-slate-900/90 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-slate-900/20 border border-white/10 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-ban text-[9px] text-slate-400"></i>
                Ngừng kinh doanh
              </div>
            )}
            {isAvailable && !hasStock && (
              <div className="px-2.5 py-1 bg-slate-700/90 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-slate-700/20 border border-white/10 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-box-open text-[9px] text-slate-400"></i>
                Hết hàng
              </div>
            )}
            {book.badge && (
              <div className="px-2.5 py-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-rose-500/30 border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-crown text-[9px] text-yellow-200"></i>
                {book.badge}
              </div>
            )}
            {!book.badge && book.rating >= 4.8 && (
              <div className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-orange-500/30 border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-fire text-[9px] text-white"></i>
                Hot
              </div>
            )}
          </div>

          {/* Rating Badge on Image */}
          <div className={`absolute bottom-2 right-2 z-30 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-md flex items-center gap-1 shadow-sm border border-white/50 transition-all duration-300 ${isHovered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
             <i className="fa-solid fa-star text-xs text-amber-400"></i>
             <span className="text-xs font-bold text-slate-700">{book.rating}</span>
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
              animate={isHovered ? { scale: 1.05, filter: 'blur(1px)' } : { scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.5 }}
              className={`w-full h-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </Link>

          {/* Quick Info Overlay on Hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex flex-col justify-between p-3"
              >
                {/* Top Quick Actions */}
                <div className="flex justify-between items-start translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex flex-col gap-1">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {book.category}
                    </span>
                  </div>
                </div>

                {/* Center Button */}
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onQuickView) onQuickView(book);
                  }}
                  className="mx-auto w-12 h-12 bg-white text-slate-900 rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all duration-300"
                >
                  <i className="fa-solid fa-expand text-sm"></i>
                </motion.button>

                {/* Bottom Quick Stats */}
                <div className="translate-y-[20px] group-hover:translate-y-0 transition-transform duration-300 flex flex-col gap-2">
                   <div className="flex justify-around bg-white/90 backdrop-blur-md rounded-xl py-2 px-3 border border-white/20">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-700">{book.pages}</span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-tighter">Trang</span>
                      </div>
                      <div className="w-px h-4 bg-slate-200 self-center"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-emerald-600">Free</span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-tighter">Ship</span>
                      </div>
                      <div className="w-px h-4 bg-slate-200 self-center"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-indigo-600">{book.language === 'Tiếng Việt' ? 'VN' : 'EN'}</span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-tighter">Ngôn ngữ</span>
                      </div>
                   </div>
                   <p className="text-xs text-white/90 font-medium line-clamp-1 italic text-center">
                      "{book.description?.substring(0, 40)}..."
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Container */}
        <div 
          onClick={() => navigate(`/book/${book.id}`)}
          className="flex flex-col flex-grow min-h-0 justify-between cursor-pointer group/info"
        >
          <div>
            <div className="block mb-0.5">
              <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 group-hover/info:text-indigo-600 transition-colors">
                {book.title}
              </h3>
            </div>
            <p className="text-slate-500 text-xs font-medium truncate italic">{book.author}</p>
          </div>
          
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-auto">
            <div className="flex flex-col">
              {book.originalPrice && book.originalPrice > book.price && (
                <span className="text-[10px] uppercase font-bold text-slate-400 line-through decoration-rose-400/50">
                  {formatPrice(book.originalPrice)}
                </span>
              )}
              <span className="text-base font-black text-rose-600 leading-none">
                {formatPrice(book.price)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleWishlist}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                  isWishlisted 
                    ? 'bg-rose-50 text-rose-500 border-rose-100 shadow-sm' 
                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-rose-500 hover:bg-rose-50'
                }`}
              >
                <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart(book, 1, { x: e.clientX, y: e.clientY });
                }}
                disabled={!hasStock || !isAvailable}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  (!hasStock || !isAvailable)
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-lg shadow-indigo-200 active:scale-95'
                }`}
              >
                <i className="fa-solid fa-cart-shopping text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookCard;

