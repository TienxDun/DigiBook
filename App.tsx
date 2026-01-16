
import React, { useState, useCallback, useMemo, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  auth, 
  googleProvider,
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from "./services/firebase";
import Header from './components/Header';
import CartSidebar from './components/CartSidebar';
import MobileNav from './components/MobileNav';
import Footer from './components/Footer';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

import { Book, CartItem, CategoryInfo } from './types';
import { db } from './services/db';
import { Toaster, toast } from 'react-hot-toast';
import ErrorHandler from './services/errorHandler';

import { AuthContext, User, useAuth } from './AuthContext';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const MainContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <main className={`flex-grow ${isAdmin ? '' : 'pt-20 lg:pt-20'}`}>
      {children}
    </main>
  );
};

const LayoutWrapper: React.FC<{ 
  children: React.ReactNode, 
  cartCount: number, 
  cartItems: CartItem[], 
  categories: CategoryInfo[],
  onOpenCart: () => void, 
  onSearch: (q: string) => void,
  searchQuery: string,
  onRefreshData?: () => void,
  isCartOpen: boolean,
  onCloseCart: () => void,
  onRemoveCart: (id: string) => void,
  onUpdateCartQty: (id: string, delta: number) => void
}> = ({ children, cartCount, cartItems, categories, onOpenCart, onSearch, searchQuery, onRefreshData, isCartOpen, onCloseCart, onRemoveCart, onUpdateCartQty }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isAdmin && (
        <Header 
          cartCount={cartCount} 
          cartItems={cartItems} 
          categories={categories}
          onOpenCart={onOpenCart} 
          onSearch={onSearch} 
          searchQuery={searchQuery}
          onRefreshData={onRefreshData}
        />
      )}
      
      <MainContent>{children}</MainContent>
      
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileNav cartCount={cartCount} onOpenCart={onOpenCart} onRefreshData={onRefreshData} />}
      
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={onCloseCart} 
        items={cartItems} 
        onRemove={onRemoveCart} 
        onUpdateQty={onUpdateCartQty} 
      />
    </div>
  );
};

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem('digibook_cart') || '[]'));
  const [wishlist, setWishlist] = useState<Book[]>(() => JSON.parse(localStorage.getItem('digibook_wishlist') || '[]'));
  const [user, setUser] = useState<User | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');

  const fetchInitialData = async () => {
    try {
      setSearchQuery(''); // Clear search
      const [booksData, catsData] = await Promise.all([
        db.getBooks(),
        db.getCategories()
      ]);
      setAllBooks(booksData);
      setCategories(catsData);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch additional profile data from Firestore
          const profile = await db.getUserProfile(firebaseUser.uid);
          
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || profile?.name || "Độc giả",
            email: firebaseUser.email || profile?.email || "",
            avatar: firebaseUser.photoURL || profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=4f46e5&color=fff`,
            isAdmin: (profile?.role === 'admin') || (firebaseUser.email === 'admin@gmail.com')
          });

          // Create profile if not exists
          if (!profile) {
            await db.updateUserProfile({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "Độc giả",
              email: firebaseUser.email || "",
              avatar: firebaseUser.photoURL || "",
              role: firebaseUser.email === 'admin@gmail.com' ? 'admin' : 'user'
            });
          }
        } else {
          setUser(null);
        }
      });
    }
    return () => unsubscribe();
  }, []);

  useEffect(() => localStorage.setItem('digibook_cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('digibook_wishlist', JSON.stringify(wishlist)), [wishlist]);

  const loginWithGoogle = async () => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      const result = await signInWithPopup(auth, googleProvider);
      db.logActivity('AUTH_LOGIN_GOOGLE', `Email: ${result.user.email}`, 'SUCCESS');
      setShowLoginModal(false);
      toast.success(`Chào mừng trở lại, ${result.user.displayName || 'bạn'}!`);
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_LOGIN_GOOGLE');
      setAuthError(result.error);
    }
  };

  const changePassword = async (oldPw: string, newPw: string) => {
    try {
      if (!auth || !auth.currentUser) throw new Error("Chưa đăng nhập");
      
      const isGoogleUser = auth.currentUser.providerData.some(p => p.providerId === 'google.com');
      if (isGoogleUser) {
        throw new Error("Tài khoản Google không thể đổi mật khẩu trực tiếp tại đây.");
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, oldPw);
      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPw);
      db.logActivity('AUTH_CHANGE_PASSWORD', `Email: ${auth.currentUser.email}`, 'SUCCESS');
      toast.success('Đổi mật khẩu thành công!');
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_CHANGE_PASSWORD');
      throw new Error(result.error);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      await sendPasswordResetEmail(auth, email);
      db.logActivity('AUTH_FORGOT_PASSWORD', `Email: ${email}`, 'SUCCESS');
      toast.success('Đã gửi email khôi phục mật khẩu!');
    } catch (error: any) {
       const result = ErrorHandler.handle(error, 'AUTH_FORGOT_PASSWORD');
       throw new Error(result.error);
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      const result = await signInWithEmailAndPassword(auth, e, p);
      db.logActivity('AUTH_LOGIN_EMAIL', `Email: ${result.user.email}`, 'SUCCESS');
      setShowLoginModal(false);
      setAuthError('');
      toast.success(`Chào mừng trở lại, ${result.user.displayName || 'bạn'}!`);
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_LOGIN_EMAIL');
      setAuthError(result.error);
    }
  };

  const registerWithEmail = async (n: string, e: string, p: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      const res = await createUserWithEmailAndPassword(auth, e, p);
      await updateProfile(res.user, { displayName: n });
      db.logActivity('AUTH_REGISTER', `Email: ${e} | Tên: ${n}`, 'SUCCESS');
      setShowLoginModal(false);
      setAuthError('');
      toast.success('Tạo tài khoản thành công!');
    } catch (error: any) {
      const result = ErrorHandler.handle(error, 'AUTH_REGISTER');
      setAuthError(result.error);
    }
  };

  const handleLogout = async () => {
    const prevEmail = user?.email || 'Unknown';
    if (auth) {
      await signOut(auth);
      db.logActivity('AUTH_LOGOUT', `User: ${prevEmail}`, 'SUCCESS');
    }
    setUser(null);
  };

  const toggleWishlist = useCallback((book: Book) => {
    setWishlist(prev => {
      const exists = prev.find(b => b.id === book.id);
      return exists ? prev.filter(b => b.id !== book.id) : [...prev, book];
    });
  }, []);

  const addToCart = useCallback((book: Book) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...book, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <span className="text-slate-400 font-black tracking-widest uppercase text-xs animate-pulse">Đang tải DigiBook...</span>
    </div>
  );

  return (
    <AuthContext.Provider value={{ 
      user, loginWithGoogle, loginWithEmail, registerWithEmail, changePassword, sendPasswordReset, logout: handleLogout, 
      showLoginModal, setShowLoginModal, wishlist, toggleWishlist, loading 
    }}>
      <Router>
        <LayoutWrapper 
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          cartItems={cart}
          categories={categories}
          onOpenCart={() => setIsCartOpen(true)}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          onRefreshData={fetchInitialData}
          isCartOpen={isCartOpen}
          onCloseCart={() => setIsCartOpen(false)}
          onRemoveCart={(id) => setCart(c => c.filter(i => i.id !== id))}
          onUpdateCartQty={(id, delta) => setCart(c => c.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + delta)} : i))}
        >
          {showLoginModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl transition-all">
              <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-1 shadow-[0_32px_120px_-10px_rgba(0,0,0,0.5)] animate-fadeIn overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-violet-600 -rotate-6 scale-110 opacity-10"></div>
                
                <div className="relative bg-white rounded-[2.4rem] p-10">
                  <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                  
                  <div className="mb-10">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-3xl rotate-12 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-200">
                      <i className="fa-solid fa-book-open text-white text-3xl -rotate-12"></i>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                      {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                    </h2>
                    <p className="text-slate-400 text-sm font-semibold mt-3">
                      {authMode === 'login' ? 'Tiếp tục đam mê đọc sách cùng DigiBook' : 'Bắt đầu hành trình tri thức mới'}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {authError && (
                      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold rounded-2xl flex items-center gap-3 animate-shake">
                        <i className="fa-solid fa-triangle-exclamation text-sm"></i>
                        {authError}
                      </div>
                    )}

                    <div className="space-y-4">
                      {authMode === 'register' && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Họ và tên</label>
                          <div className="relative group">
                            <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                            <input 
                              type="text" 
                              value={displayName} 
                              onChange={e => setDisplayName(e.target.value)} 
                              placeholder="Nguyễn Văn A" 
                              className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 font-bold transition-all text-slate-900 placeholder:text-slate-300" 
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Email của bạn</label>
                        <div className="relative group">
                          <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                          <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="yourname@gmail.com" 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 font-bold transition-all text-slate-900 placeholder:text-slate-300" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Mật khẩu</label>
                        <div className="relative group">
                          <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"></i>
                          <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="••••••••" 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 ring-indigo-50 font-bold transition-all text-slate-900 placeholder:text-slate-300" 
                          />
                        </div>
                        {authMode === 'login' && (
                          <div className="flex justify-end mt-2">
                            <button 
                              onClick={async () => {
                                if (!email) {
                                  setAuthError('Vui lòng nhập Email trước khi khôi phục mật khẩu.');
                                  return;
                                }
                                try {
                                  await sendPasswordReset(email);
                                } catch (err: any) {
                                  setAuthError(err.message);
                                }
                              }}
                              className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest"
                            >
                              Quên mật khẩu?
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => authMode === 'login' ? loginWithEmail(email, password) : registerWithEmail(displayName, email, password)} 
                      className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[1.2rem] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0 transition-all shadow-xl shadow-indigo-100"
                    >
                      {authMode === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
                    </button>

                    <div className="relative py-2 flex items-center gap-4">
                      <div className="flex-1 h-px bg-slate-100"></div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">Hoặc</span>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </div>

                    <button 
                      onClick={loginWithGoogle} 
                      className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-black flex items-center justify-center gap-4 hover:bg-slate-50 hover:border-slate-200 transition-all"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5" alt=""/>
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Tiếp tục với Google</span>
                    </button>

                    <div className="text-center pt-4">
                      <button 
                        onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} 
                        className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors py-2 px-4 bg-indigo-50 rounded-full"
                      >
                        {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký tại đây' : 'Đã có tài khoản? Đăng nhập'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) }

          <MainContent>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Phù phép không gian tri thức...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/" element={<HomePage allBooks={allBooks} categories={categories} onAddToCart={addToCart} />} />
                <Route path="/book/:id" element={<BookDetails onAddToCart={addToCart} />} />
                <Route path="/search/:query" element={<SearchResults onAddToCart={addToCart} />} />
                <Route path="/category/:categoryName" element={<CategoryPage onAddToCart={addToCart} />} />
                <Route path="/author/:authorName" element={<AuthorPage onAddToCart={addToCart} />} />
                <Route path="/wishlist" element={<WishlistPage onAddToCart={addToCart} />} />
                <Route path="/checkout" element={<CheckoutPage cart={cart} onClearCart={() => setCart([])} />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/my-orders" element={<MyOrdersPage />} />
                <Route path="/my-orders/:orderId" element={<OrderDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              </Routes>
            </Suspense>
          </MainContent>
        </LayoutWrapper>
      </Router>
      <Toaster position="top-center" reverseOrder={false} />
    </AuthContext.Provider>
  );
};

export default App;
