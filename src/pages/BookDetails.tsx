
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import { useAuth } from '../AuthContext';
import { db, Review } from '../services/db';
import { AVAILABLE_AI_MODELS } from '../constants/ai-models';
import BookCard from '../components/BookCard';
import SEO from '../components/SEO';
import { BookDetailsSkeleton } from '../components/Skeleton';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Social Share Component
const SocialShare: React.FC<{ title: string }> = ({ title }) => {
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    import('react-hot-toast').then(({ toast }) => toast.success('Đã sao chép liên kết!'));
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <button onClick={copyLink} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all text-xs shadow-sm border border-slate-200" title="Sao chép liên kết">
        <i className="fa-solid fa-link"></i>
      </button>
      <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 hover:bg-[#1877F2] hover:text-white transition-all text-xs shadow-sm border border-slate-200">
        <i className="fa-brands fa-facebook-f"></i>
      </button>
      <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 hover:bg-[#1DA1F2] hover:text-white transition-all text-xs shadow-sm border border-slate-200">
        <i className="fa-brands fa-twitter"></i>
      </button>
    </div>
  );
};

const BookDetails: React.FC<{ 
  onAddToCart: (book: Book, quantity?: number, startPos?: { x: number, y: number }) => void, 
  onQuickView?: (book: Book) => void 
}> = ({ onAddToCart, onQuickView }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, user, setShowLoginModal } = useAuth();
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
        setLoading(true);
        setError(false);
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
          
          // Kiểm tra xem mỗi người review đã mua sách chưa
          const reviewsWithPurchaseInfo = await Promise.all(bookReviews.map(async (r) => {
            const isPurchased = await db.checkIfUserPurchasedBook(r.userId, id);
            return { ...r, isPurchased };
          }));
          
          setReviews(reviewsWithPurchaseInfo);
          
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
        } else {
          setError(true);
        }
        setLoading(false);
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
    
    // Refresh with purchase info
    const reviewsWithPurchaseInfo = await Promise.all(updatedReviews.map(async (r) => {
      const isPurchased = await db.checkIfUserPurchasedBook(r.userId, id!);
      return { ...r, isPurchased };
    }));
    setReviews(reviewsWithPurchaseInfo);
  };

  if (loading) return <BookDetailsSkeleton />;

  if (error || !book) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 text-center max-w-lg border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8 transform -rotate-6 shadow-lg shadow-rose-100/50 border border-rose-100">
            <i className="fa-solid fa-book-skull text-5xl"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Sách không tồn tại</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            Rất tiếc, cuốn sách bạn đang tìm kiếm đã ngừng kinh doanh hoặc không tồn tại trong hệ thống của DigiBook.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate(-1)}
              className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold uppercase tracking-premium text-xs hover:bg-slate-50 transition-all active:scale-95"
            >
              Quay lại
            </button>
            <Link 
              to="/category/Tất cả sách"
              className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-premium text-xs hover:bg-indigo-600 shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              Khám phá sách khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": book.title,
    "image": book.cover,
    "description": book.description,
    "isbn": book.isbn,
    "author": {
      "@type": "Person",
      "name": book.author
    },
    "offers": {
      "@type": "Offer",
      "price": book.price,
      "priceCurrency": "VND",
      "availability": "https://schema.org/InStock",
      "url": `https://tienxdun.github.io/DigiBook/#/book/${book.id}`
    },
    "aggregateRating": reviews.length > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1),
      "reviewCount": reviews.length
    } : undefined
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO 
        title={book.title}
        description={book.description.substring(0, 160) + '...'}
        image={book.cover}
        url={`/book/${book.id}`}
        type="book"
        author={book.author}
      />
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/30 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-50/50 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/4"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-4 lg:pt-6 pb-12 relative z-10">
        
        {/* Navigation & Header - Compacted */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200/50 pb-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-grow"
          >
            <nav className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-slate-400" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-indigo-600 transition-all flex items-center gap-1">
                TRANG CHỦ
              </Link>
              <i className="fa-solid fa-chevron-right text-[10px] opacity-30"></i>
              <Link to={`/category/${book.category}`} className="hover:text-indigo-600 transition-all">
                {book.category}
              </Link>
            </nav>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight uppercase">
              {book.title}
            </h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-2 px-3 rounded-xl border border-slate-200/50 shadow-sm"
          >
            <div className="flex flex-col items-end border-r border-slate-200 pr-3">
              <div className="flex gap-0.5 text-amber-400 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fa-solid fa-star text-[10px] ${i < Math.floor(book.rating) ? '' : 'text-slate-200'}`}></i>
                ))}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Phản hồi</p>
            </div>
            <div className="scale-90 origin-left">
               <SocialShare title={book.title} />
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT: Premium Visual Container - Optimized for density */}
          <aside className="lg:col-span-3 space-y-5">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white p-1.5 rounded-[1.5rem] shadow-lg shadow-slate-200/40 border border-slate-100 relative overflow-hidden group"
             >
                <div className="relative aspect-[3/4.2] rounded-[1.3rem] overflow-hidden bg-slate-50 flex items-center justify-center">
                   <motion.img 
                     whileHover={{ scale: 1.05 }}
                     transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                     src={book.cover} 
                     alt={book.title}
                     className="w-full h-full object-cover"
                   />
                   
                   {/* Badge Overlays - Tightened */}
                   <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {book.badge && (
                        <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-md flex items-center gap-1 w-fit">
                          <i className="fa-solid fa-crown text-[9px] text-yellow-200"></i>
                          {book.badge}
                        </span>
                      )}
                      {book.stockQuantity <= 5 && book.stockQuantity > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-md flex items-center gap-1 w-fit">
                           <i className="fa-solid fa-clock text-[9px]"></i>
                          Gần hết
                        </span>
                      )}
                   </div>
                </div>

                {/* Quick Props Mirror - Reduced Size */}
                <div className="grid grid-cols-3 gap-0.5 mt-1.5 p-0.5 border-t border-slate-50">
                   {[
                     { l: 'Bìa', v: 'Cứng', i: 'fa-book-bookmark' },
                     { l: 'Khổ', v: '14x20', i: 'fa-ruler' },
                     { l: 'Nặng', v: '450g', i: 'fa-weight' }
                   ].map((p, i) => (
                     <div key={i} className="text-center p-1 rounded-lg hover:bg-slate-50 transition-all">
                        <i className={`fa-solid ${p.i} text-slate-300 text-[10px] mb-0.5`}></i>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-0">{p.l}</p>
                        <p className="text-xs font-extrabold text-slate-800 leading-tight">{p.v}</p>
                     </div>
                   ))}
                </div>
             </motion.div>

             {/* 1. Description Dashboard - High Symmetry */}
             <section 
               className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 transition-all"
             >
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1 h-3.5 bg-slate-900 rounded-full"></div>
                   <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Giới thiệu sách</h3>
                </div>

                <motion.div 
                  layout
                  className="relative"
                  animate={{ height: showFullDescription ? 'auto' : '80px' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="text-slate-600 text-xs leading-relaxed font-medium whitespace-pre-line text-justify italic">
                    {book.description}
                  </div>
                  {!showFullDescription && (
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white via-white/80 to-transparent z-10"></div>
                  )}
                </motion.div>
                
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-3 w-full py-2 rounded-xl bg-slate-50 text-xs font-black text-slate-500 uppercase tracking-widest border border-slate-200/50 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{showFullDescription ? 'Thu gọn' : 'Chi tiết nội dung'}</span>
                  <i className={`fa-solid fa-chevron-${showFullDescription ? 'up' : 'down'} text-[9px]`}></i>
                </button>
             </section>

             {/* Author Segment - Refined & Compact */}
             <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="flex items-center gap-3">
                   <div className="relative shrink-0">
                      <img 
                        src={authorInfo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.author)}&background=4f46e5&color=fff&bold=true&size=48`} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-50 shadow-sm" 
                        alt={book.author} 
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full shadow flex items-center justify-center text-indigo-600 border border-slate-50">
                         <i className="fa-solid fa-check text-[8px]"></i>
                      </div>
                   </div>
                   <div className="flex-grow min-w-0">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0">Tác giả chính</div>
                      <Link 
                        to={`/author/${book.author}`} 
                        className="text-xs font-black text-slate-900 hover:text-indigo-600 transition-all truncate block"
                      >
                        {book.author}
                      </Link>
                   </div>
                </div>
             </div>
          </aside>

          {/* RIGHT: Sophisticated Content Column - 9 Cols */}
          <article className="lg:col-span-9 space-y-5">
            
            {/* 1. Integrated Action Dashboard - High Symmetry & Balance */}
            <section 
               className="bg-white p-4 lg:p-5 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                 {/* Left Side: Pricing & Status */}
                 <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="flex flex-col">
                       <div className="flex items-baseline gap-2">
                          <span className="text-3xl lg:text-4xl font-black text-rose-600 tracking-tighter">{formatPrice(book.price)}</span>
                          {book.originalPrice > book.price && (
                            <span className="text-xs font-black text-rose-600 uppercase tracking-widest px-1.5 py-0.5 bg-rose-50 rounded-md">-{Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}%</span>
                          )}
                       </div>
                       {book.originalPrice > book.price && (
                         <span className="text-sm font-bold text-slate-400 line-through opacity-70 italic leading-none mt-1">{formatPrice(book.originalPrice)}</span>
                       )}
                    </div>
                    
                    <div className="h-10 w-px bg-slate-100 hidden md:block"></div>

                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-50 w-fit px-2 py-1 rounded-lg border border-emerald-100">
                          <i className="fa-solid fa-check-circle text-[10px]"></i>
                          Sẵn hàng
                       </div>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Kho: <span className="text-emerald-600 font-bold">{book.stockQuantity}</span></p>
                    </div>
                 </div>

                 {/* Right Side: Interactive Controls */}
                 <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                       <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-500"><i className="fa-solid fa-minus text-[10px]"></i></button>
                       <span className="w-5 text-center font-black text-slate-900 text-xs">{quantity}</span>
                       <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-500"><i className="fa-solid fa-plus text-[10px]"></i></button>
                    </div>
                    
                    <button 
                      onClick={(e) => onAddToCart(book, quantity, { x: e.clientX, y: e.clientY })}
                      disabled={book.stockQuantity <= 0}
                      className="md:w-[160px] flex-grow md:flex-none h-11 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 active:scale-[0.98] disabled:bg-slate-200 flex items-center justify-center gap-2"
                    >
                       <i className="fa-solid fa-cart-shopping text-sm"></i>
                       Mua ngay
                    </button>

                    <button 
                      onClick={handleToggleWishlist}
                      className={`shrink-0 h-11 w-11 rounded-xl font-black transition-all flex items-center justify-center border-2 active:scale-95 ${
                        isWishlisted ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600'
                      }`}
                      aria-label={isWishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                    >
                       <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
                    </button>
                 </div>
              </div>
            </section>

            {/* 2. Metadata Grid Dashboard - Compact icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {[
                 { l: 'Tác giả', v: book.author, i: 'fa-feather-pointed', color: 'bg-orange-50 text-orange-600' },
                 { l: 'Xuất bản', v: book.publishYear || 2024, i: 'fa-calendar-check', color: 'bg-blue-50 text-blue-600' },
                 { l: 'Số trang', v: book.pages, i: 'fa-file-lines', color: 'bg-emerald-50 text-emerald-600' },
                 { l: 'Ngôn ngữ', v: book.language, i: 'fa-globe', color: 'bg-purple-50 text-purple-600' }
               ].map((m, i) => (
                 <motion.div 
                   key={i}
                   whileHover={{ y: -3 }}
                   className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center text-center transition-all"
                 >
                    <div className={`w-8 h-8 ${m.color} rounded-lg flex items-center justify-center mb-1.5 shadow-sm`}>
                       <i className={`fa-solid ${m.i} text-xs`}></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0">{m.l}</p>
                    <p className="text-xs font-black text-slate-800 truncate w-full px-1">{m.v}</p>
                 </motion.div>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 3. AI Intelligence Card - Integrated better */}
              <div className="bg-slate-900 px-5 py-5 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col border border-white/5">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-[60px] -mr-12 -mt-12"></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                     <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                           <i className="fa-solid fa-sparkles text-white text-xs"></i>
                        </div>
                        <div>
                           <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-0.5">AI INSIGHTS</h4>
                           <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">{activeModelName}</span>
                        </div>
                     </div>

                     <div className="flex-grow flex flex-col justify-center min-h-[120px]">
                        {aiInsight ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 h-full overflow-y-auto custom-scrollbar"
                          >
                             <p className="text-xs text-indigo-50 font-medium leading-relaxed italic">
                               "{aiInsight}"
                             </p>
                          </motion.div>
                        ) : (
                          <div className="text-center py-2">
                             <p className="text-indigo-200/50 text-[10px] font-black uppercase tracking-widest leading-relaxed mb-3 px-2">
                               Phân tích nội dung bằng AI
                             </p>
                             <button 
                               onClick={handleGetAIInsight}
                               disabled={loadingAI}
                               className="mx-auto w-full py-2 bg-white/10 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all border border-white/10"
                             >
                               {loadingAI ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
                             </button>
                          </div>
                        )}
                     </div>
                  </div>
              </div>

              {/* 4. Community & Reviews - Integrated better */}
              <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-0.5 h-4 bg-amber-400 rounded-full"></div>
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Đánh giá</h3>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                        <span className="text-lg font-black text-amber-600 leading-none">{book.rating}</span>
                        <div className="flex gap-0.5">
                           {[1,2,3,4,5].map(s => <i key={s} className={`fa-solid fa-star text-[9px] ${s <= Math.floor(book.rating) ? 'text-amber-500' : 'text-amber-200'}`}></i>)}
                        </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 flex-grow overflow-y-auto max-h-[140px] pr-1 custom-scrollbar mb-3">
                        {reviews.length > 0 ? (
                          reviews.slice(0, 2).map(r => (
                            <div key={r.id} className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                               <div className="flex justify-between items-start mb-0.5">
                                  <span className="text-xs font-black text-slate-900 uppercase truncate max-w-[80px]">{r.userName}</span>
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[8px] ${i < r.rating ? 'text-amber-400' : 'text-slate-200'}`}></i>)}
                                  </div>
                               </div>
                               <p className="text-xs text-slate-600 line-clamp-2 leading-tight italic">"{r.content}"</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-2">Chưa có đánh giá</p>
                        )}
                  </div>
                  <button className="w-full py-2 bg-slate-50 text-xs font-black text-slate-600 uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white transition-all">
                      Xem tất cả
                  </button>
              </div>
            </div>
          </article>
        </div>

        {/* 5. Add Review - Compact horizontal version */}
        <section className="mt-6 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
           <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <i className="fa-solid fa-pen-nib text-sm"></i>
              </div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Viết đánh giá của bạn</p>
           </div>
           
           <div className="flex items-center gap-1 shrink-0 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setNewRating(s)} className={`text-base transition-all hover:scale-125 ${s <= newRating ? 'text-amber-400' : 'text-slate-200'}`}>
                  <i className="fa-solid fa-star"></i>
                </button>
              ))}
           </div>

           <div className="flex-grow flex gap-2 w-full">
              <input 
                type="text"
                value={newComment} 
                onChange={e => setNewComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..." 
                className="flex-grow px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 font-medium text-sm text-slate-700 transition-all border border-slate-200"
              />
              <button 
                onClick={handleAddReview} 
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 whitespace-nowrap"
              >
                 Gửi nhận xét
              </button>
           </div>
        </section>

        {/* 6. Suggestions Sections - Optimized grid gaps */}
        {relatedBooks.length > 0 && (
          <section className="mt-12 pt-8 border-t border-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Sách cùng thể loại</h2>
                <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Gợi ý riêng cho bạn</p>
              </div>
              <Link to={`/category/${book.category}`} className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-all flex items-center gap-2">
                Xem tất cả <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {relatedBooks.map(b => (
                <BookCard key={b.id} book={b} onAddToCart={onAddToCart} onQuickView={onQuickView} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed - Very Compact */}
        {recentBooks.length > 0 && (
          <section className="mt-12 pt-8 border-t border-slate-200/50" aria-label="Sách đã xem">
            <div className="flex items-center justify-center gap-3 mb-6">
               <div className="h-px bg-slate-200 flex-grow"></div>
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap px-4">Sách bạn vừa xem</h2>
               <div className="h-px bg-slate-200 flex-grow"></div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4">
              {recentBooks.map(b => (
                <div key={b.id} className="scale-90 origin-top opacity-80 hover:scale-100 hover:opacity-100 transition-all">
                  <BookCard book={b} onAddToCart={onAddToCart} onQuickView={onQuickView} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* FIXED BUY BAR: Glassmorphism Ultra Premium - Reduced Height */}
      <AnimatePresence>
        {(scrolled || window.innerWidth < 1024) && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: window.innerWidth < 1024 ? 0 : '-50%' }}
            animate={{ y: 0, opacity: 1, x: window.innerWidth < 1024 ? 0 : '-50%' }}
            exit={{ y: 100, opacity: 0, x: window.innerWidth < 1024 ? 0 : '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed left-0 lg:left-1/2 z-[100] w-full lg:w-[95%] lg:max-w-4xl transition-all duration-300 ${scrolled ? 'bottom-0 lg:bottom-4' : 'bottom-0 lg:-bottom-20'}`}
          >
            <div className={`bg-white/95 backdrop-blur-2xl border-t lg:border border-slate-200/50 lg:rounded-2xl p-2 lg:p-1.5 lg:pr-2 shadow-2xl flex items-center gap-3 relative overflow-hidden pb-safe-bottom`}>
              <div className="h-10 w-7.5 rounded-md overflow-hidden shadow-sm border border-white/60 ml-1 hidden sm:block flex-shrink-0">
                <img src={book.cover} className="w-full h-full object-cover" alt="" />
              </div>
              
              <div className="flex-grow min-w-0">
                <p className="text-slate-900 font-black text-xs leading-none truncate tracking-tight uppercase mb-0.5">{book.title}</p>
                <div className="flex items-center gap-2">
                    <p className="text-rose-600 font-black text-base tracking-tighter leading-none">{formatPrice(book.price)}</p>
                    {book.originalPrice && book.originalPrice > book.price && (
                      <p className="text-slate-400 text-[10px] font-bold line-through opacity-50 leading-none">{formatPrice(book.originalPrice)}</p>
                    )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                    <button 
                      onClick={handleToggleWishlist}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all border border-slate-200 ${
                        isWishlisted ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white text-slate-400'
                      }`}
                      aria-label={isWishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                    >
                      <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-xs`}></i>
                    </button>

                    <button 
                      onClick={(e) => onAddToCart(book, quantity, { x: e.clientX, y: e.clientY })}
                      disabled={book.stockQuantity <= 0}
                      className="h-9 px-4 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 active:scale-[0.97] whitespace-nowrap shadow-sm shadow-indigo-100"
                    >
                      <i className="fa-solid fa-cart-shopping text-xs"></i>
                      <span>{book.stockQuantity > 0 ? (window.innerWidth < 640 ? 'Mua' : 'Thêm giỏ hàng') : 'Hết hàng'}</span>
                    </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BookDetails;
