
import React, { useState, useCallback, useMemo, useEffect, createContext, useContext } from 'react';
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
import BookCard from './components/BookCard';
import CartSidebar from './components/CartSidebar';
import MobileNav from './components/MobileNav';
import Footer from './components/Footer';
import BookDetails from './pages/BookDetails';
import CategoryPage from './pages/CategoryPage';
import AuthorPage from './pages/AuthorPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccess from './pages/OrderSuccess';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import { Book, CartItem } from './types';
import { db } from './services/db';
import { CATEGORIES } from './constants';

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
  onOpenCart: () => void, 
  onSearch: (q: string) => void,
  isCartOpen: boolean,
  onCloseCart: () => void,
  onRemoveCart: (id: string) => void,
  onUpdateCartQty: (id: string, delta: number) => void
}> = ({ children, cartCount, cartItems, onOpenCart, onSearch, isCartOpen, onCloseCart, onRemoveCart, onUpdateCartQty }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isAdmin && (
        <Header 
          cartCount={cartCount} 
          cartItems={cartItems} 
          onOpenCart={onOpenCart} 
          onSearch={onSearch} 
        />
      )}
      
      <MainContent>{children}</MainContent>
      
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileNav cartCount={cartCount} onOpenCart={onOpenCart} />}
      
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
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookOffset, setBookOffset] = useState(0);
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');

  const fetchInitialData = async () => {
    try {
      const books = await db.getBooks();
      setAllBooks(books);
    } catch (e) {
      console.error("Failed to fetch books", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "Độc giả",
            email: firebaseUser.email || "",
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=4f46e5&color=fff`,
            isAdmin: firebaseUser.email === 'admin@gmail.com'
          });
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
      // @ts-ignore - Truy cập private logActivity qua instance db
      db.logActivity('AUTH_LOGIN_GOOGLE', `Email: ${result.user.email}`, 'SUCCESS');
      setShowLoginModal(false);
    } catch (error: any) {
      // @ts-ignore
      db.logActivity('AUTH_LOGIN_GOOGLE', `Lỗi: ${error.message}`, 'ERROR');
      setAuthError('Không thể đăng nhập bằng Google.');
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
      // @ts-ignore
      db.logActivity('AUTH_CHANGE_PASSWORD', `Email: ${auth.currentUser.email}`, 'SUCCESS');
    } catch (error: any) {
      // @ts-ignore
      db.logActivity('AUTH_CHANGE_PASSWORD', `Lỗi: ${error.message}`, 'ERROR');
      if (error.code === 'auth/wrong-password') {
        throw new Error("Mật khẩu cũ không chính xác.");
      }
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      await sendPasswordResetEmail(auth, email);
      // @ts-ignore
      db.logActivity('AUTH_FORGOT_PASSWORD', `Email: ${email}`, 'SUCCESS');
    } catch (error: any) {
       // @ts-ignore
       db.logActivity('AUTH_FORGOT_PASSWORD', `Lỗi: ${error.message}`, 'ERROR');
       if (error.code === 'auth/user-not-found') {
         throw new Error("Email này chưa được đăng ký trên hệ thống.");
       }
       throw error;
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      const result = await signInWithEmailAndPassword(auth, e, p);
      // @ts-ignore
      db.logActivity('AUTH_LOGIN_EMAIL', `Email: ${result.user.email}`, 'SUCCESS');
      setShowLoginModal(false);
      setAuthError('');
    } catch (error: any) {
      // @ts-ignore
      db.logActivity('AUTH_LOGIN_EMAIL', `Lỗi: ${error.message}`, 'ERROR');
      setAuthError('Email hoặc mật khẩu không chính xác.');
    }
  };

  const registerWithEmail = async (n: string, e: string, p: string) => {
    try {
      if (!auth) throw new Error("Auth not initialized");
      const res = await createUserWithEmailAndPassword(auth, e, p);
      await updateProfile(res.user, { displayName: n });
      // @ts-ignore
      db.logActivity('AUTH_REGISTER', `Email: ${e} | Tên: ${n}`, 'SUCCESS');
      setShowLoginModal(false);
      setAuthError('');
    } catch (error: any) {
      // @ts-ignore
      db.logActivity('AUTH_REGISTER', `Lỗi: ${error.message}`, 'ERROR');
      setAuthError('Không thể tạo tài khoản.');
    }
  };

  const handleLogout = async () => {
    const prevEmail = user?.email || 'Unknown';
    if (auth) {
      await signOut(auth);
      // @ts-ignore
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

  const processedBooks = useMemo(() => {
    if (!searchQuery) return allBooks;
    const q = searchQuery.toLowerCase();
    return allBooks.filter(book => 
      book.title.toLowerCase().includes(q) || 
      book.author.toLowerCase().includes(q)
    );
  }, [allBooks, searchQuery]);

  useEffect(() => {
    setBookOffset(0);
  }, [searchQuery]);

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
          onOpenCart={() => setIsCartOpen(true)}
          onSearch={setSearchQuery}
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
                                  alert('Email khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.');
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
            <Routes>
              <Route path="/" element={
                <div className="space-y-0">
                  {/* Hero Section */}
                  <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-white mt-[-80px] lg:mt-[-80px]">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -skew-x-12 translate-x-32 hidden lg:block"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-50/50 to-transparent lg:hidden"></div>
                    
                    <div className="w-[92%] xl:w-[60%] mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-10 pt-28 pb-12 lg:pt-32">
                      <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                          <i className="fa-solid fa-sparkles"></i> New Generation Bookstore
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tighter">
                          Khai phá <br />
                          <span className="text-indigo-600">Tiềm năng</span> <br />
                          qua từng trang sách.
                        </h1>
                        <p className="text-slate-500 text-base lg:text-lg max-w-lg mb-10 leading-relaxed font-medium">
                          DigiBook mang đến trải nghiệm đọc sách hiện đại, nơi tri thức và công nghệ hội tụ để thắp sáng tư duy của bạn.
                        </p>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                          <Link to="/category/Tất cả sách" className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 text-xs">
                            Khám phá ngay
                          </Link>
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                              {[1,2,3].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="" />
                              ))}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-black text-slate-900 leading-none">5,000+ Độc giả</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Đã tin dùng</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 relative group w-full max-w-xl">
                         <div className="absolute -inset-10 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                         <div className="relative grid grid-cols-2 gap-4">
                            <div className="space-y-4 pt-8">
                               <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4.2] object-cover rounded-[1.5rem] shadow-2xl transition-transform duration-700 hover:-translate-y-2" alt="" />
                               <img src="https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4.2] object-cover rounded-[1.5rem] shadow-2xl transition-transform duration-700 hover:-translate-y-2" alt="" />
                            </div>
                            <div className="space-y-4">
                               <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop" className="w-full aspect-[3/4.2] object-cover rounded-[1.5rem] shadow-2xl transition-transform duration-700 hover:-translate-y-2" alt="" />
                               <div className="w-full aspect-[3/4.2] bg-indigo-600 rounded-[1.5rem] shadow-2xl flex flex-col items-center justify-center p-6 text-center text-white">
                                  <i className="fa-solid fa-star-half-stroke text-3xl mb-3 text-amber-300"></i>
                                  <p className="text-xl font-black">4.9/5</p>
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Đánh giá trung bình</p>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </section>

                  {/* Intro Section */}
                  <section className="py-16 bg-slate-50">
                    <div className="w-[92%] xl:w-[60%] mx-auto px-4">
                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500 group relative overflow-hidden">
                           <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-700 blur-3xl"></div>
                           <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-cyan-200 relative z-10">
                              <i className="fa-solid fa-certificate"></i>
                           </div>
                           <h3 className="text-xl font-black text-slate-900 mb-4 relative z-10">Sách Bản Quyền</h3>
                           <p className="text-slate-500 leading-relaxed font-medium text-xs tracking-wide relative z-10">Cam kết 100% sách chính hãng từ các nhà xuất bản uy tín nhất Việt Nam và thế giới.</p>
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 group lg:-translate-y-12 relative overflow-hidden border-b-4 border-b-orange-500/20">
                           <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-700 blur-3xl"></div>
                           <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-xl shadow-orange-200 relative z-10">
                              <i className="fa-solid fa-bolt"></i>
                           </div>
                           <h3 className="text-xl font-black text-slate-900 mb-4 relative z-10">Giao Tốc Hành</h3>
                           <p className="text-slate-500 leading-relaxed font-medium text-xs tracking-wide relative z-10">Dịch vụ giao hàng 2h tại nội thành và đóng gói cẩn thận từng trang sách quý giá của bạn.</p>
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 group relative overflow-hidden">
                           <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-700 blur-3xl"></div>
                           <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-emerald-200 relative z-10">
                              <i className="fa-solid fa-headset"></i>
                           </div>
                           <h3 className="text-xl font-black text-slate-900 mb-4 relative z-10">Hỗ Trợ 24/7</h3>
                           <p className="text-slate-500 leading-relaxed font-medium text-xs tracking-wide relative z-10">Đội ngũ chuyên gia luôn sẵn sàng tư vấn và giúp bạn tìm ra những cuốn sách phù hợp nhất.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Categories Grid - New Luxury Style */}
                  <section className="py-24 bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
                    
                    <div className="w-[92%] xl:w-[60%] mx-auto px-4 relative">
                      <div className="flex flex-col items-center text-center mb-16">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full mb-6">
                          <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Danh mục nổi bật</p>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                          Khám phá <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">vũ trụ</span> tri thức
                        </h2>
                        <p className="text-slate-500 max-w-lg text-sm font-medium leading-relaxed">
                          Hành trình vạn dặm bắt đầu từ một trang sách. Hãy chọn cho mình một chủ đề yêu thích để bắt đầu ngay hôm nay.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {CATEGORIES.map((cat, i) => {
                          const colors = [
                            { border: 'hover:border-indigo-500/50', bg: 'bg-indigo-50', icon: 'text-indigo-600', shadow: 'hover:shadow-indigo-500/20', glow: 'from-indigo-500/20' },
                            { border: 'hover:border-rose-500/50', bg: 'bg-rose-50', icon: 'text-rose-500', shadow: 'hover:shadow-rose-500/20', glow: 'from-rose-500/20' },
                            { border: 'hover:border-emerald-500/50', bg: 'bg-emerald-50', icon: 'text-emerald-500', shadow: 'hover:shadow-emerald-500/20', glow: 'from-emerald-500/20' },
                            { border: 'hover:border-amber-500/50', bg: 'bg-amber-50', icon: 'text-amber-500', shadow: 'hover:shadow-amber-500/20', glow: 'from-amber-500/20' },
                            { border: 'hover:border-cyan-500/50', bg: 'bg-cyan-50', icon: 'text-cyan-500', shadow: 'hover:shadow-cyan-500/20', glow: 'from-cyan-500/20' },
                            { border: 'hover:border-violet-500/50', bg: 'bg-violet-50', icon: 'text-violet-500', shadow: 'hover:shadow-violet-500/20', glow: 'from-violet-500/20' },
                          ];
                          const color = colors[i % colors.length];
                          
                          return (
                            <Link 
                              key={i} 
                              to={`/category/${cat.name}`}
                              className={`group relative bg-white p-10 rounded-[3rem] border border-slate-100 transition-all duration-500 ${color.border} ${color.shadow} hover:-translate-y-2 overflow-hidden flex flex-col items-start`}
                            >
                              {/* Background Glow */}
                              <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${color.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl`}></div>
                              
                              <div className={`w-16 h-16 ${color.bg} ${color.icon} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm`}>
                                <i className={`fa-solid ${cat.icon} text-2xl`}></i>
                              </div>
                              
                              <div className="relative z-10">
                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 line-clamp-2">{cat.description}</p>
                                
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-all">
                                  <span>Khám phá ngay</span>
                                  <i className="fa-solid fa-chevron-right group-hover:translate-x-2 transition-transform"></i>
                                </div>
                              </div>

                              {/* Decorative Large Icon in Background */}
                              <i className={`fa-solid ${cat.icon} absolute -right-4 -top-4 text-7xl opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-125 -rotate-12`}></i>
                            </Link>
                          );
                        })}
                      </div>

                      <div className="mt-16 flex justify-center">
                        <Link to="/category/Tất cả sách" className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/20 transition-all active:scale-95">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative flex items-center gap-3">
                            Xem tất cả danh mục <i className="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-transform"></i>
                          </span>
                        </Link>
                      </div>
                    </div>
                  </section>

                  {/* Books Section */}
                  <section className="py-24 bg-slate-50/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
                    
                    <div className="w-[92%] xl:w-[60%] mx-auto px-4 relative">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                        <div className="max-w-xl">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-lg mb-4">
                            <i className="fa-solid fa-sparkles text-rose-500 text-[10px]"></i>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Curated For You</p>
                          </div>
                          <h2 className="text-3xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                            Tác phẩm <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">đề cử</span> dành riêng cho bạn
                          </h2>
                        </div>
                        <div className="flex gap-3">
                           <button 
                             onClick={() => setBookOffset(prev => Math.max(0, prev - 5))}
                             disabled={bookOffset === 0}
                             className={`w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center transition-all ${bookOffset === 0 ? 'opacity-30 cursor-not-allowed shadow-inner' : 'text-slate-400 hover:text-indigo-600 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-90 shadow-sm'}`}
                           >
                              <i className="fa-solid fa-chevron-left"></i>
                           </button>
                           <button 
                             onClick={() => setBookOffset(prev => Math.min(Math.max(0, processedBooks.length - 10), prev + 5))}
                             disabled={bookOffset + 10 >= processedBooks.length}
                             className={`w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center transition-all ${bookOffset + 10 >= processedBooks.length ? 'opacity-30 cursor-not-allowed shadow-inner' : 'text-slate-400 hover:text-indigo-600 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-90 shadow-sm'}`}
                           >
                              <i className="fa-solid fa-chevron-right"></i>
                           </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 transition-all duration-700">
                        {processedBooks.slice(bookOffset, bookOffset + 10).map((book) => (
                          <BookCard key={book.id} book={book} onAddToCart={addToCart} />
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Promo Banner Section */}
                  <section className="py-10 bg-white">
                    <div className="w-[92%] xl:w-[60%] mx-auto px-4">
                       <div className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden flex flex-col lg:flex-row items-center gap-10 shadow-xl">
                          <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-[100px]"></div>
                          <div className="relative z-10 flex-1 text-center lg:text-left">
                             <h2 className="text-2xl lg:text-3xl font-black text-white mb-4 tracking-tighter leading-tight">
                                Trở thành thành viên <br />
                                nhận ngay <span className="text-indigo-400">ưu đãi 50k</span>
                             </h2>
                             <p className="text-slate-400 text-xs mb-6 max-w-lg">Sử dụng mã <strong>WELCOME5</strong> cho đơn hàng từ 200k. Chỉ áp dụng cho tài khoản mới đăng ký.</p>
                             <button onClick={() => setShowLoginModal(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all active:scale-95 text-[10px]">
                                Đăng ký thành viên
                             </button>
                          </div>
                          <div className="flex-1 relative hidden lg:block">
                             <img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop" className="w-full rounded-2xl shadow-2xl rotate-2" alt="" />
                          </div>
                       </div>
                    </div>
                  </section>
                </div>
              } />
              <Route path="/book/:id" element={<BookDetails onAddToCart={addToCart} />} />
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
          </MainContent>
        </LayoutWrapper>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
