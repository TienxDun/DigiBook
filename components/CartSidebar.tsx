
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { useAuth } from '../AuthContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, items, onRemove, onUpdateQty }) => {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
    } else {
      onClose();
      navigate('/checkout');
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white/80 backdrop-blur-3xl shadow-2xl z-[70] transition-transform duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-white/20`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Giỏ hàng của bạn</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <i className="fa-solid fa-bag-shopping text-4xl text-slate-200"></i>
              </div>
              <h3 className="font-extrabold text-slate-900 mb-2 text-xl uppercase tracking-tight">Giỏ hàng đang trống</h3>
              <p className="text-slate-400 text-sm max-w-[240px] leading-relaxed">Có vẻ như bạn chưa thêm cuốn sách nào vào giỏ hàng của mình.</p>
              <button 
                onClick={onClose}
                className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-extrabold uppercase tracking-premium text-micro hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                Khám phá ngay
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-50">
                  <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-extrabold text-slate-900 line-clamp-1 text-sm">{item.title}</h4>
                    <button onClick={() => onRemove(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                  <p className="text-slate-400 text-xs mb-3 font-medium">{item.author}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-slate-100 rounded-xl bg-slate-50 px-2 py-1 gap-3">
                      <button onClick={() => onUpdateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><i className="fa-solid fa-minus text-[10px]"></i></button>
                      <span className="text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><i className="fa-solid fa-plus text-[10px]"></i></button>
                    </div>
                    <span className="font-extrabold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 border-t border-slate-100 bg-slate-50/50">
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-slate-500 text-micro font-bold uppercase tracking-premium">
                <span>Tạm tính</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-slate-900 text-xl font-extrabold pt-4 border-t border-slate-200 uppercase tracking-tight">
                <span>Tổng tiền</span>
                <span className="text-indigo-600">{formatPrice(total)}</span>
              </div>
            </div>
            <button 
              onClick={handleCheckoutClick}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-extrabold text-micro uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95"
            >
              Thanh toán ngay
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
