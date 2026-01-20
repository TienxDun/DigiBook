
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import { useAuth } from '../AuthContext';
import { db } from '../services/db';
import { toast } from 'react-hot-toast';

interface WishlistPageProps {
  onAddToCart: (book: Book, quantity?: number, startPos?: { x: number, y: number }) => void;
  onQuickView?: (book: Book) => void;
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating';

const WishlistPage: React.FC<WishlistPageProps> = ({ onAddToCart, onQuickView }) => {
  const { wishlist, clearWishlist } = useAuth();
  const [syncedWishlist, setSyncedWishlist] = useState<(Book & { isAvailable: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    const syncWishlist = async () => {
      setLoading(true);
      try {
        const allBooks = await db.getBooks();
        const synced = wishlist.map(wishItem => {
          const dbBook = allBooks.find(b => b.id === wishItem.id);
          if (!dbBook) {
            return { ...wishItem, isAvailable: false, stockQuantity: 0 };
          }
          return { ...dbBook, isAvailable: true };
        });
        setSyncedWishlist(synced);
      } catch (error) {
        console.error("Error syncing wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    if (wishlist.length > 0) {
      syncWishlist();
    } else {
      setSyncedWishlist([]);
      setLoading(false);
    }
  }, [wishlist]);

  const filteredAndSortedWishlist = useMemo(() => {
    let result = [...syncedWishlist];

    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default: // newest - keep original order (assuming appends at end)
        // result.reverse(); // If we want newest first and they were added to end
        break;
    }

    return result;
  }, [syncedWishlist, searchQuery, sortBy]);

  const handleAddAllToCart = () => {
    const availableBooks = syncedWishlist.filter(b => b.isAvailable && b.stockQuantity > 0);
    if (availableBooks.length === 0) return;
    
    availableBooks.forEach(book => onAddToCart(book));
    toast.success(`Đã thêm ${availableBooks.length} sản phẩm vào giỏ hàng!`);
  };

  const handleClearWishlist = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?')) {
      clearWishlist();
      toast.success('Đã làm trống danh sách yêu thích');
    }
  };

  return (
    <div className="bg-slate-50/30 min-h-screen">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-50/50 blur-[120px] rounded-full -z-10 translate-x-1/4 -translate-y-1/4"></div>
      
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-12 lg:pt-16 pb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 lg:mb-16 gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-lg mb-4 border border-rose-100/50">
              <i className="fa-solid fa-heart text-rose-500 text-xs"></i>
              <p className="text-xs font-bold text-rose-500 uppercase tracking-premium">My Favorites</p>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Bộ sưu tập <span className="text-rose-500">yêu thích</span>.
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Lưu trữ những tác phẩm tâm đắc nhất của bạn. Bạn đang có <span className="text-slate-900 font-bold">{wishlist.length}</span> cuốn sách trong danh sách.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {wishlist.length > 0 && (
               <button 
                 onClick={handleClearWishlist}
                 className="group flex items-center gap-2 px-4 py-3 bg-white border border-rose-100 text-rose-500 rounded-xl font-bold text-xs uppercase tracking-premium shadow-sm hover:bg-rose-50 transition-all active:scale-95"
               >
                  <i className="fa-solid fa-trash-can"></i>
                  Xóa tất cả
               </button>
             )}
             <button 
               onClick={handleAddAllToCart}
               className="group flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-premium shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={syncedWishlist.filter(b => b.isAvailable && b.stockQuantity > 0).length === 0}
             >
                <i className="fa-solid fa-cart-plus"></i>
                Thêm tất cả vào giỏ
             </button>
             <Link to="/category/Tất cả sách" className="group flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-xs uppercase tracking-premium shadow-sm hover:shadow-md transition-all active:scale-95">
                <i className="fa-solid fa-plus-circle text-indigo-500"></i>
                Thêm sách mới
             </Link>
          </div>
        </div>

        {wishlist.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input 
                type="text"
                placeholder="Tìm trong danh sách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">Sắp xếp:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="newest">Mới thêm</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="rating">Đánh giá tốt nhất</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-slate-100/50 rounded-3xl h-80 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedWishlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {filteredAndSortedWishlist.map(book => (
              <div key={book.id} className="relative group">
                <BookCard 
                  book={book} 
                  onAddToCart={onAddToCart} 
                  onQuickView={onQuickView} 
                />
                
                {(!book.isAvailable || book.stockQuantity <= 0) && (
                  <div className="absolute inset-x-3 top-3 z-10">
                    <div className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-xl border border-white/10 shadow-xl uppercase tracking-widest flex items-center gap-2">
                      <i className={`fa-solid ${!book.isAvailable ? 'fa-ban' : 'fa-box-open'} text-rose-400`}></i>
                      {!book.isAvailable ? 'Ngừng kinh doanh' : 'Hết hàng'}
                    </div>
                  </div>
                )}

                {(!book.isAvailable || book.stockQuantity <= 0) && (
                   <div className="absolute inset-0 bg-white/40 backdrop-grayscale-[0.5] rounded-[2rem] pointer-events-none -m-1 border border-white/20"></div>
                )}
              </div>
            ))}
          </div>
        ) : wishlist.length > 0 && searchQuery ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
            <i className="fa-solid fa-cloud-moon text-4xl text-slate-200 mb-4"></i>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-slate-500 text-sm">Thử tìm kiếm với từ khóa khác nhé!</p>
          </div>
        ) : (
          <div className="py-16 lg:py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/30 to-transparent"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-rose-50 text-rose-300 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <i className="fa-regular fa-heart text-3xl"></i>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 uppercase tracking-premium">Danh sách đang trống</h3>
              <p className="text-slate-500 mb-10 max-w-xs mx-auto font-medium text-sm">
                Hãy khám phá kho sách khổng lồ và lưu lại những cuốn sách bạn muốn sở hữu.
              </p>
              <Link to="/category/Tất cả sách" className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-premium text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 inline-block active:scale-95">
                Khám phá ngay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;

