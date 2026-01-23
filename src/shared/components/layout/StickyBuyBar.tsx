import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useBooks } from '@/features/books';
import { useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';
import toast from '@/shared/utils/toast';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const StickyBuyBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isCompact, setIsCompact] = useState(false);
  const location = useLocation();
  const isBookDetails = location.pathname.startsWith('/book/');
  const isAdmin = location.pathname.startsWith('/admin');

  const { viewingBook } = useBooks();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useAuth();
  const dragControls = useDragControls();

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
      addToCart(viewingBook, quantity);
      toast.success(`Đã thêm ${quantity}x "${viewingBook.title}" vào giỏ hàng!`, {
        duration: 3000,
      });
      setQuantity(1); // Reset về 1 sau khi thêm
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
        /* Fixed wrapper - chỉ dùng flexbox để căn giữa, không phụ thuộc transform */
        <div className="fixed inset-x-0 bottom-4 z-[110] flex justify-center pointer-events-none px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={{
              top: -window.innerHeight + 150,
              bottom: 0,
              left: -window.innerWidth / 2 + 100,
              right: window.innerWidth / 2 - 100,
            }}
            className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl shadow-slate-900/10 border border-slate-200/60 overflow-hidden pointer-events-auto max-w-2xl"
          >
            <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2">
              {/* Drag Handle */}
              <div
                className="flex items-center justify-center w-5 h-8 md:w-6 md:h-10 bg-slate-50 text-slate-400 rounded-md cursor-grab active:cursor-grabbing hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0 touch-none"
                onPointerDown={(e) => dragControls.start(e)}
                title="Kéo để di chuyển"
              >
                <i className="fa-solid fa-grip-vertical text-[10px] md:text-xs"></i>
              </div>

              {/* Book Cover */}
              <div className="relative w-8 h-11 md:w-10 md:h-14 rounded-md overflow-hidden shadow-sm flex-shrink-0 border border-slate-100">
                <img
                  src={viewingBook.cover}
                  alt={viewingBook.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Price */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-[10px] md:text-xs line-clamp-1 leading-tight mb-0.5">
                  {viewingBook.title}
                </h3>
                <div className="flex items-center gap-1 md:gap-1.5">
                  <span className="text-xs md:text-sm font-bold text-rose-600 tracking-tight">
                    {formatPrice(viewingBook.price)}
                  </span>
                  {viewingBook.originalPrice && viewingBook.originalPrice > viewingBook.price && (
                    <span className="text-[7px] md:text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded-full uppercase tracking-wide">
                      -{Math.round((1 - viewingBook.price / viewingBook.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              {!isCompact && (
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-1.5 py-1 flex-shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white rounded hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
                    disabled={quantity <= 1}
                  >
                    <i className="fa-solid fa-minus text-[8px] md:text-[9px]"></i>
                  </button>
                  <span className="text-[10px] md:text-xs font-bold text-slate-700 min-w-[16px] md:min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(viewingBook.stockQuantity, quantity + 1))}
                    className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white rounded hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
                    disabled={quantity >= viewingBook.stockQuantity}
                  >
                    <i className="fa-solid fa-plus text-[8px] md:text-[9px]"></i>
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0 border-l border-slate-100 pl-1.5 md:pl-2">
                {/* Compact Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsCompact(!isCompact)}
                  className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-all bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200"
                  title={isCompact ? 'Mở rộng' : 'Thu gọn'}
                >
                  <i className={`fa-solid ${isCompact ? 'fa-chevron-down' : 'fa-chevron-up'} text-[9px] md:text-[10px]`}></i>
                </motion.button>

                {/* Wishlist Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleWishlist}
                  className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-all border shadow-sm ${
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
                      className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart text-[9px] md:text-[11px]`}
                    ></motion.i>
                  </AnimatePresence>
                </motion.button>

                {/* Add to Cart Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={viewingBook.stockQuantity === 0}
                  className="h-6 md:h-7 px-2 md:px-4 bg-slate-900 text-white rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-md shadow-slate-900/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 group"
                >
                  <i className="fa-solid fa-cart-shopping text-[9px] md:text-[11px] group-hover:scale-110 transition-transform"></i>
                  <span className="hidden md:inline">Mua</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StickyBuyBar;
