
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem, CategoryInfo, Book } from '../types';
import { useAuth } from '../AuthContext';


interface HeaderProps {
  cartCount: number;
  cartItems: CartItem[];
  categories: CategoryInfo[];
  allBooks: Book[];
  onOpenCart: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onRefreshData?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  cartCount, 
  cartItems, 
  categories, 
  allBooks,
  onOpenCart, 
  onSearch, 
  searchQuery, 
  onRefreshData 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, wishlist, logout, setShowLoginModal } = useAuth();
  
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [searchSuggestions, setSearchSuggestions] = useState<Book[]>([]);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleScrollProgress = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = totalScroll / windowHeight;
      setScrollProgress(scroll * 100);
    };

    window.addEventListener('scroll', handleScrollProgress);
    return () => window.removeEventListener('scroll', handleScrollProgress);
  }, []);

  useEffect(() => {
    if (searchValue.trim().length >= 2) {
      const filtered = allBooks
        .filter(book => 
          book.title.toLowerCase().includes(searchValue.toLowerCase()) || 
          book.author.toLowerCase().includes(searchValue.toLowerCase())
        )
        .slice(0, 5);
      setSearchSuggestions(filtered);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchValue, allBooks]);

  const [scrolled, setScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(searchValue);
      if (searchValue.trim()) {
        navigate(`/search/${encodeURIComponent(searchValue.trim())}`);
      } else {
        if (location.pathname !== '/') navigate('/');
      }
      (e.target as HTMLInputElement).blur();
      setIsSearchFocused(false);
    }
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Tất cả sách', path: '/category/Tất cả sách' },
    { name: 'Các tác giả', path: '/authors' },
  ];

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${
        scrolled 
          ? 'h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm px-4' 
          : 'h-24 bg-transparent border-b border-transparent px-6'
      }`}
    >
      {/* Scroll Progress Bar */}
      {scrolled && (
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 z-[60] transition-all duration-300 ease-out" style={{ width: `${scrollProgress}%` }} />
      )}

      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between gap-4">
        
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="flex items-center gap-3 group" 
            onClick={() => { 
              setSearchValue('');
              onRefreshData?.(); 
            }}
          >
            <div className={`transition-all duration-700 bg-slate-900 group-hover:bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200/20 ${scrolled ? 'w-10 h-10 rotate-0' : 'w-11 h-11 -rotate-3 group-hover:rotate-0'}`}>
              <i className={`fa-solid fa-book-bookmark ${scrolled ? 'text-xs' : 'text-lg'}`}></i>
            </div>
            <span className={`font-extrabold tracking-tighter text-slate-900 hidden sm:block transition-all duration-500 ${scrolled ? 'text-lg' : 'text-xl'}`}>
              Digi<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Book</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <div className="relative" ref={categoryMenuRef}>
              <button 
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className={`flex items-center gap-2 text-micro font-bold uppercase tracking-premium transition-all py-1 ${showCategoryMenu ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <i className="fa-solid fa-shapes text-xs"></i>
                Danh mục
                <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-300 ${showCategoryMenu ? 'rotate-180' : ''}`}></i>
              </button>

              {showCategoryMenu && (
                <div className="absolute top-full left-0 mt-4 w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200/60 p-6 z-[100] animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    {categories.length > 0 ? categories.map((cat) => (
                      <Link 
                        key={cat.name}
                        to={`/category/${cat.name}`}
                        onClick={() => setShowCategoryMenu(false)}
                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                      >
                        <div className="w-10 h-10 bg-slate-50 group-hover:bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all shadow-sm group-hover:shadow-md">
                          <i className={`fa-solid ${cat.icon} text-lg`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-label font-extrabold text-slate-900 uppercase tracking-tight">{cat.name}</p>
                          <p className="text-micro text-slate-400 font-bold line-clamp-1">{cat.description}</p>
                        </div>
                      </Link>
                    )) : (
                      <p className="col-span-2 text-label font-bold text-slate-400 text-center py-4">Đang tải danh mục...</p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">Khám phá thế giới sách</p>
                    <Link to="/category/Tất cả sách" className="text-micro font-bold text-indigo-600 uppercase tracking-premium hover:underline">Xem tất cả</Link>
                  </div>
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                onClick={() => {
                  if (link.path === '/') {
                    setSearchValue('');
                    onRefreshData?.();
                  }
                }}
                className={`text-micro font-bold uppercase tracking-premium transition-all relative py-1
                  ${location.pathname === link.path ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}
                `}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 rounded-full transition-all duration-300 ${location.pathname === link.path ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div ref={searchContainerRef} className={`relative flex-1 hidden md:block transition-all duration-700 ${isSearchFocused ? 'max-w-xl' : 'max-w-md'}`}>
          <div className="relative group">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Tìm tên sách, tác giả hoặc ISBN..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              className={`w-full py-3.5 pl-12 pr-6 rounded-2xl text-label font-bold outline-none transition-all duration-500 border ${
                isSearchFocused 
                ? 'bg-white border-indigo-200 ring-[6px] ring-indigo-500/5 shadow-2xl shadow-indigo-200/50' 
                : 'bg-slate-100/50 border-transparent hover:bg-slate-100 hover:border-slate-200'
              }`}
            />
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-500 ${isSearchFocused ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
              {isSearchFocused ? (
                <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
              ) : (
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
              )}
            </div>

            {/* Shortcut key indicator */}
            {!isSearchFocused && !searchValue && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-hover:opacity-60 transition-opacity hidden sm:flex">
                <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-xs font-bold text-slate-500">/</kbd>
              </div>
            )}
          </div>

          {/* Search Suggestions */}
              {isSearchFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden z-[110] animate-fadeIn">
              <div className="p-3">
                {searchSuggestions.map(book => (
                  <Link 
                    key={book.id}
                    to={`/book/${book.id}`}
                    onClick={() => setIsSearchFocused(false)}
                    className="flex items-center gap-4 p-2.5 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-200/50"
                  >
                    <img src={book.cover} alt="" className="w-12 h-16 rounded-xl shadow-md object-cover border border-slate-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-label font-extrabold text-slate-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{book.title}</p>
                      <p className="text-micro font-bold text-slate-400">{book.author}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-label font-black text-rose-600 tracking-tight">{book.price.toLocaleString()}đ</p>
                    </div>
                  </Link>
                ))}
              </div>
              <button 
                onClick={() => {
                  onSearch(searchValue);
                  navigate(`/search/${encodeURIComponent(searchValue.trim())}`);
                  setIsSearchFocused(false);
                }}
                className="w-full py-4 bg-slate-50 text-micro font-extrabold uppercase tracking-premium text-slate-500 hover:text-indigo-600 transition-colors border-t border-slate-200/60"
              >
                Xem tất cả kết quả cho "{searchValue}"
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden w-10 h-10 rounded-xl text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center"
          >
            <i className="fa-solid fa-magnifying-glass text-lg"></i>
          </button>

          <div className="flex items-center p-1 bg-slate-100/50 rounded-2xl relative">
            {/* Wishlist Icon */}
            <Link 
              to="/wishlist" 
              className="w-10 h-10 rounded-xl text-slate-400 hover:bg-white hover:text-rose-500 hover:shadow-sm transition-all flex items-center justify-center relative group"
            >
              <i className="fa-regular fa-heart text-lg group-hover:scale-110 transition-transform"></i>
              {wishlist.length > 0 && (
                <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 border border-white"></span>
                </span>
              )}
            </Link>

            {/* Cart Toggle with Quick Preview */}
            <div 
              className="relative"
              onMouseEnter={() => setShowCartPreview(true)}
              onMouseLeave={() => setShowCartPreview(false)}
            >
              <button 
                onClick={onOpenCart} 
                className="w-10 h-10 rounded-xl bg-white text-slate-600 hover:text-indigo-600 shadow-sm transition-all relative flex items-center justify-center group active:scale-90"
              >
                <i className="fa-solid fa-bag-shopping text-[16px] group-hover:scale-110 transition-transform"></i>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-indigo-600 text-white text-micro font-bold rounded-full flex items-center justify-center border-2 border-white px-1 shadow-md">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Quick Cart Preview Dropdown */}
              <AnimatePresence>
                {showCartPreview && cartItems.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10, originX: '90%', originY: '0%' }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute top-full right-0 mt-4 w-80 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 rounded-[2rem] p-5 z-[100] overflow-hidden"
                  >
                    {/* Glassy Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -z-10 rounded-full" />
                    
                    <div className="flex items-center justify-between mb-5 px-1">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Túi đồ ({cartCount})</h3>
                      <Link to="/category/Tất cả sách" onClick={() => setShowCartPreview(false)} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors">Xem tất cả</Link>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                      {cartItems.slice(0, 3).map(item => (
                        <div key={item.id} className="flex gap-4 group cursor-default">
                          <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-slate-50 bg-slate-50">
                            <img src={item.cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-[12px] font-bold text-slate-800 line-clamp-1 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight mb-0.5">{item.title}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{item.quantity} x {item.price.toLocaleString()}đ</p>
                            <div className="flex items-center gap-1.5">
                               {item.badge && (
                                 <span className="px-1 py-0.5 bg-indigo-50 text-indigo-500 text-[7px] font-black uppercase tracking-tighter rounded">{item.badge}</span>
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {cartItems.length > 3 && (
                        <div className="pt-2 text-center">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">+{cartItems.length - 3} món khác</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-5 border-t border-slate-50">
                      <div className="flex items-center justify-between mb-5 px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tạm tính</span>
                        <span className="text-xl font-black text-indigo-600 tracking-tighter">
                          {cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString()}đ
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => { onOpenCart(); setShowCartPreview(false); }}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-lg shadow-slate-100 flex items-center justify-center gap-2 active:scale-95 group/btn"
                      >
                        Mở túi hàng
                        <i className="fa-solid fa-arrow-right-long text-[8px] group-hover/btn:translate-x-1 transition-transform"></i>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

          {/* Profile Section */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1 rounded-2xl transition-all hover:bg-slate-50 active:scale-95"
              >
                <div className="text-right hidden xl:block">
                  <p className="text-label font-extrabold text-slate-900 leading-none mb-1">{user.name}</p>
                  <p className="text-micro font-bold text-indigo-600 uppercase tracking-premium leading-none">{user.isAdmin ? 'Quản trị viên' : 'Thành viên'}</p>
                </div>
                <div className="relative">
                  <img 
                    src={user.avatar} 
                    className="w-10 h-10 rounded-xl shadow-md object-cover border-2 border-white ring-1 ring-slate-100" 
                    alt={user.name} 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
              </button>

              {showUserMenu && (
                <div 
                  className="absolute top-full right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-200/60 py-3 z-[100] animate-fadeIn"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-5 py-3 border-b border-slate-50 mb-2">
                    <p className="text-label font-extrabold text-slate-900 truncate uppercase mt-1 tracking-tight">{user.name}</p>
                    <p className="text-micro text-slate-400 font-bold truncate tracking-premium">{user.email}</p>
                  </div>
                  <div className="px-2">
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-micro font-bold uppercase tracking-premium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl transition-all group">
                      <div className="w-8 h-8 bg-slate-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center transition-all">
                        <i className="fa-regular fa-circle-user text-base opacity-70 group-hover:opacity-100"></i>
                      </div>
                      Hồ sơ của bạn
                    </Link>
                    <Link to="/my-orders" className="flex items-center gap-3 px-4 py-2.5 text-micro font-bold uppercase tracking-premium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl transition-all group">
                      <div className="w-8 h-8 bg-slate-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center transition-all">
                        <i className="fa-regular fa-file-lines text-base opacity-70 group-hover:opacity-100"></i>
                      </div>
                      Quản lý đơn hàng
                    </Link>
                    {user.isAdmin && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-micro font-bold uppercase tracking-premium text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group">
                        <div className="w-8 h-8 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-all">
                          <i className="fa-solid fa-chart-pie text-base"></i>
                        </div>
                        Trang Quản lý
                      </Link>
                    )}
                    <div className="h-px bg-slate-50 my-2 mx-3"></div>
                    <button 
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-micro font-bold uppercase tracking-premium text-rose-500 hover:bg-rose-50 rounded-2xl transition-all text-left group"
                    >
                      <div className="w-8 h-8 bg-rose-50/50 group-hover:bg-rose-100/50 rounded-xl flex items-center justify-center transition-all">
                        <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                      </div>
                      Đăng xuất ngay
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="group relative px-6 py-3 bg-slate-900 text-white rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 overflow-hidden"
            >
              <span className="relative z-10">Đăng nhập</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
        </div>
      </div>
      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-white z-[120] p-4 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <div className="flex-1 relative">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Tìm kiếm sách..." 
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSearch(searchValue);
                      navigate(`/search/${encodeURIComponent(searchValue.trim())}`);
                      setIsMobileSearchOpen(false);
                      setIsSearchFocused(false);
                    }
                  }}
                  className="w-full py-3 px-4 bg-slate-100 rounded-2xl text-label font-bold outline-none border border-transparent focus:border-indigo-200 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchValue.trim().length >= 2 ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Kết quả gợi ý</p>
                  {searchSuggestions.map(book => (
                    <Link 
                      key={book.id}
                      to={`/book/${book.id}`}
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        setIsSearchFocused(false);
                      }}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      <img src={book.cover} alt="" className="w-14 h-20 rounded-xl object-cover shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-label font-extrabold text-slate-900 truncate uppercase tracking-tight">{book.title}</p>
                        <p className="text-micro font-bold text-slate-400">{book.author}</p>
                        <p className="text-label font-black text-rose-600 mt-1">{book.price.toLocaleString()}đ</p>
                      </div>
                    </Link>
                  ))}
                  {searchSuggestions.length === 0 && (
                    <div className="py-20 text-center">
                      <i className="fa-solid fa-face-frown text-4xl text-slate-200 mb-4"></i>
                      <p className="text-slate-400 font-bold">Không tìm thấy sách phù hợp</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-300">
                  <i className="fa-solid fa-magnifying-glass text-5xl mb-4 opacity-20"></i>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-40">Nhập từ khóa để tìm kiếm</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

