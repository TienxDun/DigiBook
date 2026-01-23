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

    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0, x: isMobile ? 0 : '-50%' }}
                    animate={{ y: 0, opacity: 1, x: isMobile ? 0 : '-50%' }}
                    exit={{ y: 100, opacity: 0, x: isMobile ? 0 : '-50%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed left-0 lg:left-1/2 z-[100] w-full lg:w-[95%] lg:max-w-4xl px-4 lg:px-0 bottom-28 lg:bottom-6"
                >
                    <div className="bg-white/90 backdrop-blur-3xl border border-white/40 rounded-[2rem] p-2 lg:p-2 lg:pr-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] flex items-center justify-between gap-3 relative overflow-hidden group">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/20 via-transparent to-rose-50/20 pointer-events-none"></div>

                        {/* Book Info Section */}
                        <div className="flex items-center gap-3 flex-grow min-w-0 relative z-10">
                            <div className="h-12 w-9 rounded-lg overflow-hidden shadow-md border border-white/60 ml-1 hidden sm:block shrink-0 transform group-hover:scale-105 transition-transform">
                                <img className="w-full h-full object-cover" alt={book.title} src={book.cover} />
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-slate-900 font-black text-xs leading-none truncate tracking-tight uppercase mb-1">{book.title}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-rose-600 font-black text-lg tracking-tighter leading-none">{formatPrice(book.price)}</p>
                                    {book.originalPrice > book.price && (
                                        <p className="text-slate-400 text-[10px] font-bold line-through opacity-50 leading-none">{formatPrice(book.originalPrice)}</p>
                                    )}
                                    <div className="flex items-center gap-1 ml-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${book.stockQuantity > 0 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:inline">
                                            {book.stockQuantity > 0 ? 'Sẵn hàng' : 'Hết hàng'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls Section */}
                        <div className="flex items-center gap-2 relative z-10">
                            {/* Quantity */}
                            <div className="hidden sm:flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-200/50 mr-1">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 shadow-sm transition-all flex items-center justify-center text-slate-500 active:scale-90"
                                >
                                    <i className="fa-solid fa-minus text-[10px]"></i>
                                </button>
                                <span className="w-6 text-center font-black text-slate-900 text-xs">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 shadow-sm transition-all flex items-center justify-center text-slate-500 active:scale-90"
                                >
                                    <i className="fa-solid fa-plus text-[10px]"></i>
                                </button>
                            </div>

                            {/* Wishlist */}
                            <button
                                onClick={() => toggleWishlist(book)}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all border ${isWishlisted
                                        ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-sm shadow-rose-100'
                                        : 'bg-white border-slate-200/50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100'
                                    }`}
                                aria-label="Bỏ yêu thích"
                            >
                                <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
                            </button>

                            {/* Add to Cart */}
                            <button
                                onClick={(e) => addToCart(book, quantity, { x: e.clientX, y: e.clientY })}
                                disabled={book.stockQuantity <= 0}
                                className="h-10 px-5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none active:scale-[0.97] whitespace-nowrap shadow-md shadow-indigo-100"
                            >
                                <i className="fa-solid fa-cart-shopping text-xs"></i>
                                <span>{book.stockQuantity > 0 ? (isMobile ? 'Mua' : 'Thêm giỏ hàng') : 'Hết hàng'}</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickBuyBar;
