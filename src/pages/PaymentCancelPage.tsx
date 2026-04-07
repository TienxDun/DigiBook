import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/services/db';
import { useCart } from '@/features/cart';
import toast from '@/shared/utils/toast';

export default function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { addToCart } = useCart();
  
  const [status, setStatus] = useState<'processing' | 'restored' | 'error'>('processing');
  const processedRef = useRef(false);

  useEffect(() => {
    const handleCancellation = async () => {
      if (!orderId || processedRef.current) return;
      processedRef.current = true;

      try {
        console.log('[DEBUG] Starting cancellation flow for order:', orderId);
        // 1. Fetch order details to get items for restoration
        const order = await db.getOrderWithItems(orderId);
        console.log('[DEBUG] Fetched order:', order);

        // 2. Update order status to 'Đã hủy' (statusStep: 4)
        console.log('[DEBUG] Attempting to update order status to cancelled:', orderId);
        await db.updateOrderStatus(orderId, 'Đã hủy', 4);
        console.log('[DEBUG] Order status updated successfully');

        // 3. Restore items to cart (Secondary priority, but good for UX)
        if (order && order.items && order.items.length > 0) {
          console.log('[DEBUG] Restoring items to cart:', order.items.length);
          for (const item of order.items) {
            addToCart({
              id: item.bookId,
              title: item.title,
              price: item.priceAtPurchase || 0,
              quantity: item.quantity,
              cover: item.cover || ''
            });
          }
          toast.success('Đã khôi phục giỏ hàng của bạn');
        }

        setStatus('restored');
      } catch (error) {
        console.error('[DEBUG] Error during cancellation:', error);
        setStatus('error');
      }
    };

    handleCancellation();
  }, [orderId, addToCart]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-indigo-100">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px] animation-delay-2000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-xl w-full bg-white/70 backdrop-blur-3xl rounded-[2.5rem] p-8 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 ring-1 ring-black/[0.03] relative z-10 text-center"
      >
        <AnimatePresence mode="wait">
          {status === 'processing' ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <i className="fa-solid fa-rotate text-indigo-600 text-2xl animate-pulse"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Đang cập nhật trạng thái...</h2>
              <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                Chúng tôi đang cập nhật trạng thái đơn hàng và đưa các sản phẩm quay trở lại giỏ hàng của bạn.
              </p>
            </motion.div>
          ) : status === 'restored' ? (
            <motion.div 
              key="restored"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-orange-200 rotate-12">
                <i className="fa-solid fa-cart-shopping-fast text-white text-4xl"></i>
              </div>
              
              <div className="relative">
                <span className="absolute -top-6 -left-6 text-4xl opacity-20 rotate-[-15deg]">✨</span>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Đã hủy thanh toán</h2>
                <span className="absolute -bottom-2 -right-6 text-4xl opacity-20 rotate-[15deg]">✨</span>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-6 mb-8 border border-slate-100 text-left w-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <i className="fa-solid fa-shield-check"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Trạng thái đơn hàng: Đã hủy</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Đơn hàng của bạn đã được chuyển sang trạng thái đã hủy. Giỏ hàng đã được khôi phục đầy đủ để bạn có thể chọn phương thức khác.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => navigate('/cart')}
                  className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all duration-300 shadow-lg active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <i className="fa-solid fa-cart-shopping text-sm"></i>
                  Về giỏ hàng
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="px-8 py-4 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all duration-300 active:scale-95 flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-house text-sm"></i>
                  Trang chủ
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                <i className="fa-solid fa-circle-exclamation text-rose-500 text-3xl"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Có lỗi xảy ra</h2>
              <p className="text-slate-500 font-medium mb-8">
                Chúng tôi gặp khó khăn khi khôi phục giỏ hàng. Bạn vẫn có thể quay lại giỏ hàng và đặt lại.
              </p>
              <button
                onClick={() => navigate('/cart')}
                className="px-10 py-4 bg-rose-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg active:scale-95"
              >
                Về giỏ hàng
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
