import React from 'react';
import { Book } from '@/shared/types';

interface BookCardBadgesProps {
    book: Book;
    className?: string;
}

export const BookCardBadges: React.FC<BookCardBadgesProps> = ({ book, className = '' }) => {
    const isAvailable = book.isAvailable !== false;
    const hasStock = book.stockQuantity > 0;

    return (
        <div className={`absolute top-2 left-2 z-30 flex flex-col gap-1.5 items-start transition-opacity duration-150 group-hover:opacity-0 ${className}`}>
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
    );
};
