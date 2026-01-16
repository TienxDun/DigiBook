
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const MobileNav: React.FC<{ cartCount: number, onOpenCart: () => void }> = ({ cartCount, onOpenCart }) => {
  const location = useLocation();
  const { user, setShowLoginModal } = useAuth();

  if (location.pathname.startsWith('/admin')) return null;

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: 'fa-house' },
    { path: '/category/Tất cả sách', label: 'Khám phá', icon: 'fa-compass' },
    { path: '/wishlist', label: 'Yêu thích', icon: 'fa-heart' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[100] lg:hidden safe-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex flex-col items-center justify-center w-full h-full transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <i className={`fa-solid ${item.icon} text-lg mb-1`}></i>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        
        <button 
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center w-full h-full text-slate-400 relative"
        >
          <div className="relative">
            <i className="fa-solid fa-bag-shopping text-lg mb-1"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">Giỏ hàng</span>
        </button>

        <button 
          onClick={() => user ? null : setShowLoginModal(true)}
          className={`flex flex-col items-center justify-center w-full h-full ${user ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          {user ? (
            <Link to="/my-orders" className="flex flex-col items-center">
              <img src={user.avatar} className="w-5 h-5 rounded-full border border-indigo-200 mb-1" alt="" />
              <span className="text-[10px] font-bold">Tôi</span>
            </Link>
          ) : (
            <>
              <i className="fa-solid fa-user text-lg mb-1"></i>
              <span className="text-[10px] font-bold">Tài khoản</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
