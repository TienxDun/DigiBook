
import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import { useAuth } from '../App';

interface WishlistPageProps {
  onAddToCart: (book: Book) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ onAddToCart }) => {
  const { wishlist } = useAuth();

  return (
    <div className="container mx-auto px-6 py-12 lg:py-20 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Sách yêu thích</h1>
          <p className="text-slate-500 font-medium">Bạn có <span className="text-indigo-600 font-bold">{wishlist.length}</span> cuốn sách trong danh sách lưu trữ.</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all w-fit">
          <i className="fa-solid fa-plus-circle"></i>
          Khám phá thêm sách mới
        </Link>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlist.map(book => (
            // Chỉ hiển thị BookCard, nút Heart đã được tích hợp sẵn bên trong Card và xử lý logic z-index tốt
            <BookCard key={book.id} book={book} onAddToCart={onAddToCart} />
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="w-24 h-24 bg-rose-50 text-rose-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-regular fa-heart text-4xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Danh sách trống</h3>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">Hãy duyệt qua các danh mục và nhấn vào biểu tượng trái tim để lưu lại những cuốn sách bạn yêu thích.</p>
          <Link to="/" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
            Xem tất cả sách
          </Link>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
