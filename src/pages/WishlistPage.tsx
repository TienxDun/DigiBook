
import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import { useAuth } from '../AuthContext';

interface WishlistPageProps {
  onAddToCart: (book: Book) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ onAddToCart }) => {
  const { wishlist } = useAuth();

  return (
    <div className="bg-slate-50/30 min-h-screen">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-50/50 blur-[120px] rounded-full -z-10 translate-x-1/4 -translate-y-1/4"></div>
      
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-20 lg:pt-24 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 lg:mb-16 gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-lg mb-4 border border-rose-100/50">
              <i className="fa-solid fa-heart text-rose-500 text-[10px]"></i>
              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-premium">My Favorites</p>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Bộ sưu tập <span className="text-rose-500">yêu thích</span>.
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Lưu trữ những tác phẩm tâm đắc nhất của bạn. Bạn đang có <span className="text-slate-900 font-bold">{wishlist.length}</span> cuốn sách trong danh sách.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => wishlist.forEach(book => onAddToCart(book))}
               className="group flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-premium shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={wishlist.length === 0}
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

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {wishlist.map(book => (
              <BookCard key={book.id} book={book} onAddToCart={onAddToCart} />
            ))}
          </div>
        ) : (
          <div className="py-24 lg:py-32 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
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
