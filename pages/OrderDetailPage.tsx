
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, Order, OrderItem } from '../services/db';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [orderWithItems, setOrderWithItems] = useState<(Order & { items: OrderItem[] }) | null>(null);

  useEffect(() => {
    // FIX: Await async call
    const fetchDetail = async () => {
      if (orderId) {
        const detail = await db.getOrderWithItems(orderId);
        setOrderWithItems(detail || null);
      }
    };
    fetchDetail();
  }, [orderId]);

  const steps = [
    { label: 'Đã đặt', icon: 'fa-check' },
    { label: 'Đang xử lý', icon: 'fa-cog' },
    { label: 'Đang giao', icon: 'fa-truck-fast' },
    { label: 'Đã nhận', icon: 'fa-house-circle-check' }
  ];

  if (!orderWithItems) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-32 text-center fade-in">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">Không tìm thấy đơn hàng #{orderId}</h2>
        <Link to="/my-orders" className="text-indigo-600 font-bold hover:underline text-sm">Quay lại danh sách đơn hàng</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-16 lg:pt-20 pb-32 fade-in">
      <button onClick={() => navigate('/my-orders')} className="mb-6 flex items-center gap-2 text-micro font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-premium">
        <i className="fa-solid fa-arrow-left text-[10px]"></i>
        Quay lại danh sách
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-10 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-slate-50 pb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-1 uppercase tracking-tight">Đơn hàng #{orderWithItems.id}</h1>
                <p className="text-slate-400 font-bold text-micro uppercase tracking-premium">{orderWithItems.date}</p>
              </div>
              <div className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-micro uppercase tracking-premium">
                {orderWithItems.status}
              </div>
            </div>

            <div className="mb-12 relative">
              <div className="flex justify-between relative z-10 px-2 lg:px-4">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      idx <= orderWithItems.statusStep ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-300'
                    }`}>
                      <i className={`fa-solid ${step.icon} text-sm`}></i>
                    </div>
                    <span className={`text-micro font-bold uppercase tracking-premium text-center ${idx <= orderWithItems.statusStep ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute top-5 left-0 w-[calc(100%-40px)] h-0.5 bg-slate-100 -z-0 rounded-full overflow-hidden mx-5 lg:mx-8">
                <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${(orderWithItems.statusStep / (steps.length - 1)) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-slate-900 mb-4 uppercase tracking-tight">Sản phẩm trong đơn</h2>
              {orderWithItems.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 lg:gap-6 items-center border-b border-slate-50 pb-6 last:border-0 last:pb-0 group">
                  <div className="w-16 h-24 lg:w-20 lg:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 shadow-sm border border-slate-100">
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <Link to={`/book/${item.bookId}`} className="text-sm lg:text-base font-extrabold text-slate-900 hover:text-indigo-600 transition-colors leading-snug uppercase tracking-tight">{item.title}</Link>
                      <span className="font-extrabold text-slate-900 text-sm">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-micro font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase tracking-premium">Số lượng: {item.quantity}</span>
                      <Link to={`/book/${item.bookId}`} className="text-micro font-bold text-indigo-600 hover:underline uppercase tracking-premium">Mua lại</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 mb-5 flex items-center gap-2.5 uppercase tracking-premium">
              <i className="fa-solid fa-location-dot text-indigo-600"></i>
              Địa chỉ nhận hàng
            </h3>
            <div className="space-y-3.5">
              <div>
                <p className="text-micro text-slate-400 font-bold uppercase tracking-premium mb-0.5">Người nhận</p>
                <p className="font-extrabold text-sm text-slate-900">{orderWithItems.customer.name}</p>
              </div>
              <div>
                <p className="text-micro text-slate-400 font-bold uppercase tracking-premium mb-0.5">Địa chỉ</p>
                <p className="font-medium text-slate-600 text-xs leading-relaxed">{orderWithItems.customer.address}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h3 className="text-base font-extrabold mb-5 flex items-center gap-2.5 relative z-10 uppercase tracking-premium">
              <i className="fa-solid fa-receipt text-indigo-400"></i>
              Thanh toán
            </h3>
            <div className="space-y-3.5 mb-6 relative z-10">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-premium text-micro">Tạm tính</span>
                <span className="font-bold text-slate-300">{formatPrice(orderWithItems.payment.subtotal)}</span>
              </div>
              <div className="pt-3.5 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm font-extrabold uppercase tracking-premium">Tổng tiền</span>
                <span className="text-xl font-extrabold text-indigo-400">{formatPrice(orderWithItems.payment.total)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/')} className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-extrabold text-micro uppercase tracking-premium hover:bg-indigo-50 transition-all shadow-lg active:scale-95 relative z-10">Tiếp tục mua sắm</button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
