import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import { db } from './services/db';
import { LayoutWrapper, AdminRoute, MainContent } from './components/Layout';
import LoginModal from './components/LoginModal';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import QuickViewModal from './components/QuickViewModal';
import { Book, CartItem, CategoryInfo } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const AppContent: React.FC<{
  cartCount: number;
  cartItems: CartItem[];
  categories: CategoryInfo[];
  fetchInitialData: () => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  allBooks: Book[];
  addToCart: (book: Book, quantity?: number, startPos?: { x: number, y: number }) => void;
  setSearchQuery: (query: string) => void;
  searchQuery: string;
}> = ({ cartCount, cartItems, categories, fetchInitialData, isCartOpen, setIsCartOpen, setCart, allBooks, addToCart, setSearchQuery, searchQuery }) => {
  const location = useLocation();
  const [quickViewBook, setQuickViewBook] = useState<Book | null>(null);
  const [flyingItem, setFlyingItem] = useState<{ id: string, image: string, x: number, y: number } | null>(null);

  const handleQuickView = (book: Book) => setQuickViewBook(book);

  const handleAddToCart = (book: Book, quantity?: number, startPos?: { x: number, y: number }) => {
    if (startPos) {
      setFlyingItem({ id: Math.random().toString(), image: book.cover, x: startPos.x, y: startPos.y });
      setTimeout(() => setFlyingItem(null), 1000);
    }
    addToCart(book, quantity);
  };

  return (
    <LayoutWrapper 
      cartCount={cartCount}
      cartItems={cartItems}
      categories={categories}
      allBooks={allBooks}
      onOpenCart={() => setIsCartOpen(true)}
      onSearch={setSearchQuery}
      searchQuery={searchQuery}
      onRefreshData={fetchInitialData}
      isCartOpen={isCartOpen}
      onCloseCart={() => setIsCartOpen(false)}
      onRemoveCart={(id) => setCart(c => c.filter(i => i.id !== id))}
      onUpdateCartQty={(id, delta) => setCart(c => c.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i))}
    >
      <LoginModal />
      <QuickViewModal 
        book={quickViewBook} 
        onClose={() => setQuickViewBook(null)} 
        onAddToCart={handleAddToCart} 
      />

      {/* Fly to Cart Animation */}
      <AnimatePresence>
        {flyingItem && (
          <motion.div
            key={flyingItem.id}
            initial={{ 
              position: 'fixed',
              left: flyingItem.x,
              top: flyingItem.y,
              width: 60,
              height: 80,
              opacity: 1,
              scale: 1,
              zIndex: 9999,
            }}
            animate={{ 
              left: window.innerWidth - 80, 
              top: 20,
              scale: 0.1,
              opacity: 0.2,
              rotate: 360,
              borderRadius: '100%'
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-none"
          >
            <img src={flyingItem.image} className="w-full h-full object-cover rounded shadow-2xl" alt="" />
          </motion.div>
        )}
      </AnimatePresence>

      <MainContent>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-micro font-bold uppercase tracking-premium text-slate-500">Phù phép không gian tri thức...</p>
            </div>
          </div>
        }>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><HomePage allBooks={allBooks} categories={categories} onAddToCart={handleAddToCart} onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/book/:id" element={<PageTransition><BookDetails onAddToCart={handleAddToCart} onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/search/:query" element={<PageTransition><SearchResults onAddToCart={handleAddToCart} onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/category/:categoryName" element={<PageTransition><CategoryPage onAddToCart={handleAddToCart} onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/author/:authorName" element={<PageTransition><AuthorPage onAddToCart={handleAddToCart} onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/wishlist" element={<PageTransition><WishlistPage onAddToCart={handleAddToCart} onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/checkout" element={<PageTransition><CheckoutPage cart={cartItems} onClearCart={() => setCart([])} /></PageTransition>} />
              <Route path="/order-success" element={<PageTransition><OrderSuccess /></PageTransition>} />
              <Route path="/my-orders" element={<PageTransition><MyOrdersPage /></PageTransition>} />
              <Route path="/my-orders/:orderId" element={<PageTransition><OrderDetailPage /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
              <Route path="/admin" element={<AdminRoute><PageTransition><AdminDashboard /></PageTransition></AdminRoute>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </MainContent>
    </LayoutWrapper>
  );
};

const App: React.FC = () => {
  const { loading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem('digibook_cart') || '[]'));
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      setSearchQuery('');
      const [booksData, catsData] = await Promise.all([
        db.getBooks(),
        db.getCategories()
      ]);
      setAllBooks(booksData);
      setCategories(catsData);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => localStorage.setItem('digibook_cart', JSON.stringify(cart)), [cart]);

  const addToCart = useCallback((book: Book, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...book, quantity }];
    });
    
    toast.success(
      <div className="flex flex-col gap-1">
        <p>Đã thêm vào giỏ hàng!</p>
        <p className="text-[11px] font-normal text-slate-500 line-clamp-1">{book.title}</p>
      </div>
    );
    
    setIsCartOpen(true);
  }, []);

  if (loading || dataLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <span className="text-slate-400 font-extrabold tracking-premium uppercase text-micro animate-pulse">Đang tải DigiBook...</span>
    </div>
  );

  return (
    <Router>
      <ScrollToTop />
      <BackToTop />
      <AppContent 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        cartItems={cart}
        categories={categories}
        allBooks={allBooks}
        fetchInitialData={fetchInitialData}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        setCart={setCart}
        addToCart={addToCart}
        setSearchQuery={setSearchQuery}
        searchQuery={searchQuery}
      />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            padding: '16px 24px',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            border: '1px solid #f1f5f9',
          },
          success: {
            iconTheme: {
              primary: '#4f46e5',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </Router>
  );
};

export default App;
