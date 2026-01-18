
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');

  const syncUser = useCallback(async (firebaseUser: any, forceName?: string) => {
    if (firebaseUser) {
      // 1. Lấy profile hiện tại từ Firestore
      const profile = await db.getUserProfile(firebaseUser.uid);

      // KIỂM TRA TRẠNG THÁI KHÓA TÀI KHOẢN
      if (profile?.status === 'banned') {
        await signOut(auth);
        setUser(null);
        toast.error('Tài khoản của bạn đã bị khóa bởi quản trị viên.', { id: 'auth-banned' });
        db.logActivity('AUTH_BANNED_BLOCK', `User ${firebaseUser.email} tried to login but is banned`, 'ERROR');
        return false;
      }
      
      // 2. Chuẩn bị dữ liệu hiển thị (ưu tiên forceName -> profile Firestore -> firebase)
      const userData = {
        id: firebaseUser.uid,
        name: forceName || profile?.name || firebaseUser.displayName || "Độc giả",
        email: firebaseUser.email || profile?.email || "",
        avatar: profile?.avatar || firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(forceName || firebaseUser.displayName || 'U')}&background=4f46e5&color=fff`,
        isAdmin: profile?.role === 'admin'
      };
      
      setUser(userData);

      // 3. Tự động tạo/cập nhật profile trong Firestore nếu chưa có hoặc dữ liệu mới đầy đủ hơn
      if (!profile || forceName || (firebaseUser.displayName && !profile.name)) {
        await db.updateUserProfile({
          id: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          role: userData.isAdmin ? 'admin' : 'user',
          ...( !profile && { status: 'active' } ) // Chỉ đặt status khi tạo mới
        });
      }
      return true;
    } else {
      setUser(null);
      return false;
    }
  }, []);

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
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        syncUser(firebaseUser);
      });
    }
    return () => unsubscribe();
  }, [syncUser]);

  useEffect(() => localStorage.setItem('digibook_cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('digibook_wishlist', JSON.stringify(wishlist)), [wishlist]);

  const loginWithGoogle = async () => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      const result = await signInWithPopup(auth, googleProvider);
      
      // Đồng bộ profile ngay lập tức
      const success = await syncUser(result.user);
      if (!success) return;
      
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
      
      // Đồng bộ profile ngay lập tức
      const success = await syncUser(result.user);
      if (!success) return;

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
      
      if (p !== confirmPassword) {
        setAuthError("Mật khẩu xác nhận không khớp.");
        return;
      }

      const res = await createUserWithEmailAndPassword(auth, e, p);
      await updateProfile(res.user, { displayName: n });
      
      // Đồng bộ profile ngay sau khi cập nhật displayName, truyền n trực tiếp
      await syncUser(res.user, n);

      db.logActivity('AUTH_REGISTER', `Email: ${e} | Tên: ${n}`, 'SUCCESS');
      setShowLoginModal(false);
      setAuthError('');
      toast.success('Tạo tài khoản thành công!');
      
      // Chuyển hướng về trang chủ sau khi đăng ký thành công
      window.location.hash = '/';
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

  const addToCart = useCallback((book: Book, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...book, quantity }];
    });
    setIsCartOpen(true);
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <span className="text-slate-400 font-extrabold tracking-premium uppercase text-micro animate-pulse">Đang tải DigiBook...</span>
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
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
              <div className="relative bg-white w-full max-w-[380px] rounded-[2rem] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-fadeIn overflow-hidden">
                <div className="relative bg-white rounded-[1.9rem] p-8">
                  <button 
                    onClick={() => {
                      setShowLoginModal(false);
                      setConfirmPassword('');
                      setAuthError('');
                    }} 
                    className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                  
                  <div className="mb-8 text-center">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg shadow-slate-200">
                      <i className="fa-solid fa-book-open text-white text-xl"></i>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
                      {authMode === 'login' ? 'Chào mừng bạn' : 'Tham gia cùng cửa hàng'}
                    </h2>
                    <p className="text-micro font-bold uppercase tracking-premium text-slate-400 mt-2">
                       DigiBook • Không gian tri thức
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      authMode === 'login' ? loginWithEmail(email, password) : registerWithEmail(displayName, email, password);
                    }}
                    className="space-y-4"
                  >
                    {authError && (
                      <div className="p-3 bg-rose-50 text-rose-500 text-micro font-bold uppercase tracking-premium rounded-xl flex items-center gap-2 animate-shake">
                        <i className="fa-solid fa-circle-exclamation text-sm"></i>
                        {authError}
                      </div>
                    )}

                    <div className="space-y-3">
                      {authMode === 'register' && (
                        <div className="space-y-1">
                          <div className="relative group">
                            <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                            <input 
                              type="text" 
                              required
                              value={displayName} 
                              onChange={e => setDisplayName(e.target.value)} 
                              placeholder="Họ và tên" 
                              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-slate-900 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300" 
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="relative group">
                          <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                          <input 
                            type="email" 
                            required
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="Địa chỉ Email" 
                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-slate-900 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="relative group">
                          <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                          <input 
                            type="password" 
                            required
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Mật khẩu" 
                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-slate-900 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300" 
                          />
                        </div>
                        {authMode === 'login' && (
                          <div className="flex justify-end pr-2">
                            <button 
                              type="button"
                              onClick={async () => {
                                if (!email) {
                                  setAuthError('Vui lòng nhập Email trước.');
                                  return;
                                }
                                try {
                                  await sendPasswordReset(email);
                                } catch (err: any) {
                                  setAuthError(err.message);
                                }
                              }}
                              className="text-micro font-bold text-slate-400 hover:text-slate-900 uppercase tracking-premium transition-colors"
                            >
                              Quên mật khẩu?
                            </button>
                          </div>
                        )}
                      </div>

                      {authMode === 'register' && (
                        <div className="space-y-1">
                          <div className="relative group">
                            <i className="fa-solid fa-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors text-sm"></i>
                            <input 
                              type="password" 
                              required
                              value={confirmPassword} 
                              onChange={e => setConfirmPassword(e.target.value)} 
                              placeholder="Xác nhận mật khẩu" 
                              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-slate-900 font-bold transition-all text-slate-900 text-sm placeholder:text-slate-300" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      type="submit"
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-premium text-micro hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-slate-100"
                    >
                      {authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                    </button>

                    <div className="relative py-2 flex items-center gap-3">
                      <div className="flex-1 h-px bg-slate-100"></div>
                      <span className="text-micro font-bold text-slate-300 uppercase tracking-premium px-1">Hoặc sử dụng</span>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </div>

                    <button 
                      type="button"
                      onClick={loginWithGoogle} 
                      className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center gap-4 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-700 active:scale-[0.98] relative overflow-hidden group shadow-lg shadow-slate-100/50"
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-5" alt="Google Logo" />
                      
                      <span className="text-micro font-bold uppercase tracking-premium">Tiếp tục bằng Google</span>

                      {/* Vệt màu thương hiệu Google tinh tế ở dưới cùng */}
                      <div className="absolute bottom-0 left-0 w-full h-[3px] flex opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="flex-1 bg-[#4285F4]"></div> {/* Blue */}
                        <div className="flex-1 bg-[#EA4335]"></div> {/* Red */}
                        <div className="flex-1 bg-[#FBBC05]"></div> {/* Yellow */}
                        <div className="flex-1 bg-[#34A853]"></div> {/* Green */}
                      </div>
                    </button>

                    <div className="text-center pt-2">
                      <button 
                        type="button"
                        onClick={() => { 
                          setAuthMode(authMode === 'login' ? 'register' : 'login'); 
                          setAuthError(''); 
                          setConfirmPassword('');
                        }} 
                        className="text-micro font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-premium"
                      >
                        {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) }

          <MainContent>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-micro font-bold uppercase tracking-premium text-slate-500">Phù phép không gian tri thức...</p>
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
