
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, Order, OrderItem } from '@/services/db';
import { ordersService } from '@/services/db/adapter';
import { SEO } from '@/shared/components';

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
        const detail = await ordersService.getOrderById(orderId);
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
    { label: 'Đã nhận', icon: 'fa-circle-check', desc: 'Đã giao hàng thành công' }
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
    <div className="bg-slate-50 min-h-screen pt-12 lg:pt-16 pb-32 lg:pb-16">
      <SEO title={`Đơn hàng #${orderWithItems.id}`} description={`Chi tiết trạng thái và sản phẩm của đơn hàng #${orderWithItems.id}`} />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-50/30 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/4"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/my-orders')}
          className="mb-10 flex items-center gap-2.5 text-xs font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em]"
        >
          <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </div>
          Lịch sử đơn hàng
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Detail Side */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Header & Tracking Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-slate-100 overflow-hidden relative"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-50 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">Đơn hàng #{orderWithItems.id.slice(-8).toUpperCase()}</h1>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fa-regular fa-clock text-xs"></i> Thời gian đặt: {orderWithItems.date}
                  </p>
                </div>
                <div className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest border shadow-sm ${orderWithItems.statusStep === -1 ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                  {orderWithItems.status}
                </div>
              </div>

              {/* Progress Tracking */}
              {orderWithItems.statusStep !== -1 && (
                <div className="relative mb-4">
                  <div className="flex justify-between relative z-10">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 relative ${idx <= orderWithItems.statusStep ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-200'
                          }`}>
                          <i className={`fa-solid ${step.icon} text-base`}></i>
                          {idx <= orderWithItems.statusStep && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                              <i className="fa-solid fa-check text-xs text-white"></i>
                            </div>
                          )}
                        </div>
                        <div className="text-center px-1">
                          <p className={`text-xs font-black uppercase tracking-widest mb-0.5 ${idx <= orderWithItems.statusStep ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                          <p className="text-xs font-bold text-slate-300 leading-tight hidden sm:block uppercase tracking-wide">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Progress Line */}
                  <div className="absolute top-6 left-0 w-full h-0.5 bg-slate-100 -z-0 rounded-full overflow-hidden px-12">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(Math.max(0, orderWithItems.statusStep) / (steps.length - 1)) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-indigo-600"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* 2. Items List Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-5 bg-slate-900 rounded-full"></div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Sản phẩm</h2>
              </div>

              <div className="space-y-6">
                {orderWithItems.items.map((item, idx) => (
                  <div key={idx} className="flex gap-5 lg:gap-6 items-center border-b border-slate-50 last:border-0 pb-6 last:pb-0 group">
                    <div className="w-16 h-22 lg:w-20 lg:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 shadow-sm border border-slate-100 relative group">
                      {item.cover ? (
                        <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <i className="fa-solid fa-book text-slate-400 text-2xl"></i>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                        <div className="flex-grow min-w-0">
                          <Link to={`/book/${item.bookId}`} className="text-sm lg:text-base font-bold text-slate-900 hover:text-indigo-600 transition-all leading-tight tracking-tight line-clamp-1 uppercase">
                            {item.title}
                          </Link>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">Giá: {formatPrice(item.priceAtPurchase)}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-base font-black text-slate-900 tracking-tight">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
                          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg mt-1">SL: x{item.quantity}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/book/${item.bookId}`}
                          className="text-xs font-black text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 border border-indigo-100 rounded-lg uppercase tracking-widest transition-all"
                        >
                          Mua lại
                        </Link>
                        <button className="text-xs font-black text-slate-300 hover:text-slate-900 uppercase tracking-widest transition-all">
                          Hỗ trợ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Summary Area */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">

            {/* 3. Shipping Info Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <h3 className="text-xs font-black text-slate-900 mb-6 flex items-center gap-2.5 uppercase tracking-widest relative z-10">
                <i className="fa-solid fa-map-location-dot text-indigo-500 text-xs"></i>
                Địa chỉ nhận hàng
              </h3>

              <div className="space-y-5 relative z-10">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <i className="fa-solid fa-user text-xs text-slate-400"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-0.5">Người nhận</p>
                    <p className="font-bold text-xs text-slate-800">{orderWithItems.customer.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <i className="fa-solid fa-truck text-xs text-slate-400"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-0.5">Địa chỉ giao</p>
                    <p className="font-medium text-slate-500 text-xs leading-relaxed">{orderWithItems.customer.address}</p>
                  </div>
                </div>

                {orderWithItems.customer.note && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ghi chú:</p>
                    <p className="font-medium text-slate-600 text-xs leading-relaxed italic">
                      "{orderWithItems.customer.note}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 4. Payment Summary Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col"
            >
              <h3 className="text-xs font-black mb-8 flex items-center gap-2.5 uppercase tracking-widest relative z-10">
                <i className="fa-solid fa-receipt text-indigo-400 text-xs"></i>
                Thanh toán
              </h3>

              <div className="space-y-4 mb-8 relative z-10">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                  <span>Tạm tính</span>
                  <span className="text-slate-100">{formatPrice(orderWithItems.payment.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                  <span>Vận chuyển</span>
                  <span className="text-slate-100">{formatPrice(orderWithItems.payment.shipping)}</span>
                </div>
                {orderWithItems.payment.couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-emerald-400 px-1">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(orderWithItems.payment.couponDiscount)}</span>
                  </div>
                )}

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">TỔNG CỘNG</span>
                    <span className="text-2xl font-black text-white tracking-tighter leading-none">{formatPrice(orderWithItems.payment.total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 mb-8 border border-white/5 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Phương thức</p>
                <p className="text-xs font-bold text-indigo-300">{orderWithItems.payment.method}</p>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-all active:scale-95 relative z-10 mb-3"
              >
                Tiếp tục mua sắm
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

