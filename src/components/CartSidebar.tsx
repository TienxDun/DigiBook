
import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const FREE_SHIPPING_THRESHOLD = 500000;

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.includes(item.id)), 
  [items, selectedIds]);

  const subtotal = useMemo(() => 
    selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0), 
  [selectedItems]);

  const isAllSelected = useMemo(() => 
    items.length > 0 && selectedIds.length === items.length, 
  [items, selectedIds]);

  const shippingProgress = useMemo(() => {
    return Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  }, [subtotal]);

  const remainingForFreeShipping = useMemo(() => {
    return Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  }, [subtotal]);

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
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Ultra Modern Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] cursor-crosshair"
            />
            
            {/* Premium Sidebar Design */}
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 shadow-[0_0_50px_rgba(0,0,0,0.1)] z-[70] flex flex-col border-l border-white/20 overflow-hidden"
            >
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/5 blur-[120px] rounded-full"></div>
              </div>

              {/* Header Section */}
              <div className="relative z-10 flex flex-col shrink-0">
                <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-indigo-500 decoration-4 underline-offset-4">Giỏ hàng</h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                      {items.length} tác phẩm
                    </p>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:rotate-90 active:scale-90"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                </div>

                {/* Free Shipping Progress Indicator: More Compact */}
                {items.length > 0 && (
                  <div className="px-6 pb-2">
                    <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white shadow-sm space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        {remainingForFreeShipping > 0 ? (
                          <span className="text-slate-500 italic">Thiếu {formatPrice(remainingForFreeShipping)} để Freeship</span>
                        ) : (
                          <span className="text-emerald-500 italic">Đã được Freeship!</span>
                        )}
                        <i className={`fa-solid ${remainingForFreeShipping > 0 ? 'fa-truck-fast text-indigo-500 animate-pulse' : 'fa-circle-check text-emerald-500'}`}></i>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${shippingProgress}%` }}
                          className={`h-full transition-colors duration-500 ${shippingProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Toolbar: Slimmer */}
              {items.length > 0 && (
                <div className="px-6 py-1.5 relative z-10 flex items-center justify-between shrink-0">
                  <button 
                    onClick={() => onToggleAll(!isAllSelected)}
                    className="flex items-center gap-2 group"
                  >
                    <div className={`w-3.5 h-3.5 rounded border transition-all flex items-center justify-center ${
                        isAllSelected ? 'bg-slate-900 border-slate-900' : 'border-slate-300'
                      }`}
                    >
                      {isAllSelected && <i className="fa-solid fa-check text-[7px] text-white"></i>}
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900">
                      Chọn tất cả
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => items.forEach(item => onRemove(item.id))}
                    className="text-[9px] font-bold text-rose-500/60 uppercase tracking-widest transition-colors hover:text-rose-600"
                  >
                    Làm trống
                  </button>
                </div>
              )}

              {/* Main List Area: Taking ~80% height by compacting others */}
              <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 no-scrollbar relative z-10 min-h-0">
                <AnimatePresence initial={false} mode="popLayout">
                  {items.length === 0 ? (
                    <motion.div 
                      key="empty-cart"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center pb-20"
                    >
                      <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 relative group">
                        <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <i className="fa-solid fa-basket-shopping text-3xl text-slate-200 group-hover:text-indigo-500 transition-colors"></i>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Túi trống rỗng</h3>
                      <p className="text-slate-400 text-xs font-medium max-w-[200px] leading-relaxed mb-8">
                        Hãy chọn cho mình những tri thức mới mẻ từ kho sách của chúng tôi.
                      </p>
                      <button 
                        onClick={onClose}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                      >
                        Khám phá ngay
                      </button>
                    </motion.div>
                  ) : (
                    items.map((item, idx) => (
                      <motion.div 
                        layout
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative flex gap-4 bg-white hover:bg-slate-50/50 p-2 rounded-2xl transition-all duration-300"
                      >
                        {/* Compact Image with Checkbox Overlay */}
                        <div className="relative w-16 h-24 shrink-0">
                          <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50">
                            <img 
                              src={item.cover} 
                              alt={item.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                          </div>
                          <button 
                            onClick={() => onToggleSelection(item.id)}
                            className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all ${
                              selectedIds.includes(item.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-transparent'
                            }`}
                          >
                            <i className="fa-solid fa-check text-[7px]"></i>
                          </button>
                        </div>

                        {/* Clean Content Area */}
                        <div className="flex-1 flex flex-col min-w-0 py-0.5">
                          <div className="flex justify-between items-start mb-1">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.title}</h4>
                              <p className="text-[10px] text-slate-400 font-medium truncate italic">{item.author}</p>
                            </div>
                            <button 
                              onClick={() => onRemove(item.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all ml-2"
                            >
                              <i className="fa-solid fa-trash-can text-[10px]"></i>
                            </button>
                          </div>

                          {/* Price & Badges Spacer */}
                          <div className="flex items-center gap-2 mb-2">
                             {item.badge && (
                               <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[7px] font-black uppercase tracking-tighter rounded">
                                 {item.badge}
                               </span>
                             )}
                             {item.stockQuantity <= 5 && (
                               <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[7px] font-black uppercase tracking-tighter rounded">
                                 Chỉ còn {item.stockQuantity}
                               </span>
                             )}
                          </div>

                          {/* Action Bar: Simplified */}
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center bg-slate-100/50 rounded-lg p-0.5 border border-slate-100">
                              <button 
                                onClick={() => onUpdateQty(item.id, -1)} 
                                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-900"
                              >
                                <i className="fa-solid fa-minus text-[7px]"></i>
                              </button>
                              <span className="text-[11px] font-black text-slate-700 w-5 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => onUpdateQty(item.id, 1)} 
                                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-900"
                              >
                                <i className="fa-solid fa-plus text-[7px]"></i>
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-900 text-sm tracking-tight">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Convenient Consolidated Footer */}
              {items.length > 0 && (
                <div className="p-6 bg-white border-t border-slate-100 shrink-0 z-20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tổng cộng</span>
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">
                        {formatPrice(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 25000))}
                      </span>
                    </div>
                    <div className="text-right">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${subtotal >= FREE_SHIPPING_THRESHOLD ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                        {subtotal >= FREE_SHIPPING_THRESHOLD ? 'Freeship' : '+25k Ship'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckoutClick}
                    disabled={selectedItems.length === 0}
                    className="w-full group relative h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] hover:bg-indigo-600 transition-all duration-300 shadow-xl shadow-slate-200 flex items-center justify-between px-6 active:scale-95 disabled:bg-slate-50 disabled:text-slate-200 disabled:shadow-none overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    <span>
                      {selectedItems.length > 0 ? `Thanh toán (${selectedItems.length})` : 'Chọn sản phẩm'}
                    </span>
                    <i className="fa-solid fa-chevron-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                  </button>
                  
                  <p className="text-center text-[9px] text-slate-300 mt-3 font-medium uppercase tracking-[0.3em] flex items-center justify-center gap-1.5">
                    <i className="fa-solid fa-shield-halved text-emerald-500/40"></i>
                    Thanh toán an toàn & bảo mật
                  </p>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartSidebar;



