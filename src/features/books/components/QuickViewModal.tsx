
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Book } from '@/shared/types/';
import { useAuth } from '@/features/auth';

interface QuickViewModalProps {
  book: Book | null;
  onClose: () => void;
  onAddToCart: (book: Book, quantity: number, startPos?: { x: number, y: number }) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ book, onClose, onAddToCart }) => {
  const { wishlist, toggleWishlist } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  // Kiểm tra trạng thái khả dụng nếu được truyền từ props (ví dụ từ Wishlist)
  const isAvailable = book ? (book as any).isAvailable !== false : true;

  const isWishlisted = useMemo(() =>
    book ? wishlist.some(b => b.id === book.id) : false,
    [wishlist, book]
  );

  const handleToggleWishlist = () => {
    if (book) toggleWishlist(book);
  };

  return (
    <AnimatePresence>
      {book && (
        <div key="quick-view-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/20 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100/80 backdrop-blur-md flex items-center justify-center text-slate-500 hover:bg-rose-500 hover:text-white transition-all z-20 shadow-sm"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Left: Image Section */}
            <div className="w-full md:w-5/12 bg-slate-50 p-6 flex flex-col items-center justify-center overflow-hidden relative group/img">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-rose-500/5 to-purple-500/10 opacity-60"></div>
              <motion.div
                initial={{ opacity: 0, scale: 1.2, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full max-w-[240px] h-auto object-cover rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 relative z-20"
                />
                {/* Visual shadow glow */}
                <div className="absolute inset-0 bg-slate-900/60 blur-2xl rounded-2xl transform translate-y-8 scale-90 -z-10 opacity-30"></div>
              </motion.div>

              {/* Image Footer Stats */}
              <div className="mt-8 flex gap-6 text-slate-400 relative z-10">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-black text-slate-900 leading-none">{book.pages}</span>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Trang</span>
                </div>
                <div className="w-px h-6 bg-slate-200 self-center"></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-black text-slate-900 leading-none">{book.rating}</span>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Rating</span>
                </div>
                <div className="w-px h-6 bg-slate-200 self-center"></div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-black text-slate-900 leading-none">{book.language === 'Tiếng Việt' ? 'VN' : 'EN'}</span>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Bản</span>
                </div>
              </div>
            </div>

            {/* Right: Info Section */}
            <div className="w-full md:w-7/12 p-8 md:p-10 overflow-y-auto custom-scrollbar bg-white flex flex-col">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest rounded-lg border border-indigo-100/50 flex items-center gap-1.5">
                  <i className="fa-solid fa-shapes text-[10px]"></i>
                  {book.category}
                </span>
                {book.badge && (
                  <span className="px-2.5 py-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-rose-500/30 border border-white/20 flex items-center gap-1.5">
                    <i className="fa-solid fa-crown text-[10px] text-yellow-200"></i>
                    {book.badge}
                  </span>
                )}
                {!isAvailable ? (
                  <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                    <i className="fa-solid fa-ban text-[10px]"></i>
                    Ngừng bán
                  </span>
                ) : book.stockQuantity > 0 ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 flex items-center gap-1.5 font-sans">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Sẵn hàng
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                    Hết hàng
                  </span>
                )}
              </div>

              <h2 className="text-2xl lg:text-3xl font-black text-slate-900 mb-2 leading-[1.1] tracking-tighter">{book.title}</h2>
              <div className="flex items-center gap-2 mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tác giả</p>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                <Link to={`/author/${book.author}`} className="text-sm font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-tight">
                  {book.author}
                </Link>
              </div>

              <div className="relative mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <i className="fa-solid fa-quote-left text-indigo-100 text-3xl absolute top-3 left-3 -z-10"></i>
                <p className="text-slate-600 text-sm font-medium leading-relaxed italic relative z-10">
                  {book.description ? (book.description.length > 200 ? book.description.substring(0, 200) + '...' : book.description) : "Khám phá chiều sâu của tri thức qua từng trang sách..."}
                </p>
              </div>

              {/* Price Row */}
              <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Giá ưu đãi</span>
                    {book.originalPrice && book.originalPrice > book.price && (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded uppercase">
                        -{Math.round((1 - book.price / book.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-rose-600 tracking-tighter">
                      {book.price.toLocaleString()}đ
                    </span>
                    {book.originalPrice && (
                      <span className="text-base text-slate-400 line-through font-bold opacity-60">
                        {book.originalPrice.toLocaleString()}đ
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all active:scale-90"
                  >
                    <i className="fa-solid fa-minus text-sm"></i>
                  </button>
                  <span className="w-10 text-center font-black text-slate-900 text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all active:scale-90"
                  >
                    <i className="fa-solid fa-plus text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-3">
                <button
                  disabled={book.stockQuantity <= 0 || !isAvailable}
                  onClick={(e) => {
                    onAddToCart(book, quantity, { x: e.clientX, y: e.clientY });
                    onClose();
                  }}
                  className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl relative overflow-hidden group/btn ${book.stockQuantity > 0 && isAvailable
                    ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                >
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out"></div>

                  <i className="fa-solid fa-cart-shopping text-sm group-hover/btn:scale-110 transition-transform"></i>
                  {!isAvailable ? 'Sách ngừng bán' : 'Thêm vào giỏ hàng'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleWishlist}
                    className={`py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border-2 active:scale-95 text-xs font-black uppercase tracking-widest ${isWishlisted
                      ? 'bg-rose-50 border-rose-200 text-rose-500'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-rose-500'
                      }`}
                  >
                    <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
                    {isWishlisted ? 'Đã thích' : 'Yêu thích'}
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/book/${book.id}`);
                    }}
                    className="py-3.5 rounded-xl border-2 border-slate-100 text-slate-400 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 text-xs font-black uppercase tracking-widest"
                  >
                    <i className="fa-solid fa-circle-info text-sm"></i>
                    Chi tiết
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ y: -3 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-slate-900 transition-colors">Chính hãng 100%</span>
                </motion.div>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <i className="fa-solid fa-rotate"></i>
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-slate-900 transition-colors">Đổi trả 30 ngày</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

