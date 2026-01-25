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
                <div className="block h-[2.8rem] sm:h-[3rem] overflow-hidden">
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight sm:leading-snug line-clamp-2 group-hover/info:text-primary transition-colors">
                        {book.title}
                    </h3>
                </div>
                <p className="text-slate-500 text-[10px] sm:text-xs font-medium truncate italic">{book.author}</p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-secondary mt-auto">
                <div className="flex flex-col">
                    {book.originalPrice && book.originalPrice > book.price && (
                        <span className="text-[10px] uppercase font-bold text-slate-400 line-through decoration-rose-400/50">
                            {formatPrice(book.originalPrice)}
                        </span>
                    )}
                    <span className="text-base font-black text-rose-600 leading-none">
                        {formatPrice(book.price)}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCart(book, 1, { x: e.clientX, y: e.clientY });
                    }}
                    disabled={!hasStock || !isAvailable}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-[background-color,color,transform,box-shadow] duration-200 ${(!hasStock || !isAvailable)
                        ? 'bg-secondary text-slate-300 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-foreground hover:scale-105 active:scale-95 shadow-md shadow-primary/10'
                        }`}
                >
                    <i className="fa-solid fa-cart-shopping text-[10px] sm:text-xs"></i>
                </button>
            </div>
        </div>
    );
};
