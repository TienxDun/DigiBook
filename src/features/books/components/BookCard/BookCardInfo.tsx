import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '@/shared/types';
import { formatPrice } from '@/shared/utils/format';

interface BookCardInfoProps {
    book: Book;
    onAddToCart: (book: Book, quantity?: number, startPos?: { x: number, y: number }) => void;
}

export const BookCardInfo: React.FC<BookCardInfoProps> = ({ book, onAddToCart }) => {
    const navigate = useNavigate();
    const isAvailable = book.isAvailable !== false;
    const hasStock = book.stockQuantity > 0;

    return (
        <div
            onClick={() => navigate(`/book/${book.slug || book.id}`)}
            className="flex flex-col flex-grow min-h-0 justify-between cursor-pointer group/info"
        >
            <div className="space-y-1">
                <div className="block h-[2.2rem] sm:h-[2.4rem] overflow-hidden">
                    <h3 className="font-display font-black text-slate-800 text-[13px] sm:text-[15px] leading-tight sm:leading-[1.1] line-clamp-2 group-hover/info:text-primary transition-colors uppercase tracking-tight">
                        {book.title}
                    </h3>
                </div>
                <p className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">{book.author}</p>
            </div>

            <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 mt-auto">
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-base sm:text-lg font-black text-rose-600 leading-none shrink-0">
                        {formatPrice(book.price)}
                    </span>
                    {book.originalPrice && book.originalPrice > book.price && (
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 line-through decoration-rose-400/50 truncate">
                            {formatPrice(book.originalPrice)}
                        </span>
                    )}
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCart(book, 1, { x: e.clientX, y: e.clientY });
                    }}
                    disabled={!hasStock || !isAvailable}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${(!hasStock || !isAvailable)
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-900 text-white hover:bg-primary shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-primary/20 hover:-translate-y-1 active:scale-[0.95] opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
                        }`}
                >
                    <i className="fa-solid fa-cart-shopping text-xs"></i>
                </button>
            </div>
        </div>
    );
};
