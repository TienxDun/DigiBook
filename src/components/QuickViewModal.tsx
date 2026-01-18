
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';

interface QuickViewModalProps {
  book: Book | null;
  onClose: () => void;
  onAddToCart: (book: Book, quantity: number, startPos?: { x: number, y: number }) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ book, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  if (!book) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all z-10"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          {/* Left: Image */}
          <div className="w-full md:w-5/12 bg-slate-50 p-8 flex items-center justify-center overflow-hidden">
            <motion.img 
              layoutId={`book-cover-${book.id}`}
              src={book.cover} 
              alt={book.title}
              className="w-full max-w-[280px] h-auto object-cover rounded-xl shadow-2xl transition-transform hover:scale-105 duration-700"
            />
          </div>

          {/* Right: Info */}
          <div className="w-full md:w-7/12 p-8 md:p-12 overflow-y-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-micro font-bold uppercase tracking-widest rounded-full">{book.category}</span>
              {book.badge && (
                <span className="px-3 py-1 bg-rose-50 text-rose-500 text-micro font-bold uppercase tracking-widest rounded-full">{book.badge}</span>
              )}
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 leading-tight uppercase tracking-tighter">{book.title}</h2>
            <p className="text-label font-bold text-indigo-600 mb-6 uppercase tracking-premium">Tác giả: <span className="text-slate-900">{book.author}</span></p>

            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  <i className="fa-solid fa-star text-sm"></i>
                </div>
                <span className="text-label font-bold text-slate-900">{book.rating} <span className="text-slate-400 font-medium">Rating</span></span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-book-open-reader text-indigo-500 text-sm"></i>
                <span className="text-label font-bold text-slate-900">{book.pages} <span className="text-slate-400 font-medium">Trang</span></span>
              </div>
            </div>

            <p className="text-slate-500 text-label font-medium mb-8 line-clamp-4 leading-relaxed">
              {book.description || "Cuốn sách tuyệt vời này sẽ mang lại cho bạn những kiến thức và cái nhìn mới mẻ về thế giới..."}
            </p>

            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mb-1">Giá bán ưu đãi</p>
                <p className="text-4xl font-extrabold text-slate-900 tracking-tighter">
                  {book.price.toLocaleString()}đ
                </p>
              </div>

              <div className="flex items-center bg-slate-100 rounded-2xl p-1">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-600"
                >
                  <i className="fa-solid fa-minus text-[10px]"></i>
                </button>
                <span className="w-10 text-center font-extrabold text-slate-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-600"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={(e) => {
                  onAddToCart(book, quantity, { x: e.clientX, y: e.clientY });
                  onClose();
                }}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-label font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-cart-shopping"></i>
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
