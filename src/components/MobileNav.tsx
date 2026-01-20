
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 z-[100] lg:hidden safe-bottom shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-[5rem] px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => {
                if (item.path === '/') onRefreshData?.();
              }}
              className={`flex flex-col items-center justify-center w-full h-full transition-all relative active:scale-95 ${isActive ? item.color : 'text-slate-400'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? `${item.bg} shadow-sm scale-110` : 'hover:bg-slate-50'}`}>
                <i className={`fa-solid ${item.icon} ${isActive ? 'text-lg' : 'text-base opacity-60'}`}></i>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-0.5'}`}>{item.label}</span>
              {isActive && (
                <span className={`absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 ${item.color.replace('text', 'bg')} rounded-b-full shadow-lg`}></span>
              )}
            </Link>
          );
        })}
        
        <button 
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center w-full h-full transition-all relative group active:scale-95"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${cartCount > 0 ? 'bg-amber-50 shadow-sm' : 'bg-slate-50 opacity-60'}`}>
            <div className="relative">
              <i className={`fa-solid fa-bag-shopping text-base ${cartCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}></i>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold border-2 border-white shadow-md">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest mt-1 transition-all ${cartCount > 0 ? 'text-amber-600 opacity-100' : 'text-slate-400 opacity-40'}`}>Giỏ hàng</span>
        </button>

        <button 
          onClick={() => user ? null : setShowLoginModal(true)}
          className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95`}
        >
          {user ? (
            <Link to="/profile" className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl p-0.5 border-2 border-indigo-100 overflow-hidden shadow-sm hover:border-indigo-500 transition-all">
                <img src={user.avatar} className="w-full h-full object-cover rounded-xl" alt="" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-indigo-600">Tôi</span>
            </Link>
          ) : (
            <div className="flex flex-col items-center group">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-all">
                <i className="fa-solid fa-user text-base text-slate-400 group-hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-all"></i>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-slate-400 opacity-40 group-hover:opacity-100 transition-all">Tài khoản</span>
            </div>
          )}
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
