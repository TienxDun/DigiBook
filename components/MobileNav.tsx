
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const MobileNav: React.FC<{ cartCount: number; onOpenCart: () => void; onRefreshData?: () => void }> = ({ 
  cartCount, 
  onOpenCart, 
  onRefreshData 
}) => {
  const location = useLocation();
  const { user, setShowLoginModal } = useAuth();

  if (location.pathname.startsWith('/admin')) return null;

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: 'fa-house', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { path: '/category/Tất cả sách', label: 'Khám phá', icon: 'fa-compass', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { path: '/wishlist', label: 'Yêu thích', icon: 'fa-heart', color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 z-[100] lg:hidden safe-bottom shadow-[0_-15px_50px_-15px_rgba(0,0,0,0.12)]">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => {
                if (item.path === '/') onRefreshData?.();
              }}
              className={`flex flex-col items-center justify-center w-full h-full transition-all relative ${isActive ? item.color : 'text-slate-400'}`}
            >
              <div className={`w-11 h-11 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 ${isActive ? `${item.bg} shadow-sm scale-110` : 'hover:bg-slate-50'}`}>
                <i className={`fa-solid ${item.icon} ${isActive ? 'text-xl' : 'text-lg opacity-60'}`}></i>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-2 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>{item.label}</span>
              {isActive && (
                <span className={`absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1.5 ${item.color.replace('text', 'bg')} rounded-b-full shadow-lg`}></span>
              )}
            </Link>
          );
        })}
        
        <button 
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center w-full h-full transition-all relative group"
        >
          <div className={`w-11 h-11 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 ${cartCount > 0 ? 'bg-amber-50 shadow-sm' : 'bg-slate-50 opacity-60'}`}>
            <div className="relative">
              <i className={`fa-solid fa-bag-shopping text-lg ${cartCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}></i>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-white text-[9px] flex items-center justify-center rounded-full font-black border-2 border-white shadow-md">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-2 transition-all ${cartCount > 0 ? 'text-amber-600 opacity-100' : 'text-slate-400 opacity-40'}`}>Giỏ hàng</span>
        </button>

        <button 
          onClick={() => user ? null : setShowLoginModal(true)}
          className={`flex flex-col items-center justify-center w-full h-full transition-all`}
        >
          {user ? (
            <Link to="/profile" className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-[1.2rem] p-0.5 border-2 border-indigo-100 overflow-hidden shadow-sm hover:border-indigo-500 transition-all">
                <img src={user.avatar} className="w-full h-full object-cover rounded-[1rem]" alt="" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] mt-2 text-indigo-600">Tôi</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center group">
              <div className="w-11 h-11 rounded-[1.2rem] bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-all">
                <i className="fa-solid fa-user text-lg text-slate-400 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-all"></i>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em] mt-2 text-slate-400 opacity-40 group-hover:opacity-100 transition-all">Tài khoản</span>
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
