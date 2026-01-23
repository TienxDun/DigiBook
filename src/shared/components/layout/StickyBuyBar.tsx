import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useBooks } from '@/features/books';
import { useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const StickyBuyBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const isBookDetails = location.pathname.startsWith('/book/');
  const isAdmin = location.pathname.startsWith('/admin');

  const { viewingBook } = useBooks();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useAuth();

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  if (isAdmin) return null;

  const isWishlisted = viewingBook ? wishlist.some(b => b.id === viewingBook.id) : false;

  const handleAddToCart = () => {
    if (viewingBook) {
      addToCart(viewingBook, 1);
      import('react-hot-toast').then(({ toast }) => {
        toast.success(`Đã thêm "${viewingBook.title}" vào giỏ hàng!`, {
          icon: '🛒',
          duration: 3000,
        });
      });
    }
  };

  const handleToggleWishlist = () => {
    if (viewingBook) {
      toggleWishlist(viewingBook);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && isBookDetails && viewingBook && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[110]"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200/60 overflow-hidden">
            <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3">
              {/* Book Cover */}
              <div className="relative w-10 h-14 md:w-14 md:h-20 rounded-lg overflow-hidden shadow-md flex-shrink-0 border border-slate-100">
                <img
                  src={viewingBook.cover}
                  alt={viewingBook.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Price */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-[11px] md:text-sm line-clamp-1 leading-tight mb-0.5 md:mb-1">
                  {viewingBook.title}
                </h3>
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                  <span className="text-sm md:text-lg font-black text-rose-600 tracking-tight">
                    {formatPrice(viewingBook.price)}
                  </span>
                  {viewingBook.originalPrice && viewingBook.originalPrice > viewingBook.price && (
                    <span className="text-[8px] md:text-[10px] font-black text-rose-600 bg-rose-50 px-1 md:px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      -{Math.round((1 - viewingBook.price / viewingBook.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 border-l border-slate-100 pl-2 md:pl-3">
                {/* Wishlist Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleWishlist}
                  className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all border shadow-sm ${
                    isWishlisted
                      ? 'bg-rose-50 text-rose-500 border-rose-100'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100'
                  }`}
                  title={isWishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                >
                  <AnimatePresence mode="wait">
                    <motion.i
                      key={isWishlisted ? 'solid' : 'regular'}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.2, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart text-xs md:text-base`}
                    ></motion.i>
                  </AnimatePresence>
                </motion.button>

                {/* Add to Cart Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={viewingBook.stockQuantity === 0}
                  className="h-9 md:h-11 px-3 md:px-6 bg-slate-900 text-white rounded-xl font-black text-[9px] md:text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 group"
                >
                  <i className="fa-solid fa-cart-shopping text-[10px] md:text-sm group-hover:scale-110 transition-transform"></i>
                  <span>Mua</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyBuyBar;
