import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useBooks } from '@/features/books';
import { useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const StickyBuyBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewingBook) {
      setIsAddingToCart(true);
      await addToCart(viewingBook, quantity);
      setQuantity(1); // Reset về 1 sau khi thêm
      setIsAddingToCart(false);
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
        <div className="fixed bottom-28 left-6 right-6 z-[110] lg:hidden pointer-events-none">
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
              left: 0,
              right: 0,
            }}
            className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] border border-slate-200/50 overflow-hidden pointer-events-auto w-full"
          >
            <div className="flex items-center gap-2 p-2">
              {/* Drag Handle */}
              <div
                className="flex items-center justify-center w-6 h-10 bg-slate-100/50 text-slate-400 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0 touch-none"
                onPointerDown={(e) => dragControls.start(e)}
                title="Kéo để di chuyển"
              >
                <i className="fa-solid fa-grip-vertical text-xs"></i>
              </div>

              {/* Book Cover */}
              <div className="relative w-10 h-14 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-slate-100">
                <img
                  src={viewingBook.cover}
                  alt={viewingBook.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Price */}
              <div className="flex-1 min-w-0 px-1">
                <h3 className="font-bold text-slate-900 text-xs line-clamp-1 leading-tight mb-0.5">
                  {viewingBook.title}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-indigo-600 tracking-tight">
                    {formatPrice(viewingBook.price)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                {/* Wishlist Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleWishlist}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${isWishlisted
                    ? 'bg-rose-50 text-rose-500 border-rose-100'
                    : 'bg-white text-slate-400 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100'
                    }`}
                >
                  <i className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart text-sm`}></i>
                </motion.button>

                {/* Add to Cart Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={viewingBook.stockQuantity === 0 || isAddingToCart}
                  className="h-10 px-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all shadow-md shadow-slate-900/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAddingToCart ? (
                    <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                  ) : (
                    <i className="fa-solid fa-cart-shopping text-sm"></i>
                  )}
                  <span>{isAddingToCart ? 'Đang thêm...' : 'Mua'}</span>
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
