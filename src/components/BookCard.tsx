
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types/';
import { useAuth } from '../contexts/AuthContext';

interface BookCardProps {
  book: Book;
  onAddToCart: (book: Book, quantity?: number, startPos?: { x: number, y: number }) => void;
  onQuickView?: (book: Book) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const getOptimizedImageUrl = (url: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    const sizes = {
      small: 'w=200&h=300&fit=max',
      medium: 'w=300&h=450&fit=max',
      large: 'w=500&h=750&fit=max'
    };
    return `${baseUrl}?auto=format,compress&fm=webp&q=80&${sizes[size]}`;
  }
  return url;
};

const getImageSrcSet = (url: string) => {
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format,compress&fm=webp&q=80&w=300&h=450&fit=max 1x, ${baseUrl}?auto=format,compress&fm=webp&q=80&w=500&h=750&fit=max 2x`;
  }
  return url;
};

const BookCard: React.FC<BookCardProps> = ({ book, onAddToCart, onQuickView }) => {
  // const { wishlist, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // const isWishlisted = useMemo(() => wishlist.some(b => b.id === book.id), [wishlist, book.id]);
  const isAvailable = book.isAvailable !== false;
  const hasStock = book.stockQuantity > 0;

  // const handleToggleWishlist = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   toggleWishlist(book);
  // };

  return (
    <motion.div
      initial={{ opacity: 0.8, scale: 0.9, y: 10 }}
      animate={{ opacity: 0.8, scale: 0.9, y: 0 }}
      whileHover={{
        opacity: 1,
        scale: 1,
        y: -10,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full h-full"
    >
      <div
        className={`relative group flex flex-col min-h-[320px] lg:min-h-[340px] bg-white rounded-3xl sm:rounded-[2rem] p-2.5 sm:p-3 border border-secondary shadow-sm transition-all duration-500 w-full ${(!isAvailable || !hasStock) ? 'grayscale opacity-60' : 'hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:ring-4 hover:ring-primary/10'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsHovered(!isHovered)} // Toggle on mobile tap
      >
        {/* Glow Effect on Hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary/10 via-purple-500/10 to-rose-500/10 rounded-3xl sm:rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        {/* Media Container - Improved Aspect Ratio */}
        <div className="relative aspect-[2/3] w-full rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden bg-secondary mb-3 flex-shrink-0">

          {/* Status Badges */}
          <div className={`absolute top-2 left-2 z-30 flex flex-col gap-1.5 items-start transition-all duration-300 ${isHovered ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            {!isAvailable && (
              <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-foreground/90 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-foreground/20 border border-white/10 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-ban text-[7px] sm:text-[9px] text-slate-400"></i>
                Ngừng kinh doanh
              </div>
            )}
            {isAvailable && !hasStock && (
              <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-slate-700/90 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-slate-700/20 border border-white/10 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-box-open text-[7px] sm:text-[9px] text-slate-400"></i>
                Hết hàng
              </div>
            )}
            {book.badge && (
              <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-rose-500/30 border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-crown text-[7px] sm:text-[9px] text-yellow-200"></i>
                {book.badge}
              </div>
            )}
            {!book.badge && book.rating >= 4.8 && (
              <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-orange-500/30 border border-white/20 backdrop-blur-md flex items-center gap-1.5">
                <i className="fa-solid fa-fire text-[7px] sm:text-[9px] text-white"></i>
                Hot
              </div>
            )}
          </div>

          {/* Wishlist Button - Top Right (Đã xóa theo yêu cầu) */}

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
              srcSet={getImageSrcSet(book.cover)}
              sizes="(max-width: 640px) 200px, (max-width: 1024px) 300px, 500px"
              alt={book.title}
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
              animate={isHovered ? { scale: 1.1, filter: 'blur(2px) brightness(0.8)' } : { scale: 1, filter: 'blur(0px) brightness(1)' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full h-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </Link>

          {/* Quick Info Overlay on Hover - Redesigned for Premium Look */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-foreground/60 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center p-4 pb-16"
              >
                {/* Center Button: Clear & Primary Action */}
                <motion.button
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onQuickView) onQuickView(book);
                  }}
                  className="flex flex-col items-center gap-2 group/btn"
                >
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-foreground transition-all duration-300 shadow-xl">
                    <i className="fa-solid fa-eye text-sm"></i>
                  </div>
                </motion.button>

                {/* Bottom Quick Stats: Integrated & Clean */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="absolute bottom-4 left-4 right-4"
                >
                  <div className="flex justify-around items-center bg-white/10 backdrop-blur-xl rounded-2xl py-2 px-1 border border-white/10">
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[11px] font-black text-white leading-none mb-1">{book.pages}</span>
                      <span className="text-[8px] uppercase text-white/50 font-bold tracking-widest">Trang</span>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[11px] font-black text-white leading-none mb-1">FREE</span>
                      <span className="text-[8px] uppercase text-white/50 font-bold tracking-widest">Ship</span>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[11px] font-black text-white leading-none mb-1">{book.language === 'Tiếng Việt' ? 'VN' : 'EN'}</span>
                      <span className="text-[8px] uppercase text-white/50 font-bold tracking-widest">Bản</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Container */}
        <div
          onClick={() => navigate(`/book/${book.id}`)}
          className="flex flex-col flex-grow min-h-0 justify-between cursor-pointer group/info"
        >
          <div className="space-y-1">
            <div className="block h-[2.8rem] sm:h-[3rem] overflow-hidden">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight sm:leading-snug line-clamp-2 group-hover/info:text-primary transition-colors">
                {book.title}
              </h3>
            </div>
            <p className="text-slate-500 text-[10px] sm:text-xs font-medium truncate italic">{book.author}</p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-secondary mt-auto">
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

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(book, 1, { x: e.clientX, y: e.clientY });
              }}
              disabled={!hasStock || !isAvailable}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 ${(!hasStock || !isAvailable)
                ? 'bg-secondary text-slate-300 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-foreground hover:scale-105 active:scale-95 shadow-md shadow-primary/10'
                }`}
            >
              <i className="fa-solid fa-cart-shopping text-[10px] sm:text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookCard;

