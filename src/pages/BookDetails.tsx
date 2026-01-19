
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
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 lg:pt-12 pb-20 relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <nav className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-premium text-slate-400">
              <Link to="/" className="hover:text-indigo-600 transition-all flex items-center gap-1">
                <i className="fa-solid fa-house text-xs"></i> Trang chủ
              </Link>
              <i className="fa-solid fa-chevron-right text-xs opacity-30"></i>
              <Link to={`/category/${book.category}`} className="hover:text-indigo-600 transition-all">
                {book.category}
              </Link>
            </nav>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter max-w-4xl">
              {book.title}
            </h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-6"
          >
            <div className="flex flex-col items-end">
              <div className="flex gap-1 text-amber-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fa-solid fa-star text-xs ${i < Math.floor(book.rating) ? '' : 'text-slate-200'}`}></i>
                ))}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-premium">Dựa trên {reviews.length} đánh giá</p>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
            <SocialShare title={book.title} />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT: Premium Visual Container */}
          <div className="lg:col-span-5 space-y-8">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white p-4 lg:p-6 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group"
             >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
                
                <div className="relative aspect-[3/4.2] rounded-[2.5rem] overflow-hidden bg-slate-50 flex items-center justify-center">
                   <motion.img 
                     whileHover={{ scale: 1.05 }}
                     transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                     src={book.cover} 
                     alt={book.title}
                     className="w-full h-full object-cover"
                   />
                   
                   {/* Badge Overlays */}
                   <div className="absolute top-6 left-6 flex flex-col gap-2">
                      {book.badge && (
                        <span className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg border border-white/20">
                          {book.badge}
                        </span>
                      )}
                      {book.stockQuantity <= 5 && book.stockQuantity > 0 && (
                        <span className="px-4 py-1.5 bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg border border-white/20">
                          Sắp hết hàng
                        </span>
                      )}
                   </div>

                   {/* Hover Lens Icon */}
                   <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center justify-center text-white text-xl">
                        <i className="fa-solid fa-magnifying-glass-plus"></i>
                      </div>
                   </div>
                </div>

                   {/* Quick Props Mirror */}
                <div className="grid grid-cols-3 gap-2 mt-8 px-1">
                   {[
                     { l: 'Định dạng', v: 'Bìa cứng', i: 'fa-book-bookmark', c: 'indigo' },
                     { l: 'Kích thước', v: '14x20.5cm', i: 'fa-ruler-combined', c: 'amber' },
                     { l: 'Trọng lượng', v: '450g', i: 'fa-weight-hanging', c: 'emerald' }
                   ].map((p, i) => (
                     <div key={i} className="text-center group/prop p-2 rounded-2xl hover:bg-slate-50 transition-all">
                        <div className={`w-9 h-9 mx-auto rounded-xl bg-slate-50 flex items-center justify-center mb-2 group-hover/prop:bg-white transition-colors border border-transparent group-hover/prop:border-slate-100`}>
                           <i className={`fa-solid ${p.i} text-slate-400 group-hover/prop:text-indigo-500 text-xs transition-colors`}></i>
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-tight mb-1">{p.l}</p>
                        <p className="text-xs font-bold text-slate-800 leading-tight">{p.v}</p>
                     </div>
                   ))}
                </div>
             </motion.div>

             {/* Description - Premium Upgrade */}
             <motion.div 
               layout
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-white p-8 lg:p-10 rounded-[3rem] shadow-sm border border-slate-200/60 flex flex-col relative overflow-hidden"
             >
                {/* Decorative Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none -mr-8 -mt-8">
                   <svg viewBox="0 0 100 100" fill="currentColor" className="text-slate-900">
                      <circle cx="50" cy="50" r="40" strokeWidth="1" stroke="currentColor" fill="none" />
                      <path d="M50 10 L50 90 M10 50 L90 50" strokeWidth="1" stroke="currentColor" />
                   </svg>
                </div>

                {/* Tab-like header */}
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tóm tắt tác phẩm</h3>
                   </div>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-100"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-100"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                   </div>
                </div>

                <motion.div 
                  layout
                  className="relative"
                  animate={{ height: showFullDescription ? 'auto' : '220px' }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="text-slate-600 text-xs lg:text-[14px] leading-relaxed font-medium whitespace-pre-line tracking-normal text-justify pr-1">
                    <span className="text-4xl font-serif text-indigo-600/20 float-left mr-2 -mt-2 leading-none">“</span>
                    {book.description}
                  </div>
                  {!showFullDescription && (
                    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/95 to-transparent z-10"></div>
                  )}
                </motion.div>
                
                <button 
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-6 w-full py-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-500 group relative z-20 shadow-sm hover:shadow-indigo-200"
                >
                  <span className="relative">
                    {showFullDescription ? 'Thu gọn nội dung' : 'Khám phá toàn bộ chi tiết'} 
                  </span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-white shadow-sm group-hover:bg-white/20 transition-colors`}>
                    <i className={`fa-solid fa-chevron-${showFullDescription ? 'up' : 'down'} text-xs transition-transform ${showFullDescription ? '' : 'animate-bounce'}`}></i>
                  </div>
                </button>
                
                {/* Footer Metadata in card */}
                {showFullDescription && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between"
                   >
                      <div className="flex items-center gap-2">
                         <i className="fa-solid fa-quote-right text-slate-100 text-2xl"></i>
                         <p className="text-xs font-bold text-slate-400 italic">Bản quyền nội dung thuộc về DigiBook</p>
                      </div>
                   </motion.div>
                )}
             </motion.div>

             {/* Author Segment - Relocated for Better Flow */}
             <div className="bg-white p-8 lg:p-10 rounded-[3rem] shadow-sm border border-slate-200/60 relative overflow-hidden flex flex-col">
                {/* Decorative Backgrounds */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-100/10 rounded-full blur-[100px] -ml-32 -mt-32"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-rose-50/20 rounded-full blur-[80px] -mr-24 -mb-24"></div>
                
                <div className="relative z-10 h-full flex flex-col">
                   <div className="flex items-center gap-3 mb-10">
                      <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tác giả sản phẩm</h3>
                   </div>

                   <div className="flex flex-col items-center text-center flex-grow w-full">
                      {/* Avatar with dynamic ring */}
                      <div className="relative mb-8 group shrink-0">
                         <div className="absolute -inset-3 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-[20px] group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all duration-700 animate-pulse"></div>
                         <div className="relative p-1 bg-white rounded-full shadow-2xl z-10">
                            <img 
                              src={authorInfo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.author)}&background=4f46e5&color=fff&bold=true&size=128`} 
                              className="w-28 h-28 rounded-full object-cover border-2 border-slate-50 transition-transform group-hover:scale-105 duration-700" 
                              alt={book.author} 
                            />
                         </div>
                         {/* Verified Badge */}
                         <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600 z-20 border-2 border-slate-50">
                            <i className="fa-solid fa-circle-check text-sm"></i>
                         </div>
                      </div>

                      {/* Author Name */}
                      <Link 
                        to={`/author/${book.author}`} 
                        className="text-2xl lg:text-3xl font-black text-slate-900 hover:text-indigo-600 transition-all mb-3 block leading-tight tracking-tighter px-4 overflow-hidden line-clamp-2"
                        title={book.author}
                      >
                        {book.author}
                      </Link>

                      {/* Category Badge */}
                      <div className="flex items-center justify-center w-full px-4 mb-8">
                         <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100 max-w-full group/badge transition-all hover:border-indigo-100">
                            <i className="fa-solid fa-award text-xs text-indigo-500/50 group-hover/badge:text-indigo-500 transition-colors"></i>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest truncate">
                               <span className="opacity-70">Chuyên gia</span> 
                               <span className="mx-1 text-slate-300">|</span>
                               <span className="text-indigo-600">{book.category}</span>
                            </p>
                         </div>
                      </div>
                      
                      <div className="relative max-w-[320px] w-full px-4">
                         <i className="fa-solid fa-quote-left absolute -top-4 -left-0 text-indigo-400/20 text-3xl"></i>
                         <p className="text-xs text-slate-500 font-bold leading-relaxed line-clamp-4 italic mb-10 relative z-10 text-center">
                            {book.authorBio || authorInfo?.bio || "Tác giả có nhiều đóng góp quan trọng trong lĩnh vực literary arts với những tác phẩm mang đậm phong cách cá nhân và giá trị nhân văn sâu sắc."}
                         </p>
                      </div>

                      <Link 
                        to={`/author/${book.author}`}
                        className="mt-auto w-fit px-8 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-[0.15em] border border-slate-200 shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-3 group whitespace-nowrap"
                      >
                         <span>Xem hồ sơ tác giả</span>
                         <i className="fa-solid fa-arrow-right-long group-hover:translate-x-1.5 transition-transform"></i>
                      </Link>
                   </div>
                </div>
             </div>
          </div>

          {/* RIGHT: Sophisticated Content Column */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Pricing & Core Actions Control */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-white p-8 lg:p-10 rounded-[3rem] shadow-sm border border-slate-200/60 relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                 <div className="flex-1">
                    <div className="flex flex-wrap items-end gap-3 mb-3">
                       <span className="text-5xl font-black text-rose-600 tracking-tighter leading-none">{formatPrice(book.price)}</span>
                       {book.originalPrice && (
                         <div className="flex flex-col mb-0.5">
                            <span className="text-sm font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg line-through leading-none mb-1 opacity-70 italic whitespace-nowrap">{formatPrice(book.originalPrice)}</span>
                            <span className="text-xs font-black text-rose-600 uppercase tracking-widest leading-none">- {Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)}% Giảm giá</span>
                         </div>
                       )}
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1.5 rounded-xl border border-emerald-100">
                       <i className="fa-solid fa-truck-fast text-xs"></i>
                       MIỄN PHÍ GIAO HÀNG
                    </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-1 p-1 bg-slate-100/50 border border-slate-200/50 rounded-2xl w-fit">
                       <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-500"><i className="fa-solid fa-minus text-xs"></i></button>
                       <span className="w-10 text-center font-black text-slate-900 text-sm">{quantity}</span>
                       <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm transition-all flex items-center justify-center text-slate-500"><i className="fa-solid fa-plus text-xs"></i></button>
                    </div>
                    {book.stockQuantity > 0 ? (
                       <p className="text-xs font-black text-slate-400 uppercase tracking-tight pl-1">Tình trạng: <span className="text-emerald-600">Còn {book.stockQuantity} cuốn</span></p>
                    ) : (
                       <p className="text-xs font-black text-rose-500 uppercase tracking-tight pl-1">Tình trạng: Hết hàng</p>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                 <button 
                   onClick={(e) => onAddToCart(book, quantity, { x: e.clientX, y: e.clientY })}
                   disabled={book.stockQuantity <= 0}
                   className="py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
                 >
                    <i className="fa-solid fa-cart-shopping text-sm group-hover:scale-110 transition-transform"></i>
                    Thêm vào giỏ hàng
                 </button>
                 <button 
                   onClick={handleToggleWishlist}
                   className={`py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 active:scale-95 ${
                     isWishlisted ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600'
                   }`}
                 >
                    <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`}></i>
                    {isWishlisted ? 'Đã yêu thích' : 'Lưu danh sách'}
                 </button>
              </div>
            </motion.div>

            {/* 2. Metadata Grid Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { l: 'Tác giả', v: book.author, i: 'fa-feather-pointed', color: 'bg-orange-50 text-orange-600' },
                 { l: 'Xuất bản', v: book.publishYear || 2024, i: 'fa-calendar-check', color: 'bg-blue-50 text-blue-600' },
                 { l: 'Số trang', v: book.pages, i: 'fa-file-invoice', color: 'bg-emerald-50 text-emerald-600' },
                 { l: 'Ngôn ngữ', v: book.language, i: 'fa-language', color: 'bg-purple-50 text-purple-600' }
               ].map((m, i) => (
                 <motion.div 
                   key={i}
                   whileHover={{ y: -5, shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                   className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col items-center text-center transition-all overflow-hidden"
                 >
                    <div className={`w-12 h-12 ${m.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm shrink-0`}>
                       <i className={`fa-solid ${m.i} text-base`}></i>
                    </div>
                    <div className="w-full">
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{m.l}</p>
                       <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug px-1 min-h-[40px] flex items-center justify-center">{m.v}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

            {/* 3. AI Intelligence Card */}
            <div className="bg-slate-900 p-8 lg:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-center border border-white/5">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>

                  <div className="relative z-10 flex flex-col h-full">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                           <i className="fa-solid fa-microchip text-white text-lg animate-pulse"></i>
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1.5">AI Analysis</h4>
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                             <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{activeModelName} active</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex-grow flex flex-col justify-center min-h-[160px] max-h-[250px] overflow-hidden">
                        {aiInsight ? (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 h-full overflow-y-auto custom-scrollbar"
                          >
                             <i className="fa-solid fa-quote-left text-2xl text-indigo-500/30 mb-4 block"></i>
                             <p className="text-xs text-indigo-50 font-medium leading-relaxed italic pr-2">
                               {aiInsight}
                             </p>
                          </motion.div>
                        ) : (
                          <div className="text-center py-4 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                             <p className="text-indigo-200/50 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8 px-6">
                               Sử dụng trí tuệ nhân tạo để phân tích sâu sắc về nội dung và giá trị văn học.
                             </p>
                             <button 
                               onClick={handleGetAIInsight}
                               disabled={loadingAI}
                               className="mx-auto w-[80%] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                             >
                               {loadingAI ? (
                                 <div className="flex items-center gap-3">
                                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                   <span>Đang phân tích...</span>
                                 </div>
                               ) : (
                                 <>
                                   <i className="fa-solid fa-sparkles"></i>
                                   <span>Bắt đầu phân tích</span>
                                 </>
                               )}
                             </button>
                          </div>
                        )}
                     </div>
                  </div>
               </div>

            {/* 4. Community & Reviews */}
            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 lg:p-12 flex flex-col bg-white">
                   <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Đánh giá thực tế</h3>
                     </div>
                     <div className="flex items-center gap-3 bg-amber-50 px-5 py-2.5 rounded-[1.5rem] border border-amber-100 shadow-sm shadow-amber-500/5">
                        <span className="text-3xl font-black text-amber-600 leading-none">{book.rating}</span>
                        <div className="flex flex-col">
                           <div className="flex gap-0.5 mb-0.5">
                              {[1,2,3,4,5].map(s => <i key={s} className={`fa-solid fa-star text-xs ${s <= Math.floor(book.rating) ? 'text-amber-500' : 'text-amber-200'}`}></i>)}
                           </div>
                           <p className="text-xs font-black text-amber-600/60 uppercase tracking-tighter leading-none">Điểm trung bình</p>
                        </div>
                     </div>
                   </div>
                   
                   <div className="space-y-6 flex-grow overflow-y-auto max-h-[400px] pr-4 custom-scrollbar mb-8 -mr-2">
                        {reviews.length > 0 ? (
                          reviews.map(r => (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.98 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              key={r.id} 
                              className="group bg-slate-50/50 p-5 rounded-[2rem] border border-slate-200/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden"
                            >
                              <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 shadow-sm flex items-center justify-center font-black text-sm flex-shrink-0 border border-slate-200/60 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-500">
                                  {r.userName.charAt(0)}
                                </div>
                                <div className="flex-grow pt-0.5">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                       <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{r.userName}</span>
                                       <div className="flex items-center gap-2 mt-0.5">
                                          <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${r.isPurchased ? 'text-emerald-600/70' : 'text-slate-400/70'}`}>
                                             <i className={`fa-solid ${r.isPurchased ? 'fa-circle-check' : 'fa-circle-info'} text-xs`}></i>
                                             {r.isPurchased ? 'Đã mua hàng' : 'Chưa mua hàng'}
                                          </span>
                                          <span className="text-xs text-slate-300">•</span>
                                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                             {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('vi-VN') : 'Vừa xong'}
                                          </span>
                                       </div>
                                    </div>
                                    <div className="flex gap-0.5 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                      {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-xs ${i < r.rating ? 'text-amber-400' : 'text-slate-100'}`}></i>)}
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-600 font-medium leading-relaxed italic pr-2 break-words">"{r.content}"</p>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center py-16 bg-slate-50/30 rounded-[3rem] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6 shadow-inner">
                               <i className="fa-solid fa-message-sparkles text-3xl"></i>
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center px-8">Chưa có đánh giá nào cho tác phẩm này. Hãy chia sẻ cảm nhận của bạn!</p>
                          </div>
                        )}
                      </div>

                      {/* Add Review Action Control */}
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/60">
                         <div className="flex items-center justify-between mb-4 px-2">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Viết nhận xét của bạn</p>
                            <div className="flex gap-2">
                               {[1,2,3,4,5].map(s => (
                                 <button key={s} onClick={() => setNewRating(s)} className={`text-sm transition-all hover:scale-125 ${s <= newRating ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'}`}>
                                   <i className="fa-solid fa-star"></i>
                                 </button>
                               ))}
                            </div>
                         </div>
                         <div className="flex gap-3">
                            <input 
                              type="text"
                              value={newComment} 
                              onChange={e => setNewComment(e.target.value)}
                              placeholder="Trải nghiệm của bạn với cuốn sách này..." 
                              className="flex-grow px-6 py-4 bg-white rounded-2xl outline-none focus:ring-4 ring-indigo-500/10 font-bold text-xs text-slate-700 transition-all border border-slate-200 focus:border-indigo-500 shadow-inner"
                            />
                            <button 
                              onClick={handleAddReview} 
                              className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                            >
                               Gửi
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
          </div>

        {/* 5. Suggestions Sections - Separated with clean headers */}
        {relatedBooks.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-100 relative">
            {/* Visual Anchor */}
            <div className="absolute top-[-2px] left-0 w-24 h-1 bg-indigo-600 rounded-full"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Gợi ý dành riêng cho bạn</h2>
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Văn học thuộc chuyên mục {book.category}</p>
                </div>
              </div>
              <Link to={`/category/${book.category}`} className="w-fit px-8 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center gap-3 group">
                Khám phá tất cả
                <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i>
              </Link>
            </div>
            
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8 }}
               viewport={{ once: true }}
               className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8"
            >
              {relatedBooks.map(b => (
                <BookCard key={b.id} book={b} onAddToCart={onAddToCart} onQuickView={onQuickView} />
              ))}
            </motion.div>
          </div>
        )}

        {/* Recently Viewed - Minimal Style */}
        {recentBooks.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-100">
            <div className="flex flex-col items-center text-center mb-10">
               <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <i className="fa-solid fa-history"></i>
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">Hành trình khám phá của bạn</h2>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiếp tục hành trình với những cuốn sách bạn đã quan tâm</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
              {recentBooks.map(b => (
                <BookCard key={b.id} book={b} onAddToCart={onAddToCart} onQuickView={onQuickView} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIXED BUY BAR: Glassmorphism Ultra Premium */}
      <AnimatePresence>
        {scrolled && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-8 left-1/2 z-[100] w-[95%] max-w-5xl"
          >
            <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-2.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] flex items-center gap-3 lg:gap-6 ring-1 ring-slate-900/5 relative overflow-hidden group">
              {/* Subtle Animated Background Glow */}
              <div className="absolute -inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent animate-pulse"></div>
              
              <div className="h-14 w-11 rounded-xl overflow-hidden shadow-md border border-white/50 ml-2 hidden sm:block flex-shrink-0">
                {!imageError && <img src={book.cover} className="w-full h-full object-cover" alt="" />}
              </div>
              
              <div className="flex-grow min-w-0 pr-4 pl-1">
                <div className="flex items-center gap-2 mb-0.5">
                   <p className="text-slate-900 font-extrabold text-sm lg:text-base leading-tight truncate">{book.title}</p>
                   {book.originalPrice && (
                     <span className="hidden lg:inline-flex px-1.5 py-0.5 bg-rose-500 text-white text-xs font-black rounded-md">
                        -{Math.round((1 - book.price / book.originalPrice) * 100)}%
                     </span>
                   )}
                </div>
                <div className="flex items-center gap-3">
                   <p className="text-rose-600 font-black text-xl tracking-tight">{formatPrice(book.price)}</p>
                   {book.originalPrice && <p className="text-slate-400 text-xs font-bold line-through opacity-40">{formatPrice(book.originalPrice)}</p>}
                </div>
              </div>
              
              <div className="flex items-center gap-3 pr-2">
                 {/* Quantity Selector - Refined */}
                 <div className="hidden md:flex items-center bg-slate-100/80 rounded-2xl p-1 border border-slate-200/50">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      className="w-10 h-10 rounded-xl hover:bg-white hover:text-indigo-600 transition-all text-slate-400 active:scale-90"
                    >
                      <i className="fa-solid fa-minus text-xs"></i>
                    </button>
                    <span className="w-8 text-center font-black text-slate-900 text-sm">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)} 
                      className="w-10 h-10 rounded-xl hover:bg-white hover:text-indigo-600 transition-all text-slate-400 active:scale-90"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                    </button>
                 </div>

                 {/* Buy Button */}
                 <button 
                   onClick={(e) => onAddToCart(book, quantity, { x: e.clientX, y: e.clientY })}
                   disabled={book.stockQuantity <= 0}
                   className="h-14 px-8 lg:px-14 bg-slate-900 text-white rounded-[1.8rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none whitespace-nowrap active:scale-95 group/btn"
                 >
                   {book.stockQuantity > 0 ? (
                     <>
                       <div className="relative">
                          <i className="fa-solid fa-cart-shopping text-sm group-hover/btn:scale-110 transition-transform"></i>
                          <span className="absolute -top-2 -right-2 w-2 h-2 bg-indigo-400 rounded-full animate-ping opacity-0 group-hover/btn:opacity-100"></span>
                       </div>
                       <span className="hidden sm:inline">THÊM VÀO GIỎ HÀNG</span>
                       <span className="sm:hidden text-micro">GIỎ HÀNG</span>
                     </>
                   ) : 'HẾT HÀNG'}
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
