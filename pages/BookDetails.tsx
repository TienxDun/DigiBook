
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { useAuth } from '../AuthContext';
import { db, Review, AVAILABLE_AI_MODELS } from '../services/db';
import BookCard from '../components/BookCard';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const BookDetails: React.FC<{ onAddToCart: (book: Book) => void }> = ({ onAddToCart }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, user, setShowLoginModal } = useAuth();
  
  const [book, setBook] = useState<Book | null>(null);
  const [authorInfo, setAuthorInfo] = useState<{ id: string, name: string, bio: string, avatar: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [scrolled, setScrolled] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeModelName, setActiveModelName] = useState('Gemini');

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        // Fetch model config
        db.getAIConfig().then(config => {
          const model = AVAILABLE_AI_MODELS.find(m => m.id === config.activeModelId);
          if (model) setActiveModelName(model.name.split(' (')[0]);
        });

        const foundBook = await db.getBookById(id);
        if (foundBook) {
          setBook(foundBook);
          
          // Fetch author info
          db.getAuthors().then(authors => {
            const info = authors.find(a => a.name.toLowerCase() === foundBook.author.toLowerCase());
            if (info) setAuthorInfo(info as any);
          });

          const bookReviews = await db.getReviewsByBookId(id);
          setReviews(bookReviews);
          
          // Gợi ý sách liên quan
          const related = await db.getRelatedBooks(foundBook.category, id, foundBook.author);
          setRelatedBooks(related);

          // Update recent books in localStorage
          const stored = localStorage.getItem('digibook_recent');
          let recent: Book[] = stored ? JSON.parse(stored) : [];
          // Filter out current book if already exists and add to top
          recent = [foundBook, ...recent.filter(b => b.id !== foundBook.id)].slice(0, 5);
          localStorage.setItem('digibook_recent', JSON.stringify(recent));
          setRecentBooks(recent.filter(b => b.id !== foundBook.id));
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

  const handleGetAIInsight = async () => {
    if (!book) return;
    setLoadingAI(true);
    const result = await db.getAIInsight(book.title, book.author, book.description);
    setAiInsight(result);
    setLoadingAI(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-600 -z-10 opacity-[0.03] pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-16 lg:pt-24 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
          <i className="fa-solid fa-chevron-right text-[8px]"></i>
          <Link to={`/category/${book.category}`} className="hover:text-indigo-600 transition-colors">{book.category}</Link>
          <i className="fa-solid fa-chevron-right text-[8px]"></i>
          <span className="text-slate-900 line-clamp-1">{book.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT COLUMN: Visual & Main Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-white sticky top-28">
              <div className="relative group mx-auto max-w-[320px]">
                 <div className="absolute -inset-3 bg-indigo-500/5 rounded-[1.5rem] blur-xl group-hover:bg-indigo-500/10 transition-all"></div>
                 <div className="relative aspect-[3/4.5] w-full bg-slate-100 rounded-[1.5rem] overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-[1.01] flex items-center justify-center">
                   {imageError ? (
                     <div className="flex flex-col items-center gap-2 text-slate-300">
                       <i className="fa-solid fa-book-open text-5xl"></i>
                       <span className="text-[11px] font-black uppercase tracking-widest">Ảnh không khả dụng</span>
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
              
              <div className="mt-10 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onAddToCart(book)}
                  disabled={book.stock_quantity <= 0}
                  className="py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400 text-xs"
                >
                  <i className="fa-solid fa-cart-plus text-sm"></i> MUA NGAY
                </button>
                <button 
                  onClick={handleToggleWishlist}
                  className={`py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 text-xs ${
                    isWishlisted ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600'
                  }`}
                >
                  <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
                  {isWishlisted ? 'ĐÃ THÍCH' : 'YÊU THÍCH'}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-start">
                <div className="text-center flex-1 border-r border-slate-50 px-1 group/badge">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover/badge:bg-indigo-100">
                    <i className="fa-solid fa-certificate text-indigo-500 text-base"></i>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 leading-tight block">Chính hãng</span>
                </div>
                <div className="text-center flex-1 border-r border-slate-50 px-1 group/badge">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover/badge:bg-indigo-100">
                    <i className="fa-solid fa-bolt-lightning text-indigo-500 text-base"></i>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 leading-tight block">Giao nhanh</span>
                </div>
                <div className="text-center flex-1 px-1 group/badge">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover/badge:bg-indigo-100">
                    <i className="fa-solid fa-arrows-rotate text-indigo-500 text-base"></i>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 leading-tight block">Đổi trả 7 ngày</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Content Blocks */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Header Information Block */}
            <div className="bg-white p-10 lg:p-12 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-black uppercase tracking-widest">{book.category}</span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">ISBN: {book.isbn}</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.2] mb-8 tracking-tighter">
                {book.title}
              </h1>

              <div className="flex flex-wrap items-center gap-10 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-[15px] font-black shadow-xl shadow-slate-900/20">
                    {book.rating}
                  </div>
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[10px] ${i < Math.floor(book.rating) ? 'text-amber-400' : 'text-slate-100'}`}></i>)}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đánh giá chung</p>
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>
                <div className="flex flex-col">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{formatPrice(book.price)}</span>
                  {book.original_price && (
                    <span className="text-base text-slate-400 line-through font-bold mt-2 opacity-60 italic">{formatPrice(book.original_price)}</span>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-100/50"></div>
                <div className="relative z-10 flex gap-6">
                  <div className="relative">
                    <img 
                      src={authorInfo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.author)}&background=4f46e5&color=fff&bold=true`} 
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-50 shadow-md group-hover:scale-105 transition-transform duration-500" 
                      alt="" 
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-sm border-2 border-white shadow-lg">
                      <i className="fa-solid fa-feather-pointed"></i>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tác giả</p>
                    <Link to={`/author/${book.author}`} className="font-black text-2xl text-slate-900 hover:text-indigo-600 transition-colors block truncate leading-tight tracking-tight">
                      {book.author}
                    </Link>
                    {authorInfo?.bio && (
                      <p className="text-[12px] text-slate-400 font-bold line-clamp-1 mt-1.5 leading-relaxed italic">{authorInfo.bio}</p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Link to={`/author/${book.author}`} className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                      <i className="fa-solid fa-arrow-right-long text-xl"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights Block */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 lg:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
              {/* Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <i className="fa-solid fa-wand-magic-sparkles text-white text-xl animate-pulse"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Insights</h3>
                    <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Phân tích bởi {activeModelName}</p>
                  </div>
                </div>

                {aiInsight ? (
                  <div className="animate-fadeIn">
                    <div className="relative">
                      <i className="fa-solid fa-quote-left absolute -top-4 -left-6 text-indigo-500/20 text-5xl"></i>
                      <p className="text-lg lg:text-xl text-indigo-50/90 leading-relaxed font-semibold italic relative z-10">
                        {aiInsight}
                      </p>
                    </div>
                    <div className="mt-8 flex items-center gap-3">
                       <div className="w-10 h-1.5 rounded-full bg-indigo-500"></div>
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">DigiBook Smart Agent</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                       <i className="fa-solid fa-brain text-indigo-400/50 text-3xl"></i>
                    </div>
                    <p className="text-indigo-100/70 text-base font-semibold mb-10 max-w-sm leading-relaxed">
                      Khai phá tri thức: Để AI phân tích phong cách tác giả và giá trị cốt lõi của cuốn sách này.
                    </p>
                    <button 
                      onClick={handleGetAIInsight}
                      disabled={loadingAI}
                      className="px-8 py-4 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl flex items-center gap-3 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 text-[10px]"
                    >
                      {loadingAI ? (
                        <>
                          <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i> Khám phá với AI
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Synopsis Block */}
            <div className="bg-white p-10 lg:p-12 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">01</span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Giới thiệu tác phẩm</h3>
              </div>
              <p className="text-lg text-slate-600 leading-[1.8] font-medium whitespace-pre-line">
                {book.description}
              </p>
            </div>

            {/* 3. Publication Info Block */}
            <div className="bg-white overflow-hidden rounded-[3rem] shadow-sm border border-slate-100">
               <div className="p-10 lg:p-12 border-b border-slate-50 bg-white">
                 <div className="flex items-center gap-4">
                   <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs">02</span>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Thông tin chi tiết</h3>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2">
                 {/* Author Bio Section */}
                 <div className="p-10 lg:p-12 bg-slate-50/40 border-b md:border-b-0 md:border-r border-slate-50">
                    <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">Tác giả & Tiểu sử</p>
                    <p className="text-slate-500 leading-relaxed font-semibold text-sm">
                      {book.authorBio}
                    </p>
                    <div className="mt-8">
                      <Link to={`/author/${book.author}`} className="text-[11px] font-black text-indigo-600 hover:underline flex items-center gap-3 uppercase tracking-widest">
                        Chi tiết tác giả <i className="fa-solid fa-arrow-right-long text-xs"></i>
                      </Link>
                    </div>
                 </div>
                 
                 {/* Edition Details Section */}
                 <div className="p-10 lg:p-12">
                    <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">Thông số ấn bản</p>
                    <div className="space-y-6">
                      {[
                        { label: 'Ngôn ngữ', val: book.language, icon: 'fa-globe' },
                        { label: 'Nhà xuất bản', val: book.publisher, icon: 'fa-building-columns' },
                        { label: 'Năm xuất bản', val: book.publishYear, icon: 'fa-calendar-check' },
                        { label: 'Số trang', val: `${book.pages} trang`, icon: 'fa-file-lines' },
                        { label: 'Định dạng', val: 'Bìa cứng cao cấp', icon: 'fa-book-bookmark' }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[13px]">
                          <span className="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <i className={`fa-solid ${item.icon} w-4 text-slate-300`}></i> {item.label}
                          </span>
                          <span className="font-black text-slate-700">{item.val}</span>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
            </div>

            {/* 4. Community Reviews Block */}
            <div className="bg-white p-10 lg:p-12 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">03</span>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cộng đồng độc giả</h3>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-3xl font-black text-slate-900">{book.rating}</span>
                   <i className="fa-solid fa-star text-amber-400 text-xs"></i>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Review Form */}
                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                  <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-4">Để lại cảm nhận</h4>
                  <form onSubmit={handleAddReview} className="space-y-4">
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setNewRating(s)} className={`text-lg transition-all ${s <= newRating ? 'text-amber-400 scale-110' : 'text-slate-200'}`}>
                          <i className="fa-solid fa-star"></i>
                        </button>
                      ))}
                    </div>
                    <textarea 
                      value={newComment} onChange={e => setNewComment(e.target.value)}
                      placeholder="Chia sẻ suy nghĩ của bạn..." 
                      className="w-full p-4 bg-white rounded-xl outline-none focus:ring-4 ring-indigo-50 border-none h-24 font-medium text-slate-700 transition-all text-xs resize-none"
                    />
                    <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-lg font-black uppercase tracking-widest hover:bg-indigo-600 transition-all text-[9px] shadow-lg">
                      Gửi đánh giá
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.length > 0 ? (
                    reviews.map(r => (
                      <div key={r.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-[9px]">{r.userName.charAt(0)}</div>
                            <span className="text-[11px] font-black text-slate-900">{r.userName}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[6px] ${i < r.rating ? 'text-amber-400' : 'text-slate-100'}`}></i>)}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium pl-9">{r.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center opacity-40">
                      <i className="fa-solid fa-feather-pointed text-3xl mb-3"></i>
                      <p className="text-[9px] font-bold uppercase tracking-widest">Chưa có đánh giá</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Books Section */}
        {relatedBooks.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <i className="fa-solid fa-layer-group text-base"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gợi ý dành cho bạn</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Phân loại {book.category}</p>
                </div>
              </div>
              <Link to={`/category/${book.category}`} className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-[0.2em] flex items-center gap-2 group">
                Xem thêm <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-1"></i>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedBooks.map(b => (
                <BookCard key={b.id} book={b} onAddToCart={onAddToCart} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Section */}
        {recentBooks.length > 0 && (
          <div className="mt-20 pt-20 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                <i className="fa-solid fa-clock-rotate-left text-base"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sách đã xem gần đây</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Lưu trữ hành trình của bạn</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 opacity-80 hover:opacity-100 transition-opacity">
              {recentBooks.map(b => (
                <BookCard key={b.id} book={b} onAddToCart={onAddToCart} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-700 transform ${scrolled ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-1.5 pr-4 shadow-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
            {!imageError && <img src={book.cover} className="w-full h-full object-cover" alt="" />}
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-black text-[10px] line-clamp-1 max-w-[120px]">{book.title}</p>
            <p className="text-indigo-400 text-[8px] font-black uppercase tracking-widest">{formatPrice(book.price)}</p>
          </div>
          <button 
            onClick={() => onAddToCart(book)}
            disabled={book.stock_quantity <= 0}
            className="h-8 px-4 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-800"
          >
            {book.stock_quantity > 0 ? 'MUA NGAY' : 'HẾT HÀNG'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;