
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { CartItem } from '../types';
import { useAuth } from '../App';

interface HeaderProps {
  cartCount: number;
  cartItems: CartItem[];
  onOpenCart: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ cartCount, cartItems, onOpenCart, onSearch }) => {
  const [searchValue, setSearchValue] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, wishlist, setShowLoginModal, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(searchValue);
      if (location.pathname !== '/') navigate('/');
      (e.target as HTMLInputElement).blur();
    }
  };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Tủ sách', path: '/category/Tất cả sách' },
    { name: 'Ưu đãi', path: '/category/Kinh tế', highlight: true },
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${
        scrolled 
          ? 'h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' 
          : 'h-24 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-6 h-full flex items-center justify-between gap-8">
        
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-3 group">
            <div className={`transition-all duration-500 bg-slate-900 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/10 ${scrolled ? 'w-9 h-9' : 'w-12 h-12'}`}>
              <i className={`fa-solid fa-book-bookmark ${scrolled ? 'text-sm' : 'text-lg'}`}></i>
            </div>
            <span className={`font-black tracking-tighter text-slate-900 hidden sm:block transition-all duration-500 ${scrolled ? 'text-xl' : 'text-2xl'}`}>
              Digi<span className="text-indigo-600">Book</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative py-1
                  ${location.pathname === link.path ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}
                  ${link.highlight ? 'text-rose-500' : ''}
                `}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 rounded-full transition-all duration-300 ${location.pathname === link.path ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: Search Bar - Pill Design */}
        <div className={`relative flex-1 hidden md:block transition-all duration-500 ${isSearchFocused ? 'max-w-xl' : 'max-w-md'}`}>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Tìm kiếm tác phẩm, tác giả..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full py-3 pl-12 pr-6 rounded-2xl text-xs font-bold outline-none transition-all duration-300 border ${
                isSearchFocused 
                ? 'bg-white border-indigo-200 ring-4 ring-indigo-50 shadow-lg' 
                : 'bg-slate-100/50 border-transparent hover:bg-slate-100'
              }`}
            />
            <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isSearchFocused ? 'text-indigo-600' : 'text-slate-400'} text-xs`}></i>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          
          {/* Wishlist Icon - Tooltip style */}
          <Link 
            to="/wishlist" 
            className="w-11 h-11 rounded-2xl text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center relative group"
          >
            <i className="fa-regular fa-heart text-lg"></i>
            {wishlist.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            )}
            <span className="absolute top-full mt-2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Yêu thích</span>
          </Link>

          {/* Cart Toggle */}
          <button 
            onClick={onOpenCart} 
            className="w-11 h-11 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 relative flex items-center justify-center group active:scale-95"
          >
            <i className="fa-solid fa-bag-shopping text-sm group-hover:rotate-12 transition-transform"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white px-1">
                {cartCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Profile Section */}
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 rounded-2xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100"
              >
                <div className="text-right hidden xl:block">
                  <p className="text-[11px] font-black text-slate-900 leading-none">{user.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Thành viên</p>
                </div>
                <img 
                  src={user.avatar} 
                  className="w-9 h-9 rounded-xl shadow-sm border border-white object-cover" 
                  alt={user.name} 
                  referrerPolicy="no-referrer"
                />
              </button>

              {showUserMenu && (
                <div 
                  className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-4 animate-fadeIn overflow-hidden z-[100]"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-6 py-3 border-b border-slate-50 mb-2">
                    <p className="text-xs font-black text-slate-900 mb-0.5">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                  </div>
                  <div className="px-2">
                    <Link to="/profile" className="flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all">
                      <i className="fa-solid fa-user-circle text-sm opacity-50"></i> Thông tin cá nhân
                    </Link>
                    <Link to="/my-orders" className="flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all">
                      <i className="fa-solid fa-receipt text-sm opacity-50"></i> Đơn hàng của tôi
                    </Link>
                    <Link to="/wishlist" className="flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all">
                      <i className="fa-solid fa-heart text-sm opacity-50"></i> Danh sách yêu thích
                    </Link>
                    <div className="h-px bg-slate-50 my-2 mx-4"></div>
                    <button 
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <i className="fa-solid fa-right-from-bracket text-sm opacity-50"></i> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              Tham gia
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
