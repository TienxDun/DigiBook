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
            className={`w-full h-full group cursor-pointer transition-transform duration-300 hover:-translate-y-2 ${(!isAvailable || !hasStock) ? 'grayscale opacity-60' : ''}`}
        >
            <div
                className={`relative flex flex-col min-h-[320px] lg:min-h-[340px] bg-white rounded-3xl sm:rounded-[2rem] p-2.5 sm:p-3 border border-secondary shadow-sm transition-[box-shadow,border-color] duration-200 w-full ${(!isAvailable || !hasStock) ? '' : 'group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:border-primary/30'}`}
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
