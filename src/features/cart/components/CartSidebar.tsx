
import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';

interface CartSidebarProps { }

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const CartSidebar: React.FC<CartSidebarProps> = () => {
  const {
    isCartOpen: isOpen,
    setIsCartOpen,
    cart: items,
    selectedCartItemIds: selectedIds,
    toggleSelection: onToggleSelection,
    toggleAll: onToggleAll,
    removeFromCart: onRemove,
    updateQuantity: onUpdateQty
  } = useCart();
  const onClose = () => setIsCartOpen(false);
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
            {/* Backdrop - High Z-index to cover MobileNav */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[140]"
            />

            {/* Main Sidebar Container - Highest Z-index */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[150] flex flex-col overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-full h-96 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500 blur-[120px] rounded-full"></div>
                <div className="absolute top-0 right-1/2 w-64 h-64 bg-cyan-400 blur-[100px] rounded-full mix-blend-multiply"></div>
              </div>

              {/* Header */}
              <div className="relative z-10 px-6 pt-6 pb-4 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-xl">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase relative inline-block">
                    Giỏ hàng
                    <span className="text-4xl text-indigo-500/20 absolute -top-2 -right-6 select-none">.</span>
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                    {items.length} sản phẩm trong túi
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-[background-color,color,transform] flex items-center justify-center active:scale-95 active:rotate-90 duration-200"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              {/* Free Shipping Progress */}
              {items.length > 0 && (
                <div className="px-6 pb-4 relative z-10">
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50">
                    <div className="flex justify-between items-center mb-2">
                      {remainingForFreeShipping > 0 ? (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Mua thêm <span className="text-indigo-600">{formatPrice(remainingForFreeShipping)}</span> để Freeship
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
                          <i className="fa-solid fa-circle-check"></i>
                          Đã được Freeship
                        </span>
                      )}
                      <span className="text-[10px] font-black text-slate-300">
                        {Math.round(shippingProgress)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${shippingProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)] ${shippingProgress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'}`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tools */}
              {items.length > 0 && (
                <div className="px-6 py-2 flex items-center justify-between relative z-10 shrink-0 border-b border-slate-50">
                  <button
                    onClick={() => onToggleAll(!isAllSelected)}
                    className="flex items-center gap-2 group cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-md border transition-[background-color,border-color] flex items-center justify-center ${isAllSelected ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white group-hover:border-indigo-500'}`}>
                      {isAllSelected && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                      Chọn tất cả
                    </span>
                  </button>

                  <button
                    onClick={() => items.forEach(item => onRemove(item.id))}
                    className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center gap-1.5 px-2 py-1 hover:bg-rose-50 rounded-lg"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    Xóa hết
                  </button>
                </div>
              )}

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 relative z-10 no-scrollbar min-h-0 bg-white">
                <AnimatePresence initial={false} mode="popLayout">
                  {items.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col items-center justify-center pb-20 opacity-60"
                    >
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <i className="fa-solid fa-bag-shopping text-4xl text-slate-200"></i>
                      </div>
                      <p className="text-slate-900 font-bold text-sm uppercase tracking-widest mb-1">Giỏ hàng trống</p>
                      <p className="text-slate-400 text-xs">Hãy thêm vài cuốn sách hay vào nhé</p>
                    </motion.div>
                  ) : (
                    items.map((item, idx) => (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                        exit={{ opacity: 0, x: -50 }}
                        className={`group relative flex gap-4 p-3 rounded-3xl transition-all duration-300 ${selectedIds.includes(item.id) ? 'bg-indigo-50/50 ring-1 ring-indigo-500/20' : 'bg-slate-50 hover:bg-slate-100/80'}`}
                      >
                        {/* Selection Checkbox (Absolute) */}
                        <div className="absolute top-3 left-3 z-20">
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleSelection(item.id); }}
                            className={`w-5 h-5 rounded-full border shadow-sm flex items-center justify-center transition-[background-color,border-color,color,transform,opacity] ${selectedIds.includes(item.id) ? 'bg-indigo-500 border-indigo-500 text-white scale-110' : 'bg-white border-slate-200 text-transparent opacity-0 group-hover:opacity-100 hover:scale-110'}`}
                          >
                            <i className="fa-solid fa-check text-[10px]"></i>
                          </button>
                        </div>

                        {/* Image */}
                        <div
                          className="w-20 aspect-[2/3] rounded-2xl overflow-hidden shadow-sm shrink-0 cursor-pointer relative"
                          onClick={() => onToggleSelection(item.id)}
                        >
                          <img src={item.cover} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          {/* Overlay when selected */}
                          <div className={`absolute inset-0 bg-indigo-900/10 transition-opacity duration-300 ${selectedIds.includes(item.id) ? 'opacity-100' : 'opacity-0'}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col min-w-0 py-1">
                          <div className="mb-auto">
                            <div className="flex justify-between items-start gap-2">
                              <h4
                                className="font-bold text-sm text-slate-800 leading-snug line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors uppercase tracking-tight"
                                onClick={() => navigate(`/book/${item.id}`)}
                              >
                                {item.title}
                              </h4>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">{item.author}</p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.badge && <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-100 text-[9px] font-bold text-indigo-500 uppercase tracking-tighter shadow-sm">{item.badge}</span>}
                              {item.stockQuantity < 10 && <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-[9px] font-bold text-rose-500 uppercase tracking-tighter">Còn {item.stockQuantity}</span>}
                            </div>
                          </div>

                          {/* Actions & Price */}
                          <div className="flex items-end justify-between mt-3">
                            <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 p-0.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); onUpdateQty(item.id, -1); }}
                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-[color,background-color]"
                              >
                                <i className="fa-solid fa-minus text-[10px]"></i>
                              </button>
                              <span className="w-6 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); onUpdateQty(item.id, 1); }}
                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-[color,background-color]"
                              >
                                <i className="fa-solid fa-plus text-[10px]"></i>
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="font-black text-sm text-slate-900 tracking-tight">{formatPrice(item.price * item.quantity)}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                                className="text-[9px] font-bold text-slate-300 hover:text-rose-500 transition-colors underline decoration-dotted decoration-slate-300 hover:decoration-rose-500 mt-0.5"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-6 bg-white border-t border-slate-100 shrink-0 relative z-20 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tạm tính</span>
                      <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Giảm giá</span>
                      <span className="font-bold text-slate-900">0đ</span>
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Tổng cộng</span>
                        <span className="text-[9px] text-slate-400 font-medium mt-0.5">Đã bao gồm VAT</span>
                      </div>
                      <span className="text-2xl font-black text-indigo-600 tracking-tighter leading-none">{formatPrice(subtotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckoutClick}
                    disabled={selectedItems.length === 0}
                    className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 shadow-xl shadow-slate-200 hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden active:scale-95"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {selectedItems.length > 0 ? `Thanh toán (${selectedItems.length})` : 'Vui lòng chọn sản phẩm'}
                      <i className="fa-solid fa-arrow-right-long group-hover:translate-x-1 transition-transform"></i>
                    </span>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform origin-bottom"></div>
                  </button>
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

