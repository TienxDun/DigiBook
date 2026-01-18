
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { useAuth } from '../AuthContext';
import { db, Review } from '../services/db';
import { AVAILABLE_AI_MODELS } from '../constants/ai-models';
import BookCard from '../components/BookCard';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const BookDetails: React.FC<{ onAddToCart: (book: Book, quantity?: number) => void }> = ({ onAddToCart }) => {
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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [quantity, setQuantity] = useState(1);

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
          
          // Gợi ý sách liên quan - Tăng lên 5 cuốn để lấp đầy grid
          const related = await db.getRelatedBooks(foundBook.category, id, foundBook.author, 5);
          setRelatedBooks(related);

          // Update recent books in localStorage
          const stored = localStorage.getItem('digibook_recent');
          let recent: Book[] = stored ? JSON.parse(stored) : [];
          // Lưu 10 cuốn gần nhất để khi filter cuốn hiện tại vẫn còn đủ hiển thị
          recent = [foundBook, ...recent.filter(b => b.id !== foundBook.id)].slice(0, 10);
          localStorage.setItem('digibook_recent', JSON.stringify(recent));
          // Hiển thị 5 cuốn khác để lấp đầy grid xl:grid-cols-5
          setRecentBooks(recent.filter(b => b.id !== foundBook.id).slice(0, 5));
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
        <nav className="flex items-center gap-2 mb-10 text-micro font-bold uppercase tracking-premium text-slate-400">
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
                       <span className="text-micro font-bold uppercase tracking-premium">Ảnh không khả dụng</span>
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
                  onClick={() => onAddToCart(book, quantity)}
                  disabled={book.stock_quantity <= 0}
                  className="py-5 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400 text-micro"
                >
                  <i className="fa-solid fa-cart-plus text-sm"></i> MUA NGAY
                </button>
                <button 
                  onClick={handleToggleWishlist}
                  className={`py-5 rounded-2xl font-bold uppercase tracking-premium transition-all flex items-center justify-center gap-2 border-2 text-micro ${
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
                  <span className="text-micro font-bold uppercase tracking-tight text-slate-500 leading-tight block">Chính hãng</span>
                </div>
                <div className="text-center flex-1 border-r border-slate-50 px-1 group/badge">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover/badge:bg-indigo-100">
                    <i className="fa-solid fa-bolt-lightning text-indigo-500 text-base"></i>
                  </div>
                  <span className="text-micro font-bold uppercase tracking-tight text-slate-500 leading-tight block">Giao nhanh</span>
                </div>
                <div className="text-center flex-1 px-1 group/badge">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors group-hover/badge:bg-indigo-100">
                    <i className="fa-solid fa-arrows-rotate text-indigo-500 text-base"></i>
                  </div>
                  <span className="text-micro font-bold uppercase tracking-tight text-slate-500 leading-tight block">Đổi trả 7 ngày</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Content Blocks */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Header Information Block - Compact Dashboard */}
            <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-premium">{book.category}</span>
                    <span className="text-slate-200">|</span>
                    <span className="text-micro font-bold text-slate-400">ISBN: {book.isbn}</span>
                  </div>
                  
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
                    {book.title}
                  </h1>

                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[12px] ${i < Math.floor(book.rating) ? 'text-amber-400' : 'text-slate-100'}`}></i>)}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{book.rating}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-premium">
                      Đã bán: <span className="text-slate-900 font-extrabold ml-1">{(book.id.length * 7 + 124) % 1000}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 w-full md:w-fit">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-extrabold text-indigo-600 leading-none">{formatPrice(book.price)}</span>
                        {book.original_price && (
                          <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[10px] font-bold">-{Math.round(((book.original_price - book.price) / book.original_price) * 100)}%</span>
                        )}
                      </div>
                      {book.original_price && (
                        <span className="text-xs text-slate-400 line-through font-bold mt-1.5 opacity-60">{formatPrice(book.original_price)}</span>
                      )}
                    </div>
                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                    <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600"><i className="fa-solid fa-minus text-xs"></i></button>
                      <span className="w-4 text-center font-extrabold text-sm text-slate-900">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600"><i className="fa-solid fa-plus text-xs"></i></button>
                    </div>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="w-full md:w-[240px] grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tác giả', val: book.author, icon: 'fa-user-pen' },
                    { label: 'Ngôn ngữ', val: book.language, icon: 'fa-globe' },
                    { label: 'Số trang', val: book.pages, icon: 'fa-file-lines' },
                    { label: 'Định dạng', val: 'Bìa cứng', icon: 'fa-book' }
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-slate-50 shadow-sm flex flex-col gap-1">
                      <i className={`fa-solid ${item.icon} text-indigo-500/50 text-[10px]`}></i>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">{item.label}</p>
                      <p className="text-[11px] font-extrabold text-slate-800 truncate">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery & Status Bar - Inline */}
              <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 text-xs shadow-sm"><i className="fa-solid fa-truck-fast"></i></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-premium leading-none mb-1">Giao hàng dự kiến</p>
                    <p className="text-xs font-extrabold text-slate-900">Thứ hai - 20/01</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 text-xs shadow-sm"><i className="fa-solid fa-box-open"></i></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-premium leading-none mb-1">Tình trạng</p>
                    <p className="text-xs font-extrabold text-slate-900">{book.stock_quantity > 0 ? 'Sẵn sàng tại kho' : 'Hết hàng'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-500 text-xs shadow-sm"><i className="fa-solid fa-shield-halved"></i></div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-premium leading-none mb-1">Bảo đảm</p>
                    <p className="text-xs font-extrabold text-slate-900">Chính hãng 100%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Context + Synopsis - Side by Side Subgrid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Synopsis Panel */}
              <div className="md:col-span-7 bg-white p-6 lg:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-[10px]">01</span>
                  <p className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Mô tả tác phẩm</p>
                </div>
                <div className={`relative flex-grow ${!showFullDescription ? 'max-h-[160px] overflow-hidden' : ''}`}>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                    {book.description}
                  </p>
                  {!showFullDescription && (
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
                  )}
                </div>
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-4 text-[10px] font-bold text-indigo-600 uppercase tracking-premium hover:underline text-left"
                >
                  {showFullDescription ? 'Thu gọn' : 'Đọc thêm chi tiết...'}
                </button>
              </div>

              {/* AI Insights - Compact Side Card */}
              <div className="md:col-span-5 bg-slate-900 p-6 lg:p-8 rounded-[2rem] shadow-xl border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-12 -mt-12"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <i className="fa-solid fa-wand-magic-sparkles text-white text-sm"></i>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-tight">AI Insights</h2>
                      <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-premium">{activeModelName}</p>
                    </div>
                  </div>

                  {aiInsight ? (
                    <div className="animate-fadeIn">
                       <p className="text-xs lg:text-[13px] text-indigo-50/80 leading-relaxed font-semibold italic">"{aiInsight}"</p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-indigo-100/50 text-[11px] font-semibold mb-6">Phân tích chuyên sâu về phong cách tác giả & giá trị sách.</p>
                      <button 
                        onClick={handleGetAIInsight}
                        disabled={loadingAI}
                        className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold uppercase tracking-premium hover:bg-indigo-50 transition-all text-[10px] flex items-center justify-center gap-2"
                      >
                        {loadingAI ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : 'BẮT ĐẦU PHÂN TÍCH'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Combined Reviews & Author Block */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-50">
                   <div className="md:col-span-4 bg-slate-50/50 p-8 border-r border-slate-50">
                      <p className="text-micro font-bold text-indigo-600 uppercase tracking-premium mb-6">Về tác giả</p>
                      <div className="flex gap-4 items-center mb-6">
                         <img 
                           src={authorInfo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.author)}&background=4f46e5&color=fff&bold=true`} 
                           className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md" 
                           alt="" 
                         />
                         <div>
                            <Link to={`/author/${book.author}`} className="font-extrabold text-lg text-slate-900 hover:text-indigo-600 transition-colors block leading-tight">{book.author}</Link>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-premium">Chuyên mục {book.category}</p>
                         </div>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3 mb-6 italic">"{book.authorBio}"</p>
                      <Link to={`/author/${book.author}`} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-premium flex items-center gap-2">Tìm hiểu thêm <i className="fa-solid fa-arrow-right-long"></i></Link>
                   </div>
                   <div className="md:col-span-8 p-8">
                      <div className="flex items-center justify-between mb-8">
                        <p className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Cộng đồng đọc sách</p>
                        <div className="flex items-center gap-2">
                           <span className="text-xl font-extrabold text-slate-900">{book.rating}</span>
                           <i className="fa-solid fa-star text-amber-400 text-[10px]"></i>
                        </div>
                      </div>
                      
                      <div className="space-y-6 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                        {reviews.length > 0 ? (
                          reviews.map(r => (
                            <div key={r.id} className="flex gap-4">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0">{r.userName.charAt(0)}</div>
                              <div className="flex-grow">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[11px] font-bold text-slate-900">{r.userName}</span>
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[7px] ${i < r.rating ? 'text-amber-400' : 'text-slate-100'}`}></i>)}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{r.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-30 py-4">
                            <i className="fa-solid fa-feather-pointed text-xl mb-2"></i>
                            <p className="text-[9px] font-bold uppercase tracking-premium">Chưa có đánh giá</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
                
                {/* Review Action - Inline */}
                <div className="p-4 bg-white flex flex-col md:flex-row items-center gap-4">
                   <div className="flex gap-1.5 px-3">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button" onClick={() => setNewRating(s)} className={`text-sm transition-all ${s <= newRating ? 'text-amber-400 scale-110' : 'text-slate-200'}`}>
                          <i className="fa-solid fa-star"></i>
                        </button>
                      ))}
                   </div>
                   <div className="flex-grow flex gap-2 w-full">
                      <input 
                        type="text"
                        value={newComment} onChange={e => setNewComment(e.target.value)}
                        placeholder="Để lại cảm nhận của bạn..." 
                        className="flex-grow px-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-indigo-100 font-semibold text-xs text-slate-700 transition-all border-none"
                      />
                      <button onClick={handleAddReview} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-premium hover:bg-indigo-600 transition-all">Gửi</button>
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
                  <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Gợi ý dành cho bạn</h2>
                  <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-0.5">Phân loại {book.category}</p>
                </div>
              </div>
              <Link to={`/category/${book.category}`} className="text-micro font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-premium flex items-center gap-2 group">
                Xem thêm <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-1"></i>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
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
                <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Sách đã xem gần đây</h2>
                <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-0.5">Lưu trữ hành trình của bạn</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
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
            <p className="text-white font-extrabold text-[10px] line-clamp-1 max-w-[120px]">{book.title}</p>
            <p className="text-indigo-400 text-micro font-bold uppercase tracking-premium">{formatPrice(book.price)}</p>
          </div>
          <button 
            onClick={() => onAddToCart(book, quantity)}
            disabled={book.stock_quantity <= 0}
            className="h-10 px-5 bg-indigo-600 text-white rounded-xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-800 shadow-lg shadow-indigo-500/20"
          >
            {book.stock_quantity > 0 ? (
              <>
                <i className="fa-solid fa-cart-plus"></i>
                <span>MUA NGAY</span>
              </>
            ) : 'HẾT HÀNG'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;