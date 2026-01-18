
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { useAuth } from '../AuthContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const CartSidebar: React.FC<CartSidebarProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  selectedIds,
  onToggleSelection,
  onToggleAll,
  onRemove, 
  onUpdateQty 
}) => {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  
  const selectedItems = items.filter(item => selectedIds.includes(item.id));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
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
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Giỏ hàng của bạn</h2>
            {items.length > 0 && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Đã chọn {selectedIds.length}/{items.length} sản phẩm
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {items.length > 0 && (
          <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => onToggleAll(!isAllSelected)}
                className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                  isAllSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white group-hover:border-indigo-400'
                }`}
              >
                {isAllSelected && <i className="fa-solid fa-check text-[10px] text-white"></i>}
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chọn tất cả</span>
            </label>
            <button 
              onClick={() => items.forEach(item => onRemove(item.id))}
              className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
            >
              Xóa tất cả
            </button>
          </div>
        )}

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
              <div key={item.id} className={`flex gap-4 group transition-opacity ${selectedIds.includes(item.id) ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex items-center">
                  <div 
                    onClick={() => onToggleSelection(item.id)}
                    className={`w-5 h-5 rounded-md border-2 cursor-pointer transition-all flex items-center justify-center flex-shrink-0 ${
                      selectedIds.includes(item.id) ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-400'
                    }`}
                  >
                    {selectedIds.includes(item.id) && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                  </div>
                </div>
                
                <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-50 relative">
                  <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  {!selectedIds.includes(item.id) && <div className="absolute inset-0 bg-white/40 backdrop-grayscale-[0.5]"></div>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-extrabold text-slate-900 line-clamp-2 text-[13px] leading-snug uppercase tracking-tight pr-2">{item.title}</h4>
                    <button onClick={() => onRemove(item.id)} className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                  <p className="text-slate-400 text-[10px] mb-3 font-bold uppercase tracking-widest">{item.author}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center border border-slate-100 rounded-xl bg-slate-50 p-1 gap-2">
                      <button onClick={() => onUpdateQty(item.id, -1)} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all"><i className="fa-solid fa-minus text-[10px]"></i></button>
                      <span className="text-xs font-black text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, 1)} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all"><i className="fa-solid fa-plus text-[10px]"></i></button>
                    </div>
                    <span className="font-black text-slate-900 text-sm">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-8 border-t border-slate-100 bg-slate-50/50">
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <span>Tạm tính ({selectedItems.length} món)</span>
                <span className="text-slate-600">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-end border-t border-slate-200 pt-5">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Tổng cộng</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatPrice(subtotal)}</span>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                      <i className="fa-solid fa-shield-check"></i> Bảo mật thanh toán
                   </p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleCheckoutClick}
              disabled={selectedItems.length === 0}
              className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
                selectedItems.length > 0 
                  ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {selectedItems.length === 0 ? 'Vui lòng chọn sản phẩm' : `Thanh toán (${selectedItems.length})`}
              <i className="fa-solid fa-arrow-right-long mr-1"></i>
            </button>
            <p className="text-[10px] text-slate-400 font-bold text-center mt-6 uppercase tracking-widest opacity-60">
               Giao hàng dự kiến: 2-3 ngày làm việc
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;
