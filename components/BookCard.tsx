
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { useAuth } from '../AuthContext';
import { db } from '../services/db';

interface BookCardProps {
  book: Book;
  onAddToCart: (book: Book) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const getOptimizedImageUrl = (url: string) => {
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format,compress&fm=webp&q=80&w=500&fit=max`;
  }
  return url;
};

const BookCard: React.FC<BookCardProps> = ({ book, onAddToCart }) => {
  const { wishlist, toggleWishlist } = useAuth();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const isWishlisted = useMemo(() => wishlist.some(b => b.id === book.id), [wishlist, book.id]);

  useEffect(() => {
    // FIX: Await the promise returned by db.getBookById
    const fetchStock = async () => {
      const dbBook = await db.getBookById(book.id);
      if (dbBook) setStockQuantity(dbBook.stock_quantity);
    };
    fetchStock();
  }, [book.id]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(book);
  };

  return (
    <div 
      className={`relative group flex flex-col h-[320px] bg-white rounded-2xl p-2.5 border border-slate-100/80 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 w-full ring-1 ring-transparent hover:ring-indigo-100 ${stockQuantity <= 0 ? 'grayscale opacity-60' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Container - Reduced Height for Compact Look */}
      <div className="relative w-full h-[160px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 mb-2 border border-slate-50 transition-all duration-500 group-hover:shadow-inner">
        <div className="absolute inset-0">
          {/* Status Badges - Glassmorphism */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5 items-start">
            {stockQuantity <= 0 && (
              <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-[0.15em] rounded-full border border-white/10 shadow-lg">Hết hàng</span>
            )}
            {book.badge && (
              <span className="px-2 py-0.5 bg-rose-500/90 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-[0.15em] rounded-full border border-white/20 shadow-lg shadow-rose-500/20">{book.badge}</span>
            )}
            {!book.badge && book.rating >= 4.8 && (
              <span className="px-2 py-0.5 bg-amber-500/90 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-[0.15em] rounded-full border border-white/20 shadow-lg shadow-amber-500/20">Hot</span>
            )}
          </div>

          {/* Wishlist Button - Interactive */}
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 transform ${isHovered ? 'translate-y-0 scale-100' : 'translate-y-2 scale-75 opacity-0'} ${
              isWishlisted 
                ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30 ring-2 ring-rose-200' 
                : 'bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 shadow-md hover:scale-110 active:scale-90'
            }`}
          >
            <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-[12px]`}></i>
          </button>

          {/* Book Image */}
          <Link to={`/book/${book.id}`} className="relative block w-full h-full group/img overflow-hidden">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
                <i className="fa-solid fa-book-open text-slate-300 text-xl animate-bounce"></i>
              </div>
            )}
            <img 
              src={getOptimizedImageUrl(book.cover)} 
              alt={book.title} 
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
              className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${isHovered ? 'scale-110' : 'scale-100'} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Elegant Radial Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-indigo-950/20 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-500`} />
          </Link>
        </div>
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-grow px-1.5">
        <div className="flex justify-between items-center mb-2">
          <Link to={`/category/${book.category}`} className="text-[8px] font-black text-indigo-500 bg-indigo-50/50 hover:bg-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-widest transition-colors">
            {book.category}
          </Link>
          <div className="flex items-center gap-1 bg-amber-50/50 px-1.5 py-0.5 rounded-full border border-amber-100/50">
            <i className="fa-solid fa-star text-[8px] text-amber-500"></i>
            <span className="text-[9px] font-black text-amber-700">{book.rating}</span>
          </div>
        </div>

        <Link to={`/book/${book.id}`} className="block mb-1">
          <h3 className="font-bold text-slate-800 text-[14px] leading-tight line-clamp-2 h-9 group-hover:text-indigo-600 transition-colors duration-300">
            {book.title}
          </h3>
        </Link>
        <Link to={`/author/${book.author}`} className="block">
          <p className="text-slate-400 text-[10px] font-medium mb-1 truncate hover:text-indigo-600 transition-colors uppercase tracking-[0.05em]">{book.author}</p>
        </Link>
        
        <div className="mt-auto pt-2.5 border-t border-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-300 line-through decoration-rose-300/30 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-1 group-hover:translate-y-0 font-bold tracking-tighter">
              {formatPrice(book.price * 1.2)}
            </span>
            <span className="text-[16px] font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-900 tracking-tight leading-none">
              {formatPrice(book.price)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(book);
            }}
            disabled={stockQuantity <= 0}
            className={`group/btn w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
              stockQuantity <= 0 
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/30 hover:-translate-y-1 active:scale-90'
            }`}
          >
            <i className="fa-solid fa-plus text-xs group-hover/btn:rotate-90 transition-transform duration-300"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
