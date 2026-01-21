import React, { Suspense, lazy, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useBooks } from './contexts/BookContext';
import { useCart } from './contexts/CartContext';

import { LayoutWrapper, AdminRoute, MainContent } from './components/Layout';
import LoginModal from './components/LoginModal';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import { QuickViewModal } from './components/QuickViewModal';
import { Book } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const AuthorsPage = lazy(() => import('./pages/AuthorsPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Lazy load admin routes as separate chunk
const AdminRoutes = lazy(() => import(/* webpackChunkName: "admin" */ './routes/AdminRoutes'));

const AppContent: React.FC = () => {
  const { addToCart } = useCart();

  const location = useLocation();
  const [quickViewBook, setQuickViewBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickView = (book: Book) => setQuickViewBook(book);

  return (
    <LayoutWrapper
      onSearch={setSearchQuery}
      searchQuery={searchQuery}
    >
      <LoginModal />
      <QuickViewModal
        book={quickViewBook}
        onClose={() => setQuickViewBook(null)}
        onAddToCart={addToCart}
      />

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
              <Route path="/" element={<PageTransition><HomePage onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/book/:id" element={<PageTransition><BookDetails onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/search/:query" element={<PageTransition><SearchResults onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/category/:categoryName" element={<PageTransition><CategoryPage onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/authors" element={<PageTransition><AuthorsPage /></PageTransition>} />
              <Route path="/author/:authorName" element={<PageTransition><AuthorPage onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/wishlist" element={<PageTransition><WishlistPage onQuickView={handleQuickView} /></PageTransition>} />
              <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
              <Route path="/order-success" element={<PageTransition><OrderSuccess /></PageTransition>} />
              <Route path="/my-orders" element={<PageTransition><MyOrdersPage /></PageTransition>} />
              <Route path="/my-orders/:orderId" element={<PageTransition><OrderDetailPage /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
              <Route path="/admin/*" element={<AdminRoute><AdminRoutes /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </MainContent>
    </LayoutWrapper>
  );
};

const App: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { loading: booksLoading } = useBooks();

  if (authLoading || booksLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
      <span className="text-slate-400 font-extrabold tracking-premium uppercase text-micro animate-pulse">Đang tải DigiBook...</span>
    </div>
  );

  return (
    <Router>
      <ScrollToTop />
      <BackToTop />
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            padding: '16px 24px',
            borderRadius: '24px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            border: '1px solid var(--toast-border)',
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

