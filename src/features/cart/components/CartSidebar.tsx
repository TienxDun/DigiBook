import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';
import { CartItem } from '@/shared/types';

// --- Helper Functions ---
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// --- Sub-Components ---

const EmptyState = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="h-full flex flex-col items-center justify-center p-8 text-center"
  >
    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
      <i className="fa-solid fa-cart-shopping text-3xl text-slate-300"></i>
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">Giỏ hàng của bạn đang trống</h3>
    <p className="text-slate-500 text-sm mb-8 max-w-[200px]">
      Có vẻ như bạn chưa thêm cuốn sách nào vào đây cả.
    </p>
    <button
      onClick={onClose}
      className="px-8 py-3 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
    >
      Tiếp tục mua sắm
    </button>
  </motion.div>
);

const ShippingProgressBar = ({ subtotal, threshold }: { subtotal: number, threshold: number }) => {
  const progress = Math.min((subtotal / threshold) * 100, 100);
  const remaining = Math.max(threshold - subtotal, 0);

  return (
    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
      <div className="flex justify-between items-center mb-2 text-xs">
        {remaining > 0 ? (
          <span className="text-slate-600 font-medium">
            Mua thêm <span className="text-indigo-600 font-bold">{formatPrice(remaining)}</span> để được Freeship
          </span>
        ) : (
          <span className="text-emerald-600 font-medium flex items-center gap-1.5">
            <i className="fa-solid fa-check-circle"></i>
            Đơn hàng của bạn đã được Freeship
          </span>
        )}
        <span className="text-slate-400 font-semibold">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
        />
      </div>
    </div>
  );
};

interface CartItemRowProps {
  item: CartItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  navigate: any;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ 
  item, 
  isSelected, 
  onToggle, 
  onUpdateQty, 
  onRemove,
  navigate 
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0, padding: 0 }}
      className={`group relative flex gap-4 p-4 transition-colors border-b border-slate-50 last:border-0 ${isSelected ? 'bg-indigo-50/30' : 'bg-white hover:bg-slate-50/50'}`}
    >
      {/* Selection Checkbox */}
      <div className="flex items-center">
        <button
          onClick={() => onToggle(item.id)}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${
            isSelected 
            ? 'bg-indigo-600 border-indigo-600 text-white' 
            : 'border-slate-300 hover:border-indigo-400 text-transparent'
          }`}
        >
          <i className="fa-solid fa-check text-xs"></i>
        </button>
      </div>

      {/* Image */}
      <div 
        className="w-20 aspect-[3/4] rounded-lg overflow-hidden shadow-sm shrink-0 cursor-pointer bg-slate-100"
        onClick={() => navigate(`/book/${item.id}`)}
      >
        <img 
          src={item.cover} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start gap-3">
             <h4 
                className="font-medium text-slate-900 text-sm leading-snug line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => navigate(`/book/${item.id}`)}
             >
                {item.title}
             </h4>
             <button
               onClick={() => onRemove(item.id)}
               className="text-slate-300 hover:text-rose-500 transition-colors px-1"
               title="Xóa sản phẩm"
             >
               <i className="fa-solid fa-xmark"></i>
             </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">{item.author}</p>
        </div>

        <div className="flex items-end justify-between mt-3">
           {/* Price */}
           <div className="font-semibold text-slate-900 text-sm">
             {formatPrice(item.price)}
           </div>

           {/* Quantity Control */}
           <div className="flex items-center bg-white border border-slate-200 rounded-lg h-8 shadow-sm">
             <button
               onClick={() => onUpdateQty(item.id, -1)}
               className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-l-lg transition-colors"
               disabled={item.quantity <= 1}
             >
               <i className="fa-solid fa-minus text-[10px]"></i>
             </button>
             <span className="w-8 text-center text-xs font-semibold text-slate-700 select-none">
               {item.quantity}
             </span>
             <button
               onClick={() => onUpdateQty(item.id, 1)}
               className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-r-lg transition-colors"
             >
               <i className="fa-solid fa-plus text-[10px]"></i>
             </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Component ---
const CartSidebar: React.FC = () => {
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

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const FREE_SHIPPING_THRESHOLD = 500000;

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.includes(item.id)), 
    [items, selectedIds]
  );

  const subtotal = useMemo(() => 
    selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0), 
    [selectedItems]
  );

  const isAllSelected = useMemo(() => 
    items.length > 0 && selectedIds.length === items.length, 
    [items, selectedIds]
  );

  const handleCheckoutClick = () => {
    if (selectedItems.length === 0) return;
    if (!user) {
      setShowLoginModal(true);
    } else {
      onClose();
      navigate('/checkout');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140]"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[150] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                 <h2 className="text-xl font-bold text-slate-900">Giỏ hàng</h2>
                 <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                   {items.length}
                 </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {items.length > 0 ? (
               <>
                {/* Shipping Progress */}
                <ShippingProgressBar subtotal={subtotal} threshold={FREE_SHIPPING_THRESHOLD} />

                {/* Toolbar */}
                <div className="px-6 py-3 flex items-center justify-between bg-slate-50/30 border-b border-slate-100/50">
                   <button 
                     onClick={() => onToggleAll(!isAllSelected)}
                     className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                   >
                     <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                       isAllSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                     }`}>
                       {isAllSelected && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                     </div>
                     Chọn tất cả
                   </button>
                   <button 
                     onClick={() => items.forEach(item => onRemove(item.id))}
                     className="text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5"
                   >
                     <i className="fa-regular fa-trash-can"></i> Xóa hết
                   </button>
                </div>

                {/* Item List */}
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                  <AnimatePresence mode='popLayout'>
                   {items.map(item => (
                     <CartItemRow 
                       key={item.id}
                       item={item}
                       isSelected={selectedIds.includes(item.id)}
                       onToggle={onToggleSelection}
                       onUpdateQty={onUpdateQty}
                       onRemove={onRemove}
                       navigate={navigate}
                     />
                   ))}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                   <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                         <span className="text-slate-500 text-sm">Tạm tính</span>
                         <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                         <span className="font-bold text-slate-900 text-lg">Tổng cộng</span>
                         <div className="text-right">
                           <span className="block text-2xl font-bold text-indigo-600 leading-none">
                             {formatPrice(subtotal)}
                           </span>
                           <span className="text-[10px] text-slate-400 font-medium">Đã bao gồm VAT</span>
                         </div>
                      </div>
                   </div>

                   <button
                     onClick={handleCheckoutClick}
                     disabled={selectedItems.length === 0}
                     className="w-full py-4 px-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                   >
                     <span>Thanh toán ngay</span>
                     <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                   </button>
                </div>
               </>
            ) : (
              <EmptyState onClose={onClose} />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;

