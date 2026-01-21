
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

import { useBooks } from '../contexts/BookContext';
import { useCart } from '../contexts/CartContext';

const MobileNav: React.FC = () => {
  const { refreshData: onRefreshData } = useBooks();
  const { cartCount, setIsCartOpen, isCartOpen } = useCart();
  const onOpenCart = () => setIsCartOpen(true);
  const onCloseCart = () => setIsCartOpen(false);
  const location = useLocation();
  const currentPath = decodeURIComponent(location.pathname);
  const { user, setShowLoginModal } = useAuth();
  const [ripples, setRipples] = useState<{ [key: string]: boolean }>({});

  if (location.pathname.startsWith('/admin')) return null;

  const handleRipple = (key: string) => {
    setRipples(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setRipples(prev => ({ ...prev, [key]: false })), 600);
  };

  const navItems = [
    { path: '/', icon: 'fa-house', color: 'text-indigo-400', glow: 'bg-indigo-400/20', dropShadow: 'drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' },
    { path: '/category/Tất cả sách', icon: 'fa-compass', color: 'text-cyan-400', glow: 'bg-cyan-400/20', dropShadow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' },
    { path: '/wishlist', icon: 'fa-heart', color: 'text-rose-400', glow: 'bg-rose-400/20', dropShadow: 'drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]' },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] z-[100] lg:hidden safe-bottom px-2 py-2">
      <div className="flex justify-around items-center h-14 relative">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                handleRipple(item.path);
                if (item.path === '/') onRefreshData?.();
                if (isCartOpen) onCloseCart();
              }}
              className="flex-1 flex flex-col items-center justify-center h-full relative group"
            >
              <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-500 relative ${isActive ? `${item.glow} scale-110 shadow-[0_0_20px_rgba(0,0,0,0.2)]` : 'hover:bg-white/5'
                }`}>
                <i className={`fa-solid ${item.icon} text-xl transition-all duration-500 ${isActive ? `${item.color} ${item.dropShadow}` : 'text-slate-400 opacity-60'}`}></i>
                {ripples[item.path] && <span className="absolute inset-0 bg-white/10 rounded-2xl animate-ping opacity-0"></span>}
              </div>
            </Link>
          );
        })}

        <button
          onClick={() => {
            handleRipple('cart');
            onOpenCart();
          }}
          className="flex-1 flex flex-col items-center justify-center h-full relative group"
        >
          <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all duration-500 relative ${cartCount > 0 ? 'bg-amber-400/20 scale-110 shadow-[0_0_20px_rgba(0,0,0,0.3)]' : 'hover:bg-white/5'
            }`}>
            <div className="relative">
              <i className={`fa-solid fa-bag-shopping text-xl transition-all duration-500 ${cartCount > 0 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-slate-400 opacity-60'}`}></i>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 text-[9px] text-slate-900 flex items-center justify-center rounded-full font-black shadow-lg border-2 border-slate-900/20 animate-bounce">
                  {cartCount}
                </span>
              )}
            </div>
            {ripples['cart'] && <span className="absolute inset-0 bg-white/10 rounded-2xl animate-ping opacity-0"></span>}
          </div>
        </button>

        <button
          onClick={() => {
            if (!user) {
              handleRipple('user');
              setShowLoginModal(true);
            }
            if (isCartOpen) onCloseCart();
          }}
          className="flex-1 flex flex-col items-center justify-center h-full relative group"
        >
          {user ? (
            <Link to="/profile" onClick={() => { if (isCartOpen) onCloseCart(); }} className="flex flex-col items-center relative h-full justify-center w-full">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 ${location.pathname === '/profile' ? 'bg-indigo-400/20 scale-110 shadow-[0_0_20px_rgba(0,0,0,0.3)]' : 'hover:bg-white/5'}`}>
                <div className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all duration-500 ${location.pathname === '/profile' ? 'border-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'border-white/20 opacity-60'}`}>
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl hover:bg-white/5 transition-all duration-500" onClick={() => { setShowLoginModal(true); if (isCartOpen) onCloseCart(); }}>
              <i className="fa-solid fa-user text-xl text-slate-400 opacity-60"></i>
              {ripples['user'] && <span className="absolute inset-0 bg-white/10 rounded-2xl animate-ping opacity-0"></span>}
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
