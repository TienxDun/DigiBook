
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
      className={`relative group flex flex-col h-full transition-all duration-500 ${stockQuantity <= 0 ? 'grayscale opacity-60' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Container */}
      <div className="relative aspect-[3/4.2] rounded-[1.5rem] overflow-hidden bg-slate-100 mb-4 shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/10 transition-all duration-500">
        
        {/* Status Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          {stockQuantity <= 0 && (
            <span className="px-2 py-0.5 bg-slate-900/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">Hết hàng</span>
          )}
          {book.badge && (
            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-md text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg border border-indigo-50">{book.badge}</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 transform ${isHovered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'} ${
            isWishlisted ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 hover:text-rose-500 shadow-lg'
          }`}
        >
          <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-xs`}></i>
        </button>

        {/* Book Image */}
        <Link to={`/book/${book.id}`} className="block w-full h-full">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" />
          )}
          <img 
            src={getOptimizedImageUrl(book.cover)} 
            alt={book.title} 
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-1000 ease-out ${isHovered ? 'scale-105 blur-[1px]' : 'scale-100 blur-0'} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {/* Hover Overlay Content */}
          <div className={`absolute inset-0 bg-indigo-900/40 backdrop-blur-[3px] flex flex-col items-center justify-center p-5 text-center transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <p className="text-white/80 text-[8px] font-black uppercase tracking-[0.2em] mb-1.5">Chi tiết</p>
             <div className="w-8 h-0.5 bg-white/40 mb-3 rounded-full"></div>
             <p className="text-white text-[10px] font-medium line-clamp-3 mb-4 px-2 italic leading-relaxed">
               "{book.description}"
             </p>
             <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105 active:scale-95">
               Xem thêm
             </button>
          </div>
        </Link>
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-grow px-1">
        <div className="flex justify-between items-start mb-1.5">
          <Link to={`/category/${book.category}`} className="text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors">
            {book.category}
          </Link>
          <div className="flex items-center gap-1">
            <i className="fa-solid fa-star text-[7px] text-amber-400"></i>
            <span className="text-[8px] font-black text-slate-400">{book.rating}</span>
          </div>
        </div>

        <Link to={`/book/${book.id}`} className="block group/title">
          <h3 className="font-bold text-slate-900 text-xs leading-tight mb-1 line-clamp-2 group-hover/title:text-indigo-600 transition-colors">
            {book.title}
          </h3>
        </Link>
        <p className="text-slate-400 text-[9px] font-medium mb-3">{book.author}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900 tracking-tight">
              {formatPrice(book.price)}
            </span>
          </div>

          <button 
            onClick={() => stockQuantity > 0 && onAddToCart(book)}
            disabled={stockQuantity <= 0}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              stockQuantity > 0 
              ? 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 active:scale-90' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
