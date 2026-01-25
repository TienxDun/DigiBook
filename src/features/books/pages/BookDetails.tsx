import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBooks, QuickBuyBar } from '@/features/books';
import BookCard from '../components/BookCard/index';
import { useCart } from '@/features/cart';
import { useAuth } from '@/features/auth';
import { db } from '@/services/db';
import { Book, Review } from '@/shared/types';
import { SEO, BookDetailsSkeleton } from '@/shared/components';
import toast from '@/shared/utils/toast';


const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Social Share Component
const SocialShare: React.FC<{ title: string }> = ({ title }) => {
  const copyLink = async () => {
    const url = window.location.href;

    // Check if Clipboard API is supported
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Đã sao chép liên kết!');
        return;
      } catch (err) {
        console.error('Clipboard API failed, trying fallback...');
      }
    }

    // Fallback using legacy execCommand
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;

      // Ensure textarea is not visible but part of DOM
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        toast.success('Đã sao chép liên kết!');
      } else {
        toast.error('Không thể sao chép liên kết trên trình duyệt này');
      }
    } catch (err) {
      console.error('Copy failed', err);
      toast.error('Có lỗi xảy ra khi sao chép');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={copyLink} className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-200 active:scale-90" title="Sao chép liên kết">
        <i className="fa-solid fa-link text-sm"></i>
      </button>
      <button className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-slate-500 hover:bg-[#1877F2] hover:text-white transition-all shadow-sm border border-slate-200 active:scale-90">
        <i className="fa-brands fa-facebook-f text-sm"></i>
      </button>
      <button className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-slate-500 hover:bg-[#1DA1F2] hover:text-white transition-all shadow-sm border border-slate-200 active:scale-90">
        <i className="fa-brands fa-twitter text-sm"></i>
      </button>
    </div>
  );
};

const BookDetails: React.FC<{ onQuickView?: (book: Book) => void }> = ({ onQuickView }) => {
  const { addToCart } = useCart();
  const { setViewingBook } = useBooks();

  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, user, setShowLoginModal } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [authorInfo, setAuthorInfo] = useState<{ id: string, name: string, bio: string, avatar: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);

  const [imageError, setImageError] = useState(false);

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  // Image Gallery State
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false); // Lightbox state



  useEffect(() => {
    const fetchData = async () => {
      if (slug) {
        setLoading(true);
        setError(false);
        // Fetch model config

        // Try fetch by slug first
        let foundBook = await db.getBookBySlug(slug);

        // Fallback: Try fetch by ID if slug not found (for legacy links or if slug matches ID)
        if (!foundBook) {
          foundBook = await db.getBookById(slug);
        }

        if (foundBook) {
          const bookData = foundBook; // Ensure typing
          setBook(bookData);
          setViewingBook(bookData);

          // Increment view count (fire and forget)
          db.incrementBookView(bookData.id);

          // Fetch author info
          db.getAuthors().then(authors => {
            const info = authors.find(a => a.name.toLowerCase() === bookData.author.toLowerCase());
            if (info) setAuthorInfo(info as any);
          });

          const bookReviews = await db.getReviewsByBookId(bookData.id);

          // Kiểm tra xem mỗi người review đã mua sách chưa
          const reviewsWithPurchaseInfo = await Promise.all(bookReviews.map(async (r) => {
            const isPurchased = await db.checkIfUserPurchasedBook(r.userId, bookData.id);
            return { ...r, isPurchased };
          }));

          setReviews(reviewsWithPurchaseInfo);

          // Gợi ý sách liên quan - Tăng lên 5 cuốn để lấp đầy grid
          const related = await db.getRelatedBooks(bookData.category, bookData.id, bookData.author, 5);
          setRelatedBooks(related);

          // Fetch sách cùng tác giả
          const byAuthor = await db.getBooksByAuthor(bookData.author, bookData.id, 5);
          setAuthorBooks(byAuthor);

          // Update recent books in localStorage
          const stored = localStorage.getItem('digibook_recent');
          let recent: Book[] = stored ? JSON.parse(stored) : [];
          // Lưu 10 cuốn gần nhất để khi filter cuốn hiện tại vẫn còn đủ hiển thị
          recent = [bookData, ...recent.filter(b => b.id !== bookData.id)].slice(0, 10);
          localStorage.setItem('digibook_recent', JSON.stringify(recent));
          // Hiển thị 5 cuốn khác để lấp đầy grid xl:grid-cols-5
          setRecentBooks(recent.filter(b => b.id !== bookData.id).slice(0, 5));
        } else {
          setError(true);
        }
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
    return () => {
      setViewingBook(null);
    };
  }, [slug, setViewingBook]);

  // Initialize active image when book loads
  useEffect(() => {
    if (book?.cover) {
      setActiveImage(book.cover);
    }
  }, [book]);

  // Derived Gallery Images
  const galleryImages = useMemo(() => {
    if (!book) return [];
    const imgs = book.images && book.images.length > 0 ? book.images : [];
    const all = [book.cover, ...imgs].filter(Boolean);
    return Array.from(new Set(all));
  }, [book]);

  // Auto-rotate Effect
  useEffect(() => {
    if (!book || galleryImages.length <= 1 || isHoveringImage) return;

    const interval = setInterval(() => {
      setActiveImage(current => {
        const currentIndex = galleryImages.indexOf(current || '');
        const nextIndex = (currentIndex + 1) % galleryImages.length;
        return galleryImages[nextIndex];
      });
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, [book, galleryImages, isHoveringImage]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (showLightbox) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLightbox]);

  const isWishlisted = useMemo(() => wishlist.some(b => b.id === book?.id), [wishlist, book]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setShowLoginModal(true); return; }
    if (!newComment.trim()) return;
    if (!book) return;

    await db.addReview({
      bookId: book.id,
      userId: user.id,
      userName: user.name,
      rating: newRating,
      content: newComment
    });
    setNewComment('');
    const updatedReviews = await db.getReviewsByBookId(book.id);

    // Refresh with purchase info
    const reviewsWithPurchaseInfo = await Promise.all(updatedReviews.map(async (r) => {
      const isPurchased = await db.checkIfUserPurchasedBook(r.userId, book.id);
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

  const handleToggleWishlist = async () => {
    if (book) {
      setIsTogglingWishlist(true);
      await toggleWishlist(book);
      setIsTogglingWishlist(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    if (!book) return;
    setIsAddingToCart(true);
    await addToCart(book, quantity, { x: e.clientX, y: e.clientY });
    setIsAddingToCart(false);
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
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
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
              <i className="fa-solid fa-chevron-right text-xs opacity-30"></i>
              <Link to={`/category/${book.category}`} className="hover:text-indigo-600 transition-all">
                {book.category}
              </Link>
            </nav>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight uppercase">
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
                  <i key={i} className={`fa-solid fa-star text-xs ${i < Math.floor(book.rating) ? '' : 'text-slate-200'}`}></i>
                ))}
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Phản hồi</p>
            </div>
            <div className="scale-90 origin-left">
              <SocialShare title={book.title} />
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT: Premium Visual Container - Optimized for density & Sticky */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-5 z-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group mx-auto w-full max-w-[400px] lg:max-w-none"
              onMouseEnter={() => setIsHoveringImage(true)}
              onMouseLeave={() => setIsHoveringImage(false)}
            >
              <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-slate-50 flex items-center justify-center cursor-zoom-in">
                {/* Main Image View */}
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  src={activeImage || book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onClick={() => setShowLightbox(true)}
                />

                {/* Navigation Arrows (visible on hover) */}

                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currIdx = galleryImages.indexOf(activeImage || '');
                        const prevIdx = (currIdx - 1 + galleryImages.length) % galleryImages.length;
                        setActiveImage(galleryImages[prevIdx]);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <i className="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currIdx = galleryImages.indexOf(activeImage || '');
                        const nextIdx = (currIdx + 1) % galleryImages.length;
                        setActiveImage(galleryImages[nextIdx]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                  </>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  {(() => {
                    if (book.stockQuantity <= 5 && book.stockQuantity > 0) {
                      return (
                        <span className="px-3 py-1.5 bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-1.5 border border-amber-400/30 backdrop-blur-md">
                          <i className="fa-solid fa-stopwatch"></i>
                          Gần hết
                        </span>
                      );
                    }
                    if (book.badge && !book.badges?.some(b => b.text?.includes('%'))) {
                      return (
                        <span className="px-3 py-1.5 bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-1.5 border border-rose-400/30 backdrop-blur-md">
                          <i className="fa-solid fa-crown text-yellow-200"></i>
                          {book.badge}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2 mt-2 px-1">
                  {galleryImages.slice(0, 5).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${activeImage === img ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent hover:border-indigo-200'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Props Mirror - Enhanced Font Size */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                {[
                  { l: 'Nhà xuất bản', v: book.manufacturer || book.publisher || 'N/A', i: 'fa-building-columns' },
                  { l: 'Năm xuất bản', v: book.publishYear || '2024', i: 'fa-calendar' },
                  { l: 'Loại bìa', v: book.bookLayout || 'Mềm', i: 'fa-book-open' }
                ].map((p, i) => (
                  <div key={i} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-indigo-50/50 hover:border-indigo-100 transition-all group/item">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-2 text-indigo-500 group-hover/item:scale-110 transition-transform">
                      <i className={`fa-solid ${p.i} text-xs`}></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{p.l}</p>
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate px-1">{p.v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </aside>


          {/* RIGHT: Sophisticated Content Column - Adjusted Grid */}
          <article className="lg:col-span-8 space-y-5">

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
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-50 w-fit px-2 py-1 rounded-lg border border-emerald-100 whitespace-nowrap">
                      <i className="fa-solid fa-check-circle text-xs"></i>
                      Sẵn hàng
                    </div>
                    {book.quantitySold && (
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                        {book.quantitySold.text}
                      </p>
                    )}
                    {!book.quantitySold && (
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Kho: <span className="text-emerald-600 font-bold">{book.stockQuantity}</span></p>
                    )}
                  </div>
                </div>

                {/* Right Side: Interactive Controls */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 shadow-sm transition-all flex items-center justify-center text-slate-500 active:scale-90"
                    >
                      <i className="fa-solid fa-minus text-sm"></i>
                    </button>
                    <span className="w-8 text-center font-black text-slate-900 text-base">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 shadow-sm transition-all flex items-center justify-center text-slate-500 active:scale-90"
                    >
                      <i className="fa-solid fa-plus text-sm"></i>
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={book.stockQuantity <= 0 || isAddingToCart}
                    className="md:w-[160px] flex-grow md:flex-none h-12 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 active:scale-[0.98] disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isAddingToCart ? (
                      <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                    ) : (
                      <i className="fa-solid fa-cart-shopping text-sm"></i>
                    )}
                    {isAddingToCart ? 'Đang thêm...' : 'Mua ngay'}
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleWishlist}
                    className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-all ${isWishlisted ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-100 text-slate-400 hover:border-rose-100 hover:text-rose-500'
                      }`}
                    disabled={isTogglingWishlist}
                    aria-label={isWishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                  >
                    {isTogglingWishlist ? (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-5 h-5 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin"
                      />
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.i
                          key={isWishlisted ? 'solid' : 'regular'}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.2, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-lg`}
                        ></motion.i>
                      </AnimatePresence>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Trust Badges - Enhanced for conversion */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                {[
                  { l: 'Chính hãng 100%', i: 'fa-certificate', c: 'text-blue-500' },
                  { l: 'Đổi trả 15 ngày', i: 'fa-rotate-left', c: 'text-indigo-500' },
                  { l: 'Giao hàng nhanh', i: 'fa-truck-fast', c: 'text-emerald-500' },
                  { l: 'Kiểm hàng khi nhận', i: 'fa-box-open', c: 'text-amber-500' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2">
                    <i className={`fa-solid ${item.i} ${item.c} text-sm`}></i>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.l}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Metadata Grid Dashboard - Compact icons (Replaced with Badges) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                // 1. Authentic Badge
                ...(book.badges?.some(b => b.code === 'authentic_brand' || b.code === 'digibook_guarantee') ? [{
                  l: 'Cam kết',
                  v: 'Đảm bảo DigiBook',
                  i: 'fa-certificate',
                  color: 'bg-indigo-50 text-indigo-600'
                }] : []),

                // 2. TikiNow Badge (Rebranded)
                ...(book.badges?.some(b => b.code === 'tikinow' || b.code === 'digibook_express') ? [{
                  l: 'Giao hàng',
                  v: 'DigiBook Now',
                  i: 'fa-bolt',
                  color: 'bg-blue-50 text-blue-600'
                }] : []),

                // 3. Discount/Hot Badge
                ...(book.badge && !book.badges?.some(b => b.text?.includes('%')) ? [{
                  l: 'Ưu đãi',
                  v: book.badge,
                  i: 'fa-crown',
                  color: 'bg-rose-50 text-rose-600'
                }] : []),

                // 4. Stock Warning (if low)
                ...(book.stockQuantity <= 5 && book.stockQuantity > 0 ? [{
                  l: 'Tình trạng',
                  v: 'Sắp hết hàng',
                  i: 'fa-stopwatch',
                  color: 'bg-amber-50 text-amber-600'
                }] : []),

                // Fallbacks if no badges (Fill with standard info to keep grid populated)
                { l: 'Nhà xuất bản', v: book.publisher || 'N/A', i: 'fa-house-chimney', color: 'bg-slate-50 text-slate-500' },
                { l: 'Số trang', v: book.pages > 0 ? `${book.pages} trang` : 'N/A', i: 'fa-file-lines', color: 'bg-slate-50 text-slate-500' },
                { l: 'Ngôn ngữ', v: book.language || 'Tiếng Việt', i: 'fa-globe', color: 'bg-slate-50 text-slate-500' }

              ].slice(0, 4).map((m, i) => ( // Keep only first 4 items to maintain layout integrity
                <motion.div
                  key={i}
                  whileHover={{ y: -3 }}
                  className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center text-center transition-all"
                >
                  <div className={`w-8 h-8 ${m.color} rounded-lg flex items-center justify-center mb-1.5 shadow-sm`}>
                    <i className={`fa-solid ${m.i} text-xs`}></i>
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0">{m.l}</p>
                  <p className="text-sm font-black text-slate-800 truncate w-full px-1">{m.v}</p>
                </motion.div>
              ))}
            </div>

            {/* NEW LOCATION: Author Segment - now in Main Col */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={authorInfo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(book.author)}&background=4f46e5&color=fff&bold=true&size=48`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-50 shadow-sm"
                    alt={book.author}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center text-indigo-600 border border-slate-50">
                    <i className="fa-solid fa-check text-[10px]"></i>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tác giả chính</div>
                  <Link
                    to={`/author/${book.author}`}
                    className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-all truncate block"
                  >
                    {book.author}
                  </Link>
                </div>
              </div>
              <Link
                to={`/author/${book.author}`}
                className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all whitespace-nowrap"
              >
                Xem hồ sơ
              </Link>
            </div>

            {/* NEW LOCATION: Description Dashboard - now in Main Col */}
            <section
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 transition-all"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-slate-900 rounded-full"></div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Giới thiệu sách</h3>
              </div>

              <motion.div
                layout
                className="relative"
                animate={{ height: showFullDescription ? 'auto' : '100px' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="text-slate-600 text-[15px] leading-relaxed font-medium whitespace-pre-line text-justify">
                  {book.description}
                </div>
                {!showFullDescription && (
                  <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white via-white/80 to-transparent z-10"></div>
                )}
              </motion.div>

              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-4 flex items-center gap-2 text-slate-900 font-bold hover:text-indigo-600 transition-all text-xs uppercase tracking-widest"
              >
                <span>{showFullDescription ? 'Thu gọn' : 'Đọc đầy đủ nội dung'}</span>
                <i className={`fa-solid fa-chevron-${showFullDescription ? 'up' : 'down'} text-[9px]`}></i>
              </button>
            </section>

            {/* Detailed Specifications Table (New) */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Thông tin chi tiết</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[
                  { l: 'Công ty phát hành', v: book.publisher },
                  { l: 'Nhà xuất bản', v: book.manufacturer },
                  { l: 'Kích thước', v: book.dimensions },
                  { l: 'Dịch giả', v: book.translator },
                  { l: 'Loại bìa', v: book.bookLayout },
                  { l: 'Số trang', v: book.pages > 0 ? `${book.pages}` : null },
                  { l: 'Ngày xuất bản', v: book.publishYear > 0 ? `${book.publishYear}` : null },
                  { l: 'SKU / ISBN', v: book.isbn }
                ].filter(item => item.v).map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-slate-50 last:border-0 md:last:border-b">
                    <span className="text-slate-500 font-medium">{item.l}</span>
                    <span className="font-bold text-slate-900 text-right">{item.v}</span>
                  </div>
                ))}
              </div>
            </section>


          </article>
        </div>

        {/* 5. Reviews & Community - Full Width Section */}
        <section className="mt-8 bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-amber-400 rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Đánh giá từ cộng đồng</h3>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
              <span className="text-2xl font-black text-amber-500 leading-none">{book.rating}</span>
              <div className="flex flex-col items-start leading-none">
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map(s => <i key={s} className={`fa-solid fa-star text-[10px] ${s <= Math.floor(book.rating) ? 'text-amber-500' : 'text-amber-200'}`}></i>)}
                </div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{reviews.length} đánh giá</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {reviews.length > 0 ? (
              reviews.slice(0, 6).map(r => (
                <div key={r.id} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all hover:shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                        <i className="fa-solid fa-user text-xs"></i>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-wide">{r.userName}</p>
                        {r.isPurchased && (
                          <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                            <i className="fa-solid fa-circle-check"></i> Đã mua
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => <i key={i} className={`fa-solid fa-star text-[10px] ${i < r.rating ? 'text-amber-400' : 'text-slate-200'}`}></i>)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-3">"{r.content}"</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 text-right">
                    {r.createdAt?.seconds
                      ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('vi-VN')
                      : new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-2">
                  <i className="fa-regular fa-comment-dots text-xl"></i>
                </div>
                <p className="text-sm font-bold text-slate-500">Chưa có đánh giá nào</p>
                <p className="text-xs text-slate-400 mt-1">Hãy là người đầu tiên chia sẻ cảm nhận về cuốn sách này!</p>
              </div>
            )}
          </div>

          {reviews.length > 6 && (
            <div className="text-center">
              <button className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                Xem tất cả đánh giá
              </button>
            </div>
          )}
        </section>

        {/* 6. Add Review Form */}
        <section className="mt-6 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center md:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <i className="fa-solid fa-pen-nib text-sm"></i>
            </div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Viết đánh giá của bạn</p>
          </div>

          <div className="flex items-center gap-1 shrink-0 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-full md:w-auto justify-center">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setNewRating(s)} className={`text-base transition-all hover:scale-125 ${s <= newRating ? 'text-amber-400' : 'text-slate-200'}`}>
                <i className="fa-solid fa-star"></i>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
              disabled={loading}
              className="flex-grow px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 font-medium text-sm text-slate-700 transition-all border border-slate-200 min-w-0 disabled:opacity-70"
            />
            <button
              onClick={handleAddReview}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Đang gửi...
                </>
              ) : (
                'Gửi nhận xét'
              )}
            </button>
          </div>
        </section>

        {/* 6. Suggestions Sections - Optimized grid gaps */}
        {
          authorBooks.length > 0 && (
            <section className="mt-12 pt-8 border-t border-slate-200/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Sách cùng tác giả</h2>
                  <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Từ {book.author}</p>
                </div>
                <Link to={`/author/${book.author}`} className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-all flex items-center gap-2">
                  Xem tất cả của tác giả <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {authorBooks.map(b => (
                  <BookCard key={b.id} book={b} onAddToCart={addToCart} onQuickView={onQuickView} />
                ))}
              </div>
            </section>
          )
        }

        {
          relatedBooks.length > 0 && (
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
                  <BookCard key={b.id} book={b} onAddToCart={addToCart} onQuickView={onQuickView} />
                ))}
              </div>
            </section>
          )
        }

        {/* Recently Viewed - Very Compact */}
        {
          recentBooks.length > 0 && (
            <section className="mt-12 pt-8 border-t border-slate-200/50" aria-label="Sách đã xem">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px bg-slate-200 flex-grow"></div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap px-4">Sách bạn vừa xem</h2>
                <div className="h-px bg-slate-200 flex-grow"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4">
                {recentBooks.map(b => (
                  <BookCard key={b.id} book={b} onAddToCart={addToCart} onQuickView={onQuickView} />
                ))}

              </div>
            </section>
          )
        }

        {/* Lightbox Overlay - Portaled to body to escape parent transforms */}
        {showLightbox && createPortal(
          <AnimatePresence>
            {showLightbox && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
                onClick={() => setShowLightbox(false)}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowLightbox(false)}
                  className="absolute top-6 right-6 lg:top-10 lg:right-10 w-12 h-12 rounded-full bg-white/10 hover:bg-rose-500 text-white transition-all flex items-center justify-center z-[110]"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>

                {/* Main Image */}
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  src={activeImage || book.cover}
                  alt={book.title}
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl cursor-zoom-out select-none"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Navigation Buttons */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currIdx = galleryImages.indexOf(activeImage || '');
                        const prevIdx = (currIdx - 1 + galleryImages.length) % galleryImages.length;
                        setActiveImage(galleryImages[prevIdx]);
                      }}
                      className="absolute left-4 lg:left-10 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-900 transition-all flex items-center justify-center backdrop-blur-sm shadow-xl"
                    >
                      <i className="fa-solid fa-chevron-left text-xl"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currIdx = galleryImages.indexOf(activeImage || '');
                        const nextIdx = (currIdx + 1) % galleryImages.length;
                        setActiveImage(galleryImages[nextIdx]);
                      }}
                      className="absolute right-4 lg:right-10 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-900 transition-all flex items-center justify-center backdrop-blur-sm shadow-xl"
                    >
                      <i className="fa-solid fa-chevron-right text-xl"></i>
                    </button>
                  </>
                )}

                {/* Indicators */}
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[110]">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImage(img);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${activeImage === img ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'}`}
                      ></button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Quick Buy Bar for Desktop - Portaled to body to escape parent transforms */}
        {book && !loading && !error && createPortal(
          <QuickBuyBar
            book={book}
            quantity={quantity}
            setQuantity={setQuantity}
            isWishlisted={isWishlisted}
            toggleWishlist={toggleWishlist}
            addToCart={addToCart}
          />,
          document.body
        )}
      </div>
    </div>
  );
};

export default BookDetails;
