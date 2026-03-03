import React, { useState } from 'react';
import { Book } from '@/shared/types';
import { BookCardImage } from './BookCardImage';
import { BookCardQuickView } from './BookCardQuickView';
import { BookCardInfo } from './BookCardInfo';

interface BookCardProps {
    book: Book;
    onAddToCart: (book: Book, quantity?: number, startPos?: { x: number, y: number }) => void;
    onQuickView?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onAddToCart, onQuickView }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const isAvailable = book.isAvailable !== false;
    const hasStock = book.stockQuantity > 0;

    return (
        <div
            className={`w-full h-full group cursor-pointer transition-all duration-500 hover:-translate-y-2 ${(!isAvailable || !hasStock) ? 'grayscale opacity-60' : ''}`}
        >
            <div
                className={`relative flex flex-col min-h-[240px] lg:min-h-[260px] bg-white/70 backdrop-blur-3xl rounded-[2rem] p-2 sm:p-2.5 border border-white/60 ring-1 ring-black/[0.03] shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 w-full ${(!isAvailable || !hasStock) ? '' : 'group-hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] group-hover:border-primary/20 group-hover:bg-white/90'}`}
            >
                <BookCardImage book={book} imgLoaded={imgLoaded} onImgLoad={() => setImgLoaded(true)}>
                    <BookCardQuickView book={book} onQuickView={onQuickView} />
                </BookCardImage>

                <BookCardInfo book={book} onAddToCart={onAddToCart} />
            </div>
        </div>
    );
};

export default BookCard;
