
import React, { useMemo } from 'react';
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
  
  // Apply useMemo for performance and consistency with premium design patterns
  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.includes(item.id)), 
  [items, selectedIds]);

  const subtotal = useMemo(() => 
    selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0), 
  [selectedItems]);

  const isAllSelected = useMemo(() => 
    items.length > 0 && selectedIds.length === items.length, 
  [items, selectedIds]);

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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
            />
            
            {/* Premium Sidebar Design */}
            <motion.aside 
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white/80 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.1)] z-[70] flex flex-col border-l border-white/40 overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[100px] -ml-32 -mb-32 rounded-full pointer-events-none"></div>

              {/* Header: Clean & Bold */}
              <div className="px-8 pt-8 pb-6 flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Giỏ hàng</h2>
                  {items.length > 0 && (
                     <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-indigo-100 uppercase tracking-widest">
                          {items.length} tác phẩm
                        </span>
                        {selectedIds.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            Đã chọn {selectedIds.length}
                          </span>
                        )}
                     </div>
                  )}
                </div>
                <button 
                  onClick={onClose} 
                  className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all active:scale-90 group"
                >
                  <i className="fa-solid fa-xmark text-xl group-hover:rotate-90 transition-transform"></i>
                </button>
              </div>

              {/* Toolbar: Select All & Cleanup */}
              {items.length > 0 && (
                <div className="px-8 py-2 relative z-10 flex items-center justify-between">
                   <button 
                     onClick={() => onToggleAll(!isAllSelected)}
                     className="flex items-center gap-3 group px-4 py-2 rounded-xl bg-white/50 border border-white hover:border-indigo-100 transition-all active:scale-95"
                   >
                      <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${
                          isAllSelected ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-200 bg-white group-hover:border-indigo-400'
                        }`}
                      >
                        {isAllSelected && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                      </div>
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600">
                        {isAllSelected ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                      </span>
                   </button>
                   
                   <button 
                     onClick={() => items.forEach(item => onRemove(item.id))}
                     className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors p-2"
                   >
                     Dọn dẹp giỏ hàng
                   </button>
                </div>
              )}

              {/* Main List: Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar relative z-10">
                <AnimatePresence initial={false} mode="popLayout">
                  {items.length === 0 ? (
                    <motion.div 
                      key="empty-cart"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center pb-20"
                    >
                      <div className="relative mb-8">
                         <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                         <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center relative">
                            <i className="fa-solid fa-bag-shopping text-4xl text-indigo-500"></i>
                         </div>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Giỏ hàng đang trống</h3>
                      <p className="text-slate-400 text-sm font-medium max-w-[260px] leading-relaxed mb-10">
                        Có vẻ như bạn chưa chọn được cuốn sách ưng ý nào cho hành trình tri thức của mình.
                      </p>
                      <button 
                        onClick={onClose}
                        className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                      >
                        Khám phá kho sách
                      </button>
                    </motion.div>
                  ) : (
                    items.map((item, idx) => (
                      <motion.div 
                        layout
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        className={`group relative flex gap-5 bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 ${
                          selectedIds.includes(item.id) ? 'ring-2 ring-indigo-500/20' : 'opacity-70 grayscale-[0.3] hover:opacity-100 hover:grayscale-0'
                        }`}
                      >
                        {/* Checkbox Overlay */}
                        <div 
                           onClick={() => onToggleSelection(item.id)}
                           className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
                        >
                           <div className={`w-8 h-8 rounded-full border-4 border-white shadow-xl transition-all flex items-center justify-center ${
                             selectedIds.includes(item.id) ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-100 text-transparent'
                           }`}>
                             <i className="fa-solid fa-check text-[10px]"></i>
                           </div>
                        </div>

                        {/* Product Image */}
                        <div className="w-24 h-32 rounded-2xl overflow-hidden shadow-2xl border border-white/50 relative shrink-0 group-hover:rotate-1 transition-transform">
                           <img 
                             src={item.cover} 
                             alt={item.title} 
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                           <div className="space-y-1.5">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-black text-slate-900 text-[13px] leading-tight uppercase tracking-tight line-clamp-2 pr-4">{item.title}</h4>
                                 <button 
                                   onClick={() => onRemove(item.id)}
                                   className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center shrink-0 shadow-sm"
                                 >
                                   <i className="fa-solid fa-trash-can text-xs"></i>
                                 </button>
                              </div>
                              <div className="flex items-center flex-wrap gap-2">
                                 <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-indigo-500/30 rounded-full"></div>
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{item.author}</p>
                                 </div>
                                 
                                 {/* Sync Badges from Conventions & BookCard */}
                                 {item.badge && (
                                   <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 text-[8px] font-black uppercase tracking-tighter rounded-md flex items-center gap-1 border border-rose-500/10">
                                      <i className="fa-solid fa-crown text-[7px]"></i>
                                      {item.badge}
                                   </span>
                                 )}
                                 
                                 {item.stockQuantity <= 5 && item.stockQuantity > 0 && (
                                   <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-tighter rounded-md flex items-center gap-1 border border-amber-500/10">
                                      Chỉ còn {item.stockQuantity}
                                   </span>
                                 )}
                                 
                                 {item.stockQuantity === 0 && (
                                   <span className="px-2 py-0.5 bg-slate-500/10 text-slate-600 text-[8px] font-black uppercase tracking-tighter rounded-md flex items-center gap-1 border border-slate-500/10">
                                      Hết hàng
                                   </span>
                                 )}
                              </div>
                           </div>

                           <div className="flex items-end justify-between mt-4">
                              <div className="flex items-center bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100/50 gap-3">
                                 <button 
                                   onClick={() => onUpdateQty(item.id, -1)} 
                                   className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all active:scale-90"
                                 >
                                   <i className="fa-solid fa-minus text-[10px]"></i>
                                 </button>
                                 <span className="text-xs font-black text-slate-900 min-w-[20px] text-center tracking-tighter">{item.quantity}</span>
                                 <button 
                                   onClick={() => onUpdateQty(item.id, 1)} 
                                   className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all active:scale-90"
                                 >
                                   <i className="fa-solid fa-plus text-[10px]"></i>
                                 </button>
                              </div>
                              <div className="text-right">
                                 {item.originalPrice && item.originalPrice > item.price && (
                                   <p className="text-[10px] font-bold text-slate-300 line-through decoration-slate-300 leading-none mb-1">
                                     {formatPrice(item.originalPrice * item.quantity)}
                                   </p>
                                 )}
                                 <p className="font-black text-rose-600 text-xl tracking-tighter leading-none">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                           </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Checkout Footer: Premium Summary */}
              {items.length > 0 && (
                <div className="px-8 pb-10 pt-6 bg-white border-t border-slate-100 relative group/footer">
                  <div className="space-y-4 mb-8">
                     <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tạm tính ({selectedItems.length})</span>
                        <span className="text-sm font-bold text-slate-600">{formatPrice(subtotal)}</span>
                     </div>
                     <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Phí vận chuyển</span>
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Miễn phí</span>
                     </div>
                     
                     <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
                     
                     <div className="flex justify-between items-end pt-2 px-2">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Tổng thanh toán</span>
                           <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="text-right pb-1">
                           <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                              Ưu đãi VIP <i className="fa-solid fa-crown text-[8px]"></i>
                           </p>
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={handleCheckoutClick}
                    disabled={selectedItems.length === 0}
                    className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 transition-all duration-500 shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-200 disabled:shadow-none relative overflow-hidden group/btn"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                     {selectedItems.length > 0 ? (
                       <>
                         <span>Tiến tới thanh toán</span>
                         <i className="fa-solid fa-arrow-right-long group-hover/btn:translate-x-2 transition-transform"></i>
                       </>
                     ) : 'Hãy chọn sản phẩm'}
                  </button>
                  
                  <div className="mt-6 flex items-center justify-center gap-6 opacity-30">
                     <i className="fa-brands fa-cc-visa text-xl"></i>
                     <i className="fa-brands fa-cc-mastercard text-xl"></i>
                     <i className="fa-solid fa-shield-halved text-lg"></i>
                     <span className="text-[10px] font-black uppercase tracking-widest">Bảo mật 100%</span>
                  </div>
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


