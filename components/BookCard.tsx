
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
      className={`relative group flex flex-col h-full bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-500 w-full ${stockQuantity <= 0 ? 'grayscale opacity-60' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Container - Improved Rigid Aspect Ratio */}
      <div className="relative w-full pt-[133.33%] rounded-2xl overflow-hidden bg-slate-100 mb-3 border border-slate-50 transition-all duration-500">
        <div className="absolute inset-0">
          {/* Status Badges */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
            {stockQuantity <= 0 && (
              <span className="px-2 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-xl">Hết hàng</span>
            )}
            {book.badge && (
              <span className="px-2 py-1 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-xl shadow-rose-500/20">{book.badge}</span>
            )}
            {!book.badge && book.rating >= 4.8 && (
              <span className="px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-xl shadow-amber-500/20">Bán chạy</span>
            )}
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={handleToggleWishlist}
            className={`absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'} ${
              isWishlisted 
                ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' 
                : 'bg-white/95 backdrop-blur-md text-slate-400 hover:text-rose-500 shadow-lg'
            }`}
          >
            <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
          </button>

          {/* Book Image */}
          <Link to={`/book/${book.id}`} className="relative block w-full h-full group/img overflow-hidden">
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            )}
            <img 
              src={getOptimizedImageUrl(book.cover)} 
              alt={book.title} 
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-1000 ease-out ${isHovered ? 'scale-110 rotate-1' : 'scale-100 rotate-0'} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Elegant Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-indigo-950/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-500`} />
          </Link>
        </div>
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-grow px-1">
        <div className="flex justify-between items-center mb-1.5">
          <Link to={`/category/${book.category}`} className="text-[8px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
            {book.category}
          </Link>
          <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md">
            <i className="fa-solid fa-star text-[8px] text-amber-500"></i>
            <span className="text-[9px] font-black text-amber-700">{book.rating}</span>
          </div>
        </div>

        <Link to={`/book/${book.id}`} className="block mb-1">
          <h3 className="font-bold text-slate-900 text-[13px] leading-tight line-clamp-2 h-8 group-hover:text-indigo-600 transition-colors duration-300">
            {book.title}
          </h3>
        </Link>
        <p className="text-slate-400 text-[10px] font-medium mb-3 truncate">{book.author}</p>
        
        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 line-through decoration-rose-300/50 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold tracking-tighter">
              {formatPrice(book.price * 1.2)}
            </span>
            <span className="text-sm font-black text-slate-900 tracking-tight">
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
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              stockQuantity <= 0 
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 active:scale-90 bg-gradient-to-br from-indigo-600 to-violet-600'
            }`}
          >
            <i className="fa-solid fa-cart-plus text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
