
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import { useAuth } from '../AuthContext';

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
            <div className="w-full md:w-5/12 bg-slate-50 p-8 flex flex-col items-center justify-center overflow-hidden relative group/img">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent)]"></div>
              <motion.div
                className="relative z-10"
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <img 
                  src={book.cover} 
                  alt={book.title}
                  className="w-full max-w-[260px] h-auto object-cover rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] border border-slate-200/50"
                />
                <div className="absolute inset-0 bg-indigo-600/10 blur-3xl rounded-full -z-10 group-hover/img:bg-indigo-600/20 transition-all duration-700 scale-150"></div>
              </motion.div>
              
              {/* Image Footer Info */}
              <div className="mt-8 flex gap-4 text-slate-400">
                <div className="flex flex-col items-center">
                   <span className="text-sm font-bold text-slate-900">{book.pages}</span>
                   <span className="text-[9px] uppercase font-bold tracking-widest">Trang</span>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="flex flex-col items-center">
                   <span className="text-sm font-bold text-slate-900">{book.rating}</span>
                   <span className="text-[9px] uppercase font-bold tracking-widest">Đánh giá</span>
                </div>
              </div>
            </div>

            {/* Right: Info Section */}
            <div className="w-full md:w-7/12 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-white">
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                  {book.category}
                </span>
                {book.badge && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-100">
                    {book.badge}
                  </span>
                )}
                {!isAvailable ? (
                  <span className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-700 shadow-sm">
                    Ngừng kinh doanh
                  </span>
                ) : book.stockQuantity > 0 ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                    Sẵn hàng
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    Hết hàng
                  </span>
                )}
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight tracking-tight">{book.title}</h2>
              <div className="flex items-center gap-2 mb-6">
                <p className="text-sm font-bold text-slate-500">Tác giả:</p>
                <Link to={`/author/${book.author}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  {book.author}
                </Link>
              </div>

              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed line-clamp-4 italic border-l-4 border-indigo-100 pl-4">
                "{book.description || "Khám phá chiều sâu của tri thức qua từng trang sách..."}"
              </p>

              {/* Price and Quantity Selection */}
              <div className="bg-slate-50 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Giá bán chính thức</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-rose-600 tracking-tighter">
                      {book.price.toLocaleString()}đ
                    </span>
                    {book.originalPrice && (
                      <span className="text-lg text-slate-400 line-through font-medium">
                        {book.originalPrice.toLocaleString()}đ
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest sm:hidden">Số lượng:</span>
                  <div className="flex items-center bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center text-slate-600 active:scale-90"
                    >
                      <i className="fa-solid fa-minus text-[10px]"></i>
                    </button>
                    <span className="w-12 text-center font-black text-slate-900 text-lg">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-10 h-10 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center text-slate-600 active:scale-90"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <button 
                    disabled={book.stockQuantity <= 0 || !isAvailable}
                    onClick={(e) => {
                      onAddToCart(book, quantity, { x: e.clientX, y: e.clientY });
                      onClose();
                    }}
                    className={`flex-[4] py-4.5 rounded-2xl text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg ${
                      book.stockQuantity > 0 && isAvailable
                      ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <i className="fa-solid fa-cart-shopping text-sm"></i>
                    {!isAvailable ? 'Không khả dụng' : 'Thêm vào giỏ hàng'}
                  </button>

                  <button 
                    onClick={handleToggleWishlist}
                    className={`flex-1 rounded-2xl flex items-center justify-center transition-all border-2 active:scale-95 group ${
                      isWishlisted 
                        ? 'bg-rose-500 border-rose-500 text-white shadow-rose-200 shadow-lg' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-rose-500 hover:text-rose-500'
                    }`}
                    title={isWishlisted ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                  >
                    <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-xl group-hover:scale-110 transition-transform`}></i>
                  </button>
                </div>

                <Link 
                  to={`/book/${book.id}`}
                  onClick={onClose}
                  className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-premium hover:bg-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] border border-indigo-100/50"
                >
                  <i className="fa-solid fa-arrow-right-to-bracket text-sm"></i>
                  Xem chi tiết cuốn sách này
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                       <i className="fa-solid fa-shield-check"></i>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chính hãng 100%</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                       <i className="fa-solid fa-rotate"></i>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đổi trả 30 ngày</span>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
