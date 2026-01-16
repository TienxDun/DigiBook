
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import { useAuth } from '../App';
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
      className={`relative group flex flex-col h-full bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 w-full ${stockQuantity <= 0 ? 'grayscale opacity-60' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Container - Improved Rigid Aspect Ratio */}
      <div className="relative w-full pt-[133.33%] rounded-2xl overflow-hidden bg-slate-100 mb-3 border border-slate-50 transition-all duration-500">
        <div className="absolute inset-0">
          {/* Status Badges */}
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
            {stockQuantity <= 0 && (
              <span className="px-1.5 py-0.5 bg-slate-900/90 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-widest rounded-full">Hết hàng</span>
            )}
            {book.badge && (
              <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[7px] font-black uppercase tracking-widest rounded-full shadow-lg">{book.badge}</span>
            )}
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'} ${
              isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-500 shadow-sm'
            }`}
          >
            <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-[10px]`}></i>
          </button>

          {/* Book Image */}
          <Link to={`/book/${book.id}`} className="relative block w-full h-full">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            )}
            <img 
              src={getOptimizedImageUrl(book.cover)} 
              alt={book.title} 
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Hover Overlay Content */}
            <div className={`absolute inset-0 bg-indigo-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button className="bg-white text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transform transition-transform hover:scale-110">
                <i className="fa-solid fa-eye text-xs"></i>
              </button>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1 px-1">
          <Link to={`/category/${book.category}`} className="text-[7px] font-black text-indigo-500 uppercase tracking-widest">
            {book.category}
          </Link>
          <div className="flex items-center gap-0.5">
            <i className="fa-solid fa-star text-[7px] text-amber-400"></i>
            <span className="text-[8px] font-black text-slate-400">{book.rating}</span>
          </div>
        </div>

        <Link to={`/book/${book.id}`} className="block mb-1 px-1">
          <h3 className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-2 h-7 group-hover:text-indigo-600 transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-slate-400 text-[9px] font-medium mb-3 truncate px-1">{book.author}</p>
        
        <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-900">
            {formatPrice(book.price)}
          </span>

          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(stockQuantity > 0) onAddToCart(book); }}
            disabled={stockQuantity <= 0}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${
              stockQuantity > 0 
              ? 'bg-slate-900 text-white hover:bg-indigo-600 active:scale-90' 
              : 'bg-slate-100 text-slate-300'
            }`}
          >
            <i className="fa-solid fa-cart-shopping text-[9px]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
