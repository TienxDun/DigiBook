
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/services/db';
import { Book, Author } from '@/shared/types';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';

const AuthorBookCard: React.FC<{
  book: Book,
  index: number,
  onQuickView?: (book: Book) => void
}> = ({ book, index, onQuickView }) => {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useAuth();

  const isWishlisted = wishlist.some(b => b.id === book.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white rounded-3xl p-4 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-500"
    >
      <div className="flex gap-5">
        {/* Book Cover */}
        <Link 
          to={`/book/${book.id}`}
          className="relative w-28 h-40 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500 block"
        >
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

          {book.badge && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-xs font-bold text-white uppercase rounded-md shadow-lg">
              {book.badge}
            </div>
          )}
        </Link>

        {/* Book Info */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex justify-between items-start gap-2 mb-1">
              <Link to={`/book/${book.id}`} className="flex-1">
                <h3 className="font-extrabold text-slate-800 text-sm lg:text-base leading-tight line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors">
                  {book.title}
                </h3>
              </Link>
              <button
                onClick={() => toggleWishlist(book)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isWishlisted ? 'text-rose-500 bg-rose-50' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
              >
                <i className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart text-xs`}></i>
              </button>
            </div>

            <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
              {book.description}
            </p>

            <div className="flex flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                <i className="fa-solid fa-layer-group text-xs text-slate-400"></i>
                <span className="text-xs font-bold text-slate-600">{book.pages} trang</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                <i className="fa-solid fa-calendar text-xs text-slate-400"></i>
                <span className="text-xs font-bold text-slate-600">{book.publishYear}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex flex-col">
              {book.originalPrice && (
                <span className="text-xs text-slate-400 line-through leading-none mb-1">
                  {formatPrice(book.originalPrice)}
                </span>
              )}
              <span className="text-base font-black text-rose-600 leading-none">
                {formatPrice(book.price)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onQuickView?.(book)}
                className="w-9 h-9 border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-all"
              >
                <i className="fa-solid fa-expand text-xs"></i>
              </button>
              <button
                onClick={(e) => addToCart(book, 1, { x: e.clientX, y: e.clientY })}
                disabled={book.stockQuantity <= 0}
                className="px-4 h-9 bg-slate-900 text-white rounded-xl text-micro font-bold uppercase tracking-premium flex items-center justify-center gap-2 hover:bg-indigo-600 disabled:bg-slate-200 transition-all shadow-lg shadow-slate-200"
              >
                {book.stockQuantity > 0 ? (
                  <>
                    <i className="fa-solid fa-cart-plus text-xs"></i>
                    Thêm
                  </>
                ) : 'Hết hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AuthorPage: React.FC<{ onQuickView?: (book: Book) => void }> = ({ onQuickView }) => {
  const { authorName } = useParams<{ authorName: string }>();
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [authorInfo, setAuthorInfo] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest');

  const sortedBooks = [...authorBooks].sort((a, b) => {
    if (sortBy === 'newest') return b.publishYear - a.publishYear;
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [allBooks, allAuthors] = await Promise.all([
        db.getBooks(),
        db.getAuthors()
      ]);

      const filtered = allBooks.filter(b => b.author.toLowerCase() === authorName?.toLowerCase());
      const info = allAuthors.find(a => a.name.toLowerCase() === authorName?.toLowerCase());

      setAuthorBooks(filtered);
      setAuthorInfo(info || null);
      setLoading(false);
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [authorName]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen pt-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-indigo-950 rounded-[2.5rem] p-10 mb-6 flex flex-col lg:flex-row items-center gap-10">
            <Skeleton className="w-48 h-48 rounded-3xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-1/2" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 flex gap-5">
                    <Skeleton className="w-28 h-40 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-3 py-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-10 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-lg" />
                        <Skeleton className="h-6 w-16 rounded-lg" />
                      </div>
                      <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-9 w-20 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-[400px] rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mainCategory = authorBooks.length > 0
    ? [...new Set(authorBooks.map(b => b.category))].sort((a, b) =>
      authorBooks.filter(x => x.category === b).length - authorBooks.filter(x => x.category === a).length
    )[0]
    : "Văn học";

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-600 -z-10 opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-6 lg:pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-6 text-micro font-bold uppercase tracking-premium text-slate-400">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
          <i className="fa-solid fa-chevron-right text-xs opacity-50"></i>
          <Link to="/authors" className="hover:text-indigo-600 transition-colors">Tác giả</Link>
          <i className="fa-solid fa-chevron-right text-xs opacity-50"></i>
          <span className="text-slate-900">{authorName}</span>
        </nav>

        {/* Header Block */}
        <div className="bg-indigo-950 rounded-[1.5rem] lg:rounded-[2rem] p-5 lg:p-7 mb-6 relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/10 blur-[100px]" aria-hidden="true"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/5 rounded-full blur-[80px]"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl lg:rounded-3xl overflow-hidden border-[6px] border-white/5 shadow-2xl bg-indigo-900 flex-shrink-0 group">
              <img
                src={authorInfo?.avatar || `https://ui-avatars.com/api/?name=${authorName}&background=4f46e5&color=fff&size=512&bold=true`}
                alt={authorName}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-micro font-bold uppercase tracking-premium border border-indigo-500/20">Tác giả tiêu biểu</span>
                <span className="px-2.5 py-0.5 bg-white/5 text-slate-400 rounded-lg text-micro font-bold uppercase tracking-premium border border-white/5">{mainCategory}</span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-4 tracking-tight leading-tight">{authorName}</h1>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-micro font-bold text-indigo-400 uppercase tracking-premium mb-0.5">Tác phẩm</p>
                  <p className="text-xl font-extrabold text-white">{authorBooks.length}</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-micro font-bold text-indigo-400 uppercase tracking-premium mb-0.5">Đánh giá</p>
                  <p className="text-xl font-extrabold text-white">4.9<span className="text-[10px] text-indigo-400">/5</span></p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-micro font-bold text-indigo-400 uppercase tracking-premium mb-0.5">Độc giả</p>
                  <p className="text-xl font-extrabold text-white">12k+</p>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-micro font-bold text-indigo-400 uppercase tracking-premium mb-0.5">Theo dõi</p>
                  <p className="text-xl font-extrabold text-white">4.2k</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Info Side */}
          <div className="lg:col-span-8 space-y-6">

            {/* Biography Block */}
            <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-feather-pointed text-xs"></i>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-premium">Tiểu sử & Sự nghiệp</h2>
                  <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">Hành trình sáng tác</p>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <p className="text-sm text-slate-600 leading-[1.7] font-medium space-y-3">
                  {authorInfo?.bio?.split('\n').map((para, i) => (
                    <span key={i} className="block mb-3">
                      {para}
                    </span>
                  )) || (
                      <span className="italic opacity-80">
                        {authorName} là một trong những cây bút có sức ảnh hưởng sâu rộng trong nền văn học hiện đại. Với khả năng quan sát tinh tế và ngôn từ sắc sảo, các tác phẩm của tác giả không chỉ là những câu chuyện kể mà còn là những bản chiêm nghiệm sâu sắc về cuộc sống, con người và những giá trị nhân bản vĩnh cửu.
                      </span>
                    )}
                </p>
              </div>

              {/* Genres Focus */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-micro font-bold text-slate-400 uppercase tracking-premium mr-2">Tags:</span>
                {Array.from(new Set(authorBooks.map(b => b.category))).map(cat => (
                  <Link key={cat} to={`/category/${cat}`} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-micro font-bold uppercase tracking-premium hover:bg-white hover:text-indigo-600 transition-all border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10">
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            {/* Works List */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-2 lg:px-0 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <i className="fa-solid fa-book-bookmark text-xs"></i>
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-premium">Tất cả tác phẩm</h2>
                    <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">Hơn {authorBooks.length} cuốn trên giá sách DigiBook</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-micro font-bold uppercase tracking-premium bg-transparent outline-none px-2 py-1.5 text-slate-600 cursor-pointer"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                  </select>
                </div>
              </div>

              {sortedBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 lg:px-0">
                  {sortedBooks.map((book, index) => (
                    <AuthorBookCard
                      key={book.id}
                      book={book}
                      index={index}
                      onQuickView={onQuickView}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <i className="fa-solid fa-box-open text-3xl text-slate-200 mb-3"></i>
                  <p className="text-slate-400 font-bold uppercase tracking-premium text-micro">Hiện đang cập nhật thêm tác phẩm...</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Profile Side - REMOVED */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Newsletter or CTA */}
            <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <h4 className="text-base font-extrabold mb-1 tracking-premium uppercase">Theo dõi {authorName}</h4>
              <p className="text-xs text-emerald-100 font-medium mb-4 leading-relaxed">Nhận thông báo ngay khi có tác phẩm hoặc sự kiện mới nhất.</p>
              <button className="w-full py-3.5 bg-white text-emerald-600 rounded-xl font-extrabold uppercase tracking-premium text-micro hover:bg-emerald-50 transition-colors shadow-lg shadow-black/10">
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorPage;

