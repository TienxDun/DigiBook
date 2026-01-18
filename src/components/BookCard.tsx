
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import { useAuth } from '../AuthContext';
import { db } from '../services/db';

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
  const [stockQuantity, setStockQuantity] = useState<number>(book.stockQuantity);
  const [isHovered, setIsHovered] = useState(false);
  
  const isWishlisted = useMemo(() => wishlist.some(b => b.id === book.id), [wishlist, book.id]);
  const isAvailable = (book as any).isAvailable !== false;

  useEffect(() => {
    // Chỉ fetch lại nếu cần cập nhật real-time, hoặc đơn giản là đồng bộ với prop
    setStockQuantity(book.stockQuantity);
    
    const fetchStock = async () => {
      try {
        const dbBook = await db.getBookById(book.id);
        if (dbBook) setStockQuantity(dbBook.stockQuantity);
      } catch (e) {
        console.error("Error fetching stock for book:", book.id, e);
      }
    };
    fetchStock();
  }, [book.id, book.stockQuantity]);

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
        className={`relative group flex flex-col h-[340px] bg-white rounded-[2rem] p-3 border border-slate-200/60 shadow-sm transition-all duration-500 w-full ${(!isAvailable || stockQuantity <= 0) ? 'grayscale opacity-60' : 'hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-300/50 hover:ring-4 hover:ring-indigo-500/5'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow Effect on Hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-rose-500/10 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        {/* Media Container - Fixed Height */}
        <div className="relative h-[200px] w-full rounded-[1.5rem] overflow-hidden bg-slate-50 mb-3 flex-shrink-0">
          
          {/* Status Badges */}
          <div className="absolute top-2 left-2 z-30 flex flex-col gap-1 items-start">
            {!isAvailable && (
              <span className="px-2 py-0.5 bg-rose-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/10">Ngừng kinh doanh</span>
            )}
            {isAvailable && stockQuantity <= 0 && (
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
            className={`absolute top-2 right-2 z-30 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
              isWishlisted 
                ? 'bg-rose-500 text-white shadow-sm' 
                : 'bg-white/90 text-slate-400 hover:text-rose-500 shadow-sm hover:bg-white'
            }`}
          >
            <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-[12px]`}></i>
          </button>

          {/* Rating Badge on Image */}
          <div className="absolute bottom-2 right-2 z-30 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-md flex items-center gap-1 shadow-sm border border-white/50">
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
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-20 flex flex-col justify-between p-4"
              >
                {/* Top Quick Actions */}
                <div className="flex justify-between items-start translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex flex-col gap-1">
                    <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
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
                   <div className="flex justify-around bg-white/90 backdrop-blur-md rounded-xl py-2 px-1 border border-white/20">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-700">{book.pages}</span>
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Trang</span>
                      </div>
                      <div className="w-px h-4 bg-slate-200 self-center"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-emerald-600">Free</span>
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Ship</span>
                      </div>
                      <div className="w-px h-4 bg-slate-200 self-center"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-amber-500">{book.rating}</span>
                        <span className="text-[8px] uppercase text-slate-400 font-bold">Sao</span>
                      </div>
                   </div>
                   <p className="text-[10px] text-white/90 font-medium line-clamp-1 italic text-center">
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
            <div className="block mb-1">
              <h3 className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-2 group-hover/info:text-indigo-600 transition-colors">
                {book.title}
              </h3>
            </div>
            <p className="text-slate-500 text-xs font-medium truncate">{book.author}</p>
          </div>
          
          <div className="pt-2 flex items-end justify-between border-t border-slate-50 mt-2">
            <div className="flex flex-col">
              {book.originalPrice && (
                <span className="text-[11px] text-slate-400 line-through">
                  {formatPrice(book.originalPrice)}
                </span>
              )}
              <span className="text-[16px] font-black text-rose-600 leading-tight">
                {formatPrice(book.price)}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(book, 1, { x: e.clientX, y: e.clientY });
              }}
              disabled={stockQuantity <= 0 || !isAvailable}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                (stockQuantity <= 0 || !isAvailable)
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
