
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { CartItem, CategoryInfo } from '../types';
import { useAuth } from '../AuthContext';


interface HeaderProps {
  cartCount: number;
  cartItems: CartItem[];
  categories: CategoryInfo[];
  onOpenCart: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onRefreshData?: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartCount, cartItems, categories, onOpenCart, onSearch, searchQuery, onRefreshData }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, wishlist, logout, setShowLoginModal } = useAuth();
  
  const [searchValue, setSearchValue] = useState(searchQuery);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const [scrolled, setScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
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
    }
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Tất cả sách', path: '/category/Tất cả sách' },
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
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between gap-6">
        
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-10">
          <Link 
            to="/" 
            className="flex items-center gap-3 group" 
            onClick={() => { 
              setSearchValue('');
              onRefreshData?.(); 
            }}
          >
            <div className={`transition-all duration-700 bg-slate-900 group-hover:bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200/20 ${scrolled ? 'w-10 h-10 rotate-0' : 'w-12 h-12 -rotate-3 group-hover:rotate-0'}`}>
              <i className={`fa-solid fa-book-bookmark ${scrolled ? 'text-sm' : 'text-xl'}`}></i>
            </div>
            <span className={`font-black tracking-tighter text-slate-900 hidden sm:block transition-all duration-500 ${scrolled ? 'text-xl' : 'text-2xl'}`}>
              Digi<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Book</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <div className="relative" ref={categoryMenuRef}>
              <button 
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all py-1 ${showCategoryMenu ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <i className="fa-solid fa-grid-2 text-[12px]"></i>
                Danh mục
                <i className={`fa-solid fa-chevron-down text-[8px] transition-transform duration-300 ${showCategoryMenu ? 'rotate-180' : ''}`}></i>
              </button>

              {showCategoryMenu && (
                <div className="absolute top-full left-0 mt-4 w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[100] animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    {categories.length > 0 ? categories.map((cat) => (
                      <Link 
                        key={cat.name}
                        to={`/category/${cat.name}`}
                        onClick={() => setShowCategoryMenu(false)}
                        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                      >
                        <div className="w-10 h-10 bg-slate-50 group-hover:bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all shadow-sm group-hover:shadow-md">
                          <i className={`fa-solid ${cat.icon} text-lg`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{cat.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold line-clamp-1">{cat.description}</p>
                        </div>
                      </Link>
                    )) : (
                      <p className="col-span-2 text-[10px] font-bold text-slate-400 text-center py-4">Đang tải danh mục...</p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Khám phá thế giới sách</p>
                    <Link to="/category/Tất cả sách" className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Xem tất cả</Link>
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
                className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all relative py-1
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
        <div className={`relative flex-1 hidden md:block transition-all duration-700 ${isSearchFocused ? 'max-w-xl' : 'max-w-md'}`}>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Tìm tên sách, tác giả hoặc ISBN..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full py-3.5 pl-12 pr-6 rounded-2xl text-[11px] font-bold outline-none transition-all duration-500 border ${
                isSearchFocused 
                ? 'bg-white border-indigo-200 ring-[6px] ring-indigo-500/5 shadow-2xl shadow-indigo-200/50' 
                : 'bg-slate-100/50 border-transparent hover:bg-slate-100 hover:border-slate-200'
              }`}
            />
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-500 ${isSearchFocused ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
              {isSearchFocused ? (
                <i className="fa-solid fa-wand-magic-sparkles text-sm animate-pulse"></i>
              ) : (
                <i className="fa-solid fa-magnifying-glass text-sm"></i>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          
          <div className="flex items-center p-1 bg-slate-100/50 rounded-2xl">
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

            {/* Cart Toggle */}
            <button 
              onClick={onOpenCart} 
              className="w-10 h-10 rounded-xl bg-white text-slate-600 hover:text-indigo-600 shadow-sm transition-all relative flex items-center justify-center group active:scale-90"
            >
              <i className="fa-solid fa-bag-shopping text-[16px] group-hover:scale-110 transition-transform"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white px-1 shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
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
                  <p className="text-[10px] font-black text-slate-900 leading-none mb-1">{user.name}</p>
                  <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest leading-none">{user.isAdmin ? 'Quản trị viên' : 'Thành viên'}</p>
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
                  className="absolute top-full right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-[100] animate-fadeIn"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-5 py-3 border-b border-slate-50 mb-2">
                    <p className="text-[11px] font-black text-slate-900 truncate uppercase mt-1 tracking-tight">{user.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold truncate tracking-widest">{user.email}</p>
                  </div>
                  <div className="px-2">
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl transition-all group">
                      <div className="w-8 h-8 bg-slate-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center transition-all">
                        <i className="fa-regular fa-circle-user text-base opacity-70 group-hover:opacity-100"></i>
                      </div>
                      Hồ sơ của bạn
                    </Link>
                    <Link to="/my-orders" className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl transition-all group">
                      <div className="w-8 h-8 bg-slate-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center transition-all">
                        <i className="fa-regular fa-file-lines text-base opacity-70 group-hover:opacity-100"></i>
                      </div>
                      Quản lý đơn hàng
                    </Link>
                    {user.isAdmin && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group">
                        <div className="w-8 h-8 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-all">
                          <i className="fa-solid fa-chart-pie text-base"></i>
                        </div>
                        Trang Quản lý
                      </Link>
                    )}
                    <div className="h-px bg-slate-50 my-2 mx-3"></div>
                    <button 
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-2xl transition-all text-left group"
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
              className="group relative px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">Khám phá ngay</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
