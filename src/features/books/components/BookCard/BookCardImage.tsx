import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '@/shared/types';
import { BookCardBadges } from './BookCardBadges';

interface BookCardImageProps {
    book: Book;
    imgLoaded: boolean;
    onImgLoad: () => void;
    children?: React.ReactNode;
}

const getOptimizedImageUrl = (url: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    if (url.includes('unsplash.com')) {
        const baseUrl = url.split('?')[0];
        const sizes = {
            small: 'w=200&h=300&fit=max',
            medium: 'w=300&h=450&fit=max',
            large: 'w=500&h=750&fit=max'
        };
        return `${baseUrl}?auto=format,compress&fm=webp&q=80&${sizes[size]}`;
    }
    return url;
};

const getImageSrcSet = (url: string) => {
    if (url.includes('unsplash.com')) {
        const baseUrl = url.split('?')[0];
        return `${baseUrl}?auto=format,compress&fm=webp&q=80&w=300&h=450&fit=max 1x, ${baseUrl}?auto=format,compress&fm=webp&q=80&w=500&h=750&fit=max 2x`;
    }
    return url;
};

export const BookCardImage: React.FC<BookCardImageProps> = ({ book, imgLoaded, onImgLoad, children }) => {
    return (
        <div className="relative aspect-[2/3] w-full rounded-[1.2rem] sm:rounded-[1.5rem] overflow-hidden bg-secondary mb-3 flex-shrink-0">

            <BookCardBadges book={book} />

            {/* Rating Badge on Image */}
            <div className="absolute bottom-2 right-2 z-30 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-md flex items-center gap-1 shadow-sm border border-white/50 transition-opacity duration-150 group-hover:opacity-0">
                <i className="fa-solid fa-star text-xs text-amber-400"></i>
                <span className="text-xs font-bold text-slate-700">{book.rating}</span>
            </div>

            {/* Book Image */}
            <Link to={`/book/${book.slug || book.id}`} className="block w-full h-full">
                {!imgLoaded && (
                    <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                        <i className="fa-solid fa-book-open text-slate-300"></i>
                    </div>
                )}
                <img
                    src={getOptimizedImageUrl(book.cover)}
                    srcSet={getImageSrcSet(book.cover)}
                    sizes="(max-width: 640px) 200px, (max-width: 1024px) 300px, 500px"
                    alt={book.title}
                    onLoad={onImgLoad}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
            </Link>

            {children}
        </div>
    );
};
