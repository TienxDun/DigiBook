
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { useAuth } from '../AuthContext';
import { db, Review } from '../services/db';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const BookDetails: React.FC<{ onAddToCart: (book: Book) => void }> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, user, setShowLoginModal } = useAuth();
  
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [scrolled, setScrolled] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const foundBook = await db.getBookById(id);
        if (foundBook) {
          setBook(foundBook);
          const bookReviews = await db.getReviewsByBookId(id);
          setReviews(bookReviews);
        }
      }
    };
    fetchData();
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  const isWishlisted = useMemo(() => wishlist.some(b => b.id === id), [wishlist, id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowLoginModal(true); return; }
    if (!newComment.trim()) return;
    
    await db.addReview({
      bookId: id!,
      userId: user.id,
      userName: user.name,
      rating: newRating,
      content: newComment
    });
    setNewComment('');
    const updatedReviews = await db.getReviewsByBookId(id!);
    setReviews(updatedReviews);
  };

  if (!book) return <div className="h-screen flex items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-600"></i></div>;

  const handleToggleWishlist = () => {
    if (book) toggleWishlist(book);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-indigo-600 -z-10 opacity-[0.03] pointer-events-none"></div>

      {/* Main Container - Added pt-24 to fix header overlap */}
      <div className="container mx-auto px-4 lg:px-6 pt-24 lg:pt-32 pb-32">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-12 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
          <i className="fa-solid fa-chevron-right text-[8px]"></i>
          <Link to={`/category/${book.category}`} className="hover:text-indigo-600 transition-colors">{book.category}</Link>
          <i className="fa-solid fa-chevron-right text-[8px]"></i>
          <span className="text-slate-900 line-clamp-1">{book.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: Visual & Main Actions */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white sticky top-32">
              <div className="relative group mx-auto max-w-[340px] lg:max-w-none">
                 <div className="absolute -inset-4 bg-indigo-500/5 rounded-[2rem] blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
                 <div className="relative aspect-[3/4.5] w-full bg-slate-100 rounded-[1.5rem] overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-[1.01] flex items-center justify-center">
                   {imageError ? (
                     <div className="flex flex-col items-center gap-3 text-slate-300">
                       <i className="fa-solid fa-book-open text-5xl"></i>
                       <span className="text-[10px] font-black uppercase tracking-widest">Ảnh không khả dụng</span>
                     </div>
                   ) : (
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover"
                    />
                   )}
                 </div>
              </div>
              
              <div className="mt-12 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onAddToCart(book)}
                  disabled={book.stock_quantity <= 0}
                  className="py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400"
                >
                  <i className="fa-solid fa-cart-plus"></i> MUA NGAY
                </button>
                <button 
                  onClick={handleToggleWishlist}
                  className={`py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${
                    isWishlisted ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600'
                  }`}
                >
                  <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
                  {isWishlisted ? 'ĐÃ THÍCH' : 'YÊU THÍCH'}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-start">
                <div className="text-center flex-1 border-r border-slate-50 px-2 group/badge">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover/badge:bg-indigo-100">
                    <i className="fa-solid fa-certificate text-indigo-500 text-base"></i>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500 leading-tight block">100% Chính hãng</span>
                </div>
                <div className="text-center flex-1 border-r border-slate-50 px-2 group/badge">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover/badge:bg-indigo-100">
                    <i className="fa-solid fa-bolt-lightning text-indigo-500 text-base"></i>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500 leading-tight block">Giao nhanh 2h</span>
                </div>
                <div className="text-center flex-1 px-2 group/badge">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover/badge:bg-indigo-100">
                    <i className="fa-solid fa-arrows-rotate text-indigo-500 text-base"></i>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500 leading-tight block">7 Ngày đổi trả</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Content Blocks */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* 1. Header Information Block */}
            <div className="bg-white p-10 lg:p-12 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{book.category}</span>
                <span className="text-slate-300">|</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ISBN: {book.isbn}</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.2] mb-6 tracking-tight">
                {book.title}
              </h1>

              <div className="flex flex-wrap items-center gap-8 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black">
                    {book.rating}
                  </div>
                  <div>
                    <div className="flex gap-0.5 mb-0.5">
                      {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[8px] ${i < Math.floor(book.rating) ? 'text-amber-400' : 'text-slate-100'}`}></i>)}
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đánh giá trung bình</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{formatPrice(book.price)}</span>
                  {book.original_price && (
                    <span className="text-sm text-slate-400 line-through font-bold">{formatPrice(book.original_price)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(book.author)}&background=4f46e5&color=fff&bold=true`} className="w-12 h-12 rounded-xl" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tác giả</p>
                  <Link to={`/author/${book.author}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate">
                    {book.author}
                  </Link>
                </div>
                <Link to={`/author/${book.author}`} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
                  <i className="fa-solid fa-arrow-right-long"></i>
                </Link>
              </div>
            </div>

            {/* 2. Synopsis Block */}
            <div className="bg-white p-10 lg:p-12 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">01</span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Giới thiệu tác phẩm</h3>
              </div>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-600 leading-[1.8] font-medium whitespace-pre-line">
                  {book.description}
                </p>
              </div>
            </div>

            {/* 3. Publication Info Block */}
            <div className="bg-white overflow-hidden rounded-[3rem] shadow-sm border border-slate-100">
               <div className="p-10 lg:p-12 border-b border-slate-50 bg-white">
                 <div className="flex items-center gap-4">
                   <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs">02</span>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thông tin xuất bản</h3>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2">
                 {/* Author Bio Section */}
                 <div className="p-10 lg:p-12 bg-slate-50/40">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">Tác giả & Tiểu sử</p>
                    <p className="text-slate-500 leading-relaxed font-medium text-sm">
                      {book.authorBio}
                    </p>
                    <div className="mt-8">
                      <Link to={`/author/${book.author}`} className="text-[10px] font-black text-indigo-600 hover:underline flex items-center gap-2 uppercase tracking-widest">
                        Tìm hiểu thêm về tác giả <i className="fa-solid fa-arrow-right-long"></i>
                      </Link>
                    </div>
                 </div>
                 
                 {/* Edition Details Section */}
                 <div className="p-10 lg:p-12 border-l border-slate-50">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">Thông số ấn bản</p>
                    <div className="space-y-5">
                      {[
                        { label: 'Ngôn ngữ', val: book.language, icon: 'fa-globe' },
                        { label: 'Nhà xuất bản', val: book.publisher, icon: 'fa-building-columns' },
                        { label: 'Năm xuất bản', val: book.publishYear, icon: 'fa-calendar-check' },
                        { label: 'Số trang', val: `${book.pages} trang`, icon: 'fa-file-lines' },
                        { label: 'Định dạng', val: 'Bìa cứng cao cấp', icon: 'fa-book-bookmark' }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center group/item">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <i className={`fa-solid ${item.icon} w-4 text-slate-300 group-hover/item:text-indigo-400 transition-colors`}></i> {item.label}
                          </span>
                          <span className="text-xs font-black text-slate-700">{item.val}</span>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
            </div>

            {/* 4. Community Reviews Block */}
            <div className="bg-white p-10 lg:p-12 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">03</span>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cộng đồng độc giả</h3>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-2xl font-black text-slate-900">{book.rating}</span>
                   <i className="fa-solid fa-star text-amber-400 text-sm"></i>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Review Form */}
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Để lại cảm nhận</h4>
                  <form onSubmit={handleAddReview} className="space-y-5">
                    <div className="flex gap-3">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setNewRating(s)} className={`text-xl transition-all ${s <= newRating ? 'text-amber-400 scale-110' : 'text-slate-200'}`}>
                          <i className="fa-solid fa-star"></i>
                        </button>
                      ))}
                    </div>
                    <textarea 
                      value={newComment} onChange={e => setNewComment(e.target.value)}
                      placeholder="Chia sẻ suy nghĩ của bạn về nội dung cuốn sách này..." 
                      className="w-full p-6 bg-white rounded-2xl outline-none focus:ring-4 ring-indigo-50 border-none h-32 font-medium text-slate-700 transition-all text-sm resize-none"
                    />
                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all text-[10px] shadow-lg">
                      Gửi đánh giá ngay
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map(r => (
                      <div key={r.id} className="pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-[10px]">{r.userName.charAt(0)}</div>
                            <span className="text-xs font-black text-slate-900">{r.userName}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[7px] ${i < r.rating ? 'text-amber-400' : 'text-slate-100'}`}></i>)}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium pl-11">{r.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center opacity-40">
                      <i className="fa-solid fa-feather-pointed text-4xl mb-4"></i>
                      <p className="text-xs font-bold uppercase tracking-widest">Chưa có đánh giá nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Mini Sticky Action Bar */}
      <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-700 transform ${scrolled ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 pr-6 shadow-[0_24px_48px_rgba(0,0,0,0.4)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/20">
            {imageError ? (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <i className="fa-solid fa-book text-slate-600"></i>
              </div>
            ) : (
              <img src={book.cover} className="w-full h-full object-cover" alt="" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-black text-xs line-clamp-1 max-w-[150px]">{book.title}</p>
            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">{formatPrice(book.price)}</p>
          </div>
          <button 
            onClick={() => onAddToCart(book)}
            disabled={book.stock_quantity <= 0}
            className="h-10 px-6 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {book.stock_quantity > 0 ? <><i className="fa-solid fa-bag-shopping"></i> Mua ngay</> : 'Hết hàng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
