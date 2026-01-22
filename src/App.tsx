import React, { Suspense, lazy, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/features/auth';
import { useBooks } from './contexts/BookContext';
import { CartProvider, useCart } from '@/features/cart';

import { MainLayout, AdminRoute, MainContent } from './layouts';
import { LoginModal } from './features/auth';
import PageTransition from './components/common/PageTransition';
import ScrollToTop from './components/common/ScrollToTop';
import AIAssistant from '@/components/common/AIAssistant';
import BackToTop from './components/common/BackToTop';
import { QuickViewModal } from './features/books';
import { Book } from './types/';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load pages
// Feature Imports using Lazy Loading with Aliases
const HomePage = lazy(() => import('@/features/books').then(m => ({ default: m.HomePage })));
const BookDetails = lazy(() => import('@/features/books').then(m => ({ default: m.BookDetails })));
const CategoryPage = lazy(() => import('@/features/books').then(m => ({ default: m.CategoryPage })));
const SearchResults = lazy(() => import('@/features/books').then(m => ({ default: m.SearchResults })));
const AuthorsPage = lazy(() => import('@/features/books').then(m => ({ default: m.AuthorsPage })));
const AuthorPage = lazy(() => import('@/features/books').then(m => ({ default: m.AuthorPage })));
const WishlistPage = lazy(() => import('@/features/books').then(m => ({ default: m.WishlistPage })));

const ProfilePage = lazy(() => import('@/features/auth').then(m => ({ default: m.ProfilePage })));
const CheckoutPage = lazy(() => import('@/features/cart/pages/CheckoutPage'));

const OrderSuccess = lazy(() => import('@/features/orders').then(m => ({ default: m.OrderSuccess })));
const MyOrdersPage = lazy(() => import('@/features/orders').then(m => ({ default: m.MyOrdersPage })));
const OrderDetailPage = lazy(() => import('@/features/orders').then(m => ({ default: m.OrderDetailPage })));

// Lazy load admin routes as separate chunk
const AdminRoutes = lazy(() => import('@/features/admin/routes/AdminRoutes'));

const AppContent: React.FC = () => {
  const { addToCart } = useCart();

  const location = useLocation();
  const [quickViewBook, setQuickViewBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickView = (book: Book) => setQuickViewBook(book);

  return (
    <MainLayout
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
              <Route path="/checkout" element={<Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}><PageTransition><CheckoutPage /></PageTransition></Suspense>} />
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
    </MainLayout>
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

