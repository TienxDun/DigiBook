import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '@/shared/types';

interface QuickBuyBarProps {
    book: Book;
    quantity: number;
    setQuantity: (q: number) => void;
    isWishlisted: boolean;
    toggleWishlist: (book: Book) => void;
    addToCart: (book: Book, quantity: number, pos: { x: number; y: number }) => void;
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const QuickBuyBar: React.FC<QuickBuyBarProps> = ({
    book,
    quantity,
    setQuantity,
    isWishlisted,
    toggleWishlist,
    addToCart
}) => {
    const [isVisible, setIsVisible] = useState(false);
    
    // Hiển thị khi scroll xuống một khoảng nhất định (giống BackToTop)
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        // Kiểm tra ngay khi mount
        toggleVisibility();
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0, x: '-50%' }}
                    animate={{ y: 0, opacity: 1, x: '-50%' }}
                    exit={{ y: 100, opacity: 0, x: '-50%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed hidden lg:flex left-1/2 z-[100] w-[95%] max-w-4xl bottom-10"
                >
                    <div className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-2 lg:pr-3 shadow-[0_30px_70px_-20px_rgba(15,23,42,0.5)] flex items-center justify-between gap-4 relative overflow-hidden group w-full ring-1 ring-white/20">
                        {/* Interactive Shine Effect */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10 pointer-events-none"></div>

                        {/* Book Info Section */}
                        <div className="flex items-center gap-3 flex-grow min-w-0 relative z-10 pl-1">
                            <div className="h-12 w-9 rounded-lg overflow-hidden shadow-2xl border border-white/20 shrink-0 transform group-hover:scale-110 transition-all duration-500">
                                <img className="w-full h-full object-cover" alt={book.title} src={book.cover} />
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-white font-black text-xs leading-tight truncate tracking-tight uppercase mb-1">{book.title}</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <p className="text-white font-black text-lg tracking-tighter leading-none">{formatPrice(book.price)}</p>
                                    </div>
                                    {book.originalPrice > book.price && (
                                        <div className="flex flex-col opacity-40">
                                            <p className="text-slate-300 text-[10px] font-bold line-through leading-none">{formatPrice(book.originalPrice)}</p>
                                        </div>
                                    )}
                                    <div className="h-6 w-px bg-white/10 mx-1 hidden md:block"></div>
                                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${book.stockQuantity > 0 ? 'bg-emerald-400' : 'bg-red-400'} shadow-[0_0_8px_rgba(52,211,153,0.4)]`}></div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            {book.stockQuantity > 0 ? `${book.stockQuantity} cuốn` : 'Hết hàng'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div className="flex items-center gap-2 relative z-10">
                            {/* Quantity */}
                            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10 mr-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-all flex items-center justify-center active:scale-90 border border-white/5"
                                >
                                    <i className="fa-solid fa-minus text-[10px]"></i>
                                </button>
                                <span className="w-6 text-center font-black text-white text-xs">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white shadow-lg transition-all flex items-center justify-center active:scale-90 border border-white/5"
                                >
                                    <i className="fa-solid fa-plus text-[10px]"></i>
                                </button>
                            </div>

                            {/* Wishlist */}
                            <button
                                onClick={() => toggleWishlist(book)}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all border ${isWishlisted
                                        ? 'bg-rose-500 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30'
                                    }`}
                                title={isWishlisted ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                            >
                                <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-base`}></i>
                            </button>

                            {/* Add to Cart */}
                            <button
                                onClick={(e) => addToCart(book, quantity, { x: e.clientX, y: e.clientY })}
                                disabled={book.stockQuantity <= 0}
                                className="h-10 px-6 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-[0.1em] hover:bg-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none active:scale-[0.97] whitespace-nowrap shadow-xl shadow-indigo-500/10 group/btn"
                            >
                                <i className="fa-solid fa-cart-shopping text-xs group-hover:rotate-12 transition-transform"></i>
                                <span>{book.stockQuantity > 0 ? 'Thêm giỏ hàng' : 'Hết hàng'}</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickBuyBar;
