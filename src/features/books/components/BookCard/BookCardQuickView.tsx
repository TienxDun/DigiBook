import React from 'react';
import { Book } from '@/shared/types';

interface BookCardQuickViewProps {
    book: Book;
    onQuickView?: (book: Book) => void;
}

export const BookCardQuickView: React.FC<BookCardQuickViewProps> = ({ book, onQuickView }) => {
    return (
        <div className="absolute inset-0 bg-foreground/80 z-20 flex flex-col items-center justify-center p-4 pb-16 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none lg:group-hover:pointer-events-auto hidden lg:flex">
            {/* Center Button: Clear & Primary Action */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onQuickView) onQuickView(book);
                }}
                className="flex flex-col items-center gap-2 group/btn"
            >
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-foreground transition-[background-color,color] duration-200 shadow-xl group-hover/btn:scale-105">
                    <i className="fa-solid fa-eye text-sm"></i>
                </div>
            </button>

            {/* Bottom Quick Stats: Integrated & Clean */}
            <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-around items-center bg-white/10 backdrop-blur-xl rounded-2xl py-2 px-1 border border-white/10">
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[11px] font-black text-white leading-none mb-1">{book.pages}</span>
                        <span className="text-[8px] uppercase text-white/50 font-bold tracking-widest">Trang</span>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[11px] font-black text-white leading-none mb-1">FREE</span>
                        <span className="text-[8px] uppercase text-white/50 font-bold tracking-widest">Ship</span>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-[11px] font-black text-white leading-none mb-1">{book.language === 'Tiếng Việt' ? 'VN' : 'EN'}</span>
                        <span className="text-[8px] uppercase text-white/50 font-bold tracking-widest">Bản</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
