
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, Order, OrderItem } from '../services/db';
import SEO from '../components/SEO';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [orderWithItems, setOrderWithItems] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (orderId) {
        setLoading(true);
        const detail = await db.getOrderWithItems(orderId);
        setOrderWithItems(detail || null);
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo(0, 0);
  }, [orderId]);

  const steps = [
    { label: 'Đã đặt', icon: 'fa-check', desc: 'Đơn hàng đã được tiếp nhận' },
    { label: 'Đang xử lý', icon: 'fa-microchip', desc: 'Đang chuẩn bị gói hàng' },
    { label: 'Đang giao', icon: 'fa-truck-fast', desc: 'Đơn hàng đang trên đường đến' },
    { label: 'Đã nhận', icon: 'fa-house-circle-check', desc: 'Đã giao hàng thành công' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải chi tiết...</p>
        </div>
      </div>
    );
  }

  if (!orderWithItems) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 text-center max-w-lg border border-slate-100 relative overflow-hidden">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <i className="fa-solid fa-file-circle-exclamation text-4xl"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Không tồn tại</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">
            Rất tiếc, chúng tôi không tìm thấy thông tin cho đơn hàng #{orderId}. Vui lòng kiểm tra lại mã đơn hàng.
          </p>
          <button 
            onClick={() => navigate('/my-orders')}
            className="w-full px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-12 lg:pt-24 pb-32">
      <SEO title={`Đơn hàng #${orderWithItems.id}`} description={`Chi tiết trạng thái và sản phẩm của đơn hàng #${orderWithItems.id}`} />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-50/30 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/4"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/my-orders')} 
          className="mb-8 flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em]"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
            <i className="fa-solid fa-arrow-left text-[10px]"></i>
          </div>
          Quay lại lịch sử đơn hàng
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Detail Side */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Header & Tracking Card */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-sm border border-slate-100 overflow-hidden relative"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-slate-50 pb-8">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                     <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Đơn hàng #{orderWithItems.id}</h1>
                   </div>
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-regular fa-clock"></i> Thời gian đặt: {orderWithItems.date}
                   </p>
                </div>
                <div className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border shadow-sm ${
                  orderWithItems.statusStep === -1 ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  {orderWithItems.status}
                </div>
              </div>

              {/* Progress Tracking */}
              {orderWithItems.statusStep !== -1 && (
                <div className="relative mb-6">
                  <div className="flex justify-between relative z-10">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 relative ${
                          idx <= orderWithItems.statusStep ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-100 text-slate-300'
                        }`}>
                          <i className={`fa-solid ${step.icon} text-lg`}></i>
                          {idx <= orderWithItems.statusStep && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                               <i className="fa-solid fa-check text-[8px] text-white"></i>
                            </div>
                          )}
                        </div>
                        <div className="text-center px-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${idx <= orderWithItems.statusStep ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-[8px] font-bold text-slate-300 leading-tight hidden sm:block uppercase">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Progress Line */}
                  <div className="absolute top-7 left-0 w-full h-1 bg-slate-100 -z-0 rounded-full overflow-hidden px-12">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(Math.max(0, orderWithItems.statusStep) / (steps.length - 1)) * 100}%` }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* 2. Items List Card */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Sản phẩm trong kiện hàng</h2>
              </div>
              
              <div className="space-y-8">
                {orderWithItems.items.map((item, idx) => (
                  <div key={idx} className="flex gap-6 lg:gap-8 items-center border-b border-slate-50 last:border-0 pb-8 last:pb-0 group">
                    <div className="w-20 h-28 lg:w-24 lg:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-50 shadow-sm border border-slate-50 relative group">
                      <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                         <div className="flex-grow min-w-0">
                            <Link to={`/book/${item.bookId}`} className="text-base lg:text-lg font-black text-slate-900 hover:text-indigo-600 transition-all leading-tight tracking-tight line-clamp-2 uppercase">
                               {item.title}
                            </Link>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Đơn giá: {formatPrice(item.priceAtPurchase)}</p>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-rose-600 tracking-tight">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg mt-1 italic">SL: x{item.quantity}</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         <Link 
                           to={`/book/${item.bookId}`} 
                           className="text-[9px] font-black text-indigo-600 hover:text-white hover:bg-indigo-600 px-4 py-2 border border-indigo-100 rounded-xl uppercase tracking-widest transition-all"
                         >
                            Mua lại sản phẩm
                         </Link>
                         <button className="text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all">
                            Yêu cầu hỗ trợ
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Summary Area */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
            
            {/* 3. Shipping Info Card */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-[60px] -mr-16 -mt-16"></div>
              
              <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest relative z-10">
                <i className="fa-solid fa-map-location-dot text-indigo-600"></i>
                Địa chỉ nhận hàng
              </h3>
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <i className="fa-solid fa-user text-xs text-slate-400"></i>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Người nhận</p>
                      <p className="font-black text-sm text-slate-800">{orderWithItems.customer.name}</p>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <i className="fa-solid fa-truck-ramp-box text-xs text-slate-400"></i>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Địa chỉ giao</p>
                      <p className="font-bold text-slate-500 text-xs leading-relaxed">{orderWithItems.customer.address}</p>
                   </div>
                </div>

                {orderWithItems.customer.note && (
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <i className="fa-solid fa-message-quote text-[10px]"></i> Ghi chú từ bạn
                    </p>
                    <p className="font-bold text-indigo-600 text-[11px] leading-relaxed italic">
                       "{orderWithItems.customer.note}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 4. Payment Summary Card */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="bg-slate-900 text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col"
            >
              {/* Decorative Accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px] -mr-20 -mt-20 scale-150"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[60px] -ml-16 -mb-16"></div>

              <h3 className="text-sm font-black mb-10 flex items-center gap-3 uppercase tracking-widest relative z-10">
                <i className="fa-solid fa-receipt text-indigo-400"></i>
                Chi phí thanh toán
              </h3>

              <div className="space-y-5 mb-10 relative z-10">
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">
                  <span>Giá tạm tính</span>
                  <span className="text-slate-100">{formatPrice(orderWithItems.payment.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">
                  <span>Phí vận chuyển</span>
                  <span className="text-slate-100">{formatPrice(orderWithItems.payment.shipping)}</span>
                </div>
                {orderWithItems.payment.couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-emerald-400 px-1 bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                       <i className="fa-solid fa-tag"></i> Giảm giá coupon
                    </div>
                    <span>-{formatPrice(orderWithItems.payment.couponDiscount)}</span>
                  </div>
                )}
                
                <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-1">TỔNG CUỐI CÙNG</span>
                     <span className="text-3xl font-black text-white tracking-tighter leading-none">{formatPrice(orderWithItems.payment.total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 mb-10 border border-white/10 text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Phương thức thanh toán</p>
                 <p className="text-xs font-bold text-indigo-300">{orderWithItems.payment.method}</p>
              </div>

              <button 
                onClick={() => navigate('/')} 
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-indigo-500/10 active:scale-95 relative z-10 flex items-center justify-center gap-3"
              >
                 <i className="fa-solid fa-plus-circle"></i>
                 Tiếp tục mua sách mới
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
