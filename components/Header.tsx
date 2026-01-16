
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { CartItem } from '../types';
import { useAuth } from '../AuthContext';

interface HeaderProps {
  cartCount: number;
  cartItems: CartItem[];
  onOpenCart: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ cartCount, cartItems, onOpenCart, onSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, wishlist, logout, setShowLoginModal } = useAuth();
  
  const [searchValue, setSearchValue] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${
        scrolled 
          ? 'h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' 
          : 'h-20 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="w-[92%] xl:w-[60%] mx-auto px-4 h-full flex items-center justify-between gap-6">
        
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group" onClick={() => window.location.reload()}>
            <div className={`transition-all duration-500 bg-slate-900 group-hover:bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-slate-900/10 ${scrolled ? 'w-8 h-8' : 'w-10 h-10'}`}>
              <i className={`fa-solid fa-book-bookmark ${scrolled ? 'text-xs' : 'text-base'}`}></i>
            </div>
            <span className={`font-black tracking-tighter text-slate-900 hidden sm:block transition-all duration-500 ${scrolled ? 'text-lg' : 'text-xl'}`}>
              Digi<span className="text-indigo-600">Book</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all relative py-1
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
        <div className={`relative flex-1 hidden md:block transition-all duration-500 ${isSearchFocused ? 'max-w-lg' : 'max-w-sm'}`}>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Tìm kiếm tác phẩm..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full py-2.5 pl-10 pr-5 rounded-xl text-[11px] font-bold outline-none transition-all duration-300 border ${
                isSearchFocused 
                ? 'bg-white border-indigo-200 ring-4 ring-indigo-50 shadow-lg' 
                : 'bg-slate-100/50 border-transparent hover:bg-slate-100'
              }`}
            />
            <i className={`fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isSearchFocused ? 'text-indigo-600' : 'text-slate-400'} text-[10px]`}></i>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          
          {/* Wishlist Icon */}
          <Link 
            to="/wishlist" 
            className="w-10 h-10 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center relative group"
          >
            <i className="fa-regular fa-heart text-lg"></i>
            {wishlist.length > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white"></span>
            )}
          </Link>

          {/* Cart Toggle */}
          <button 
            onClick={onOpenCart} 
            className="w-10 h-10 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10 relative flex items-center justify-center group active:scale-95"
          >
            <i className="fa-solid fa-cart-shopping text-sm"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white px-0.5">
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
                className="flex items-center gap-3 p-1 rounded-xl transition-all hover:bg-slate-50"
              >
                <div className="text-right hidden xl:block">
                  <p className="text-[10px] font-black text-slate-900 leading-none">{user.name}</p>
                </div>
                <img 
                  src={user.avatar} 
                  className="w-8 h-8 rounded-lg shadow-sm object-cover" 
                  alt={user.name} 
                  referrerPolicy="no-referrer"
                />
              </button>

              {showUserMenu && (
                <div 
                  className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100]"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black text-slate-900 truncate">{user.name}</p>
                    <p className="text-[9px] text-slate-400 font-medium truncate">{user.email}</p>
                  </div>
                  <div className="px-1">
                    <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all">
                      <i className="fa-solid fa-user-circle opacity-50"></i> HS Cá nhân
                    </Link>
                    <Link to="/my-orders" className="flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all">
                      <i className="fa-solid fa-receipt opacity-50"></i> Đơn hàng
                    </Link>
                    {user.email === 'admin@gmail.com' && (
                      <Link to="/admin" className="flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <i className="fa-solid fa-gauge-high"></i> Admin
                      </Link>
                    )}
                    <button 
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-lg transition-all text-left"
                    >
                      <i className="fa-solid fa-right-from-bracket opacity-50"></i> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
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
