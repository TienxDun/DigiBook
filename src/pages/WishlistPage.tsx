
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-20 sm:pb-16">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 lg:mb-16 gap-4 sm:gap-6"
        >
          <div className="max-w-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg mb-4 border border-rose-100/50"
            >
              <i className="fa-solid fa-heart text-rose-500 text-sm"></i>
              <p className="text-sm font-bold text-rose-500 uppercase tracking-premium">My Favorites</p>
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3 sm:mb-4"
            >
              Bộ sưu tập <span className="text-rose-500">yêu thích</span>.
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-slate-500 text-sm sm:text-base font-medium"
            >
              Lưu trữ những tác phẩm tâm đắc nhất của bạn. Bạn đang có <span className="text-slate-900 font-bold">{wishlist.length}</span> cuốn sách trong danh sách.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
             {wishlist.length > 0 && (
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={handleClearWishlist}
                 className="group flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm uppercase tracking-premium shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all whitespace-nowrap"
               >
                  <i className="fa-solid fa-trash-can"></i>
                  Xóa tất cả
               </motion.button>
             )}
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.95 }}
               onClick={handleAddAllToCart}
               className="group flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm uppercase tracking-premium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
               disabled={syncedWishlist.filter(b => b.isAvailable && b.stockQuantity > 0).length === 0}
             >
                <i className="fa-solid fa-cart-plus"></i>
                Thêm tất cả vào giỏ
             </motion.button>
             <motion.div
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.95 }}
             >
               <Link to="/category/Tất cả sách" className="group flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 rounded-xl font-bold text-sm uppercase tracking-premium shadow-lg shadow-slate-300/25 hover:shadow-slate-300/40 transition-all block border border-slate-300/50 whitespace-nowrap">
                  <i className="fa-solid fa-plus-circle text-indigo-500"></i>
                  Thêm sách mới
               </Link>
             </motion.div>
          </motion.div>
        </motion.div>

        {wishlist.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col gap-4 mb-6 sm:mb-8 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input 
                type="text"
                placeholder="Tìm trong danh sách yêu thích..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 sm:py-2.5 bg-slate-50 border-none rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sắp xếp:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 py-3 sm:py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[140px]"
              >
                <option value="newest">Mới thêm</option>
                <option value="price-asc">Giá thấp → cao</option>
                <option value="price-desc">Giá cao → thấp</option>
                <option value="rating">Đánh giá tốt</option>
              </select>
            </div>
          </motion.div>
        )}

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-slate-100/50 rounded-3xl h-72 sm:h-80 border border-slate-100 shadow-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-pulse"></div>
              </motion.div>
            ))}
          </motion.div>
        ) : filteredAndSortedWishlist.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6"
          >
            {filteredAndSortedWishlist.map((book, index) => (
              <motion.div 
                key={book.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="relative group"
              >
                <BookCard 
                  book={book} 
                  onAddToCart={onAddToCart} 
                  onQuickView={onQuickView} 
                />
                
                {(!book.isAvailable || book.stockQuantity <= 0) && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-x-3 top-3 z-10"
                  >
                    <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs font-black px-3 py-2 rounded-xl border border-white/10 shadow-xl uppercase tracking-widest flex items-center gap-2">
                      <i className={`fa-solid ${!book.isAvailable ? 'fa-ban' : 'fa-box-open'} text-rose-400`}></i>
                      {!book.isAvailable ? 'Ngừng kinh doanh' : 'Hết hàng'}
                    </div>
                  </motion.div>
                )}

                {(!book.isAvailable || book.stockQuantity <= 0) && (
                   <div className="absolute inset-0 bg-white/50 backdrop-grayscale-[0.3] rounded-[2rem] pointer-events-none -m-1 border border-white/30"></div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : wishlist.length > 0 && searchQuery ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-16 sm:py-20 text-center bg-white rounded-[2.5rem] border border-slate-100"
          >
            <i className="fa-solid fa-cloud-moon text-4xl text-slate-200 mb-4"></i>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-slate-500 text-sm">Thử tìm kiếm với từ khóa khác nhé!</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="py-12 sm:py-16 lg:py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/30 to-transparent"></div>
            <div className="relative z-10">
              <motion.div 
                animate={{ rotate: [0, 12, -12, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 bg-rose-50 text-rose-300 rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8"
              >
                <i className="fa-regular fa-heart text-3xl"></i>
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 uppercase tracking-premium">Danh sách đang trống</h3>
              <p className="text-slate-500 mb-8 sm:mb-10 max-w-xs mx-auto font-medium text-sm sm:text-base px-4">
                Hãy khám phá kho sách khổng lồ và lưu lại những cuốn sách bạn muốn sở hữu.
              </p>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Link to="/category/Tất cả sách" className="px-8 sm:px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-premium text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 inline-block">
                  Khám phá ngay
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;

