
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
      <div className="container mx-auto px-6 py-32 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Không tìm thấy đơn hàng #{orderId}</h2>
        <Link to="/my-orders" className="text-indigo-600 font-bold hover:underline">Quay lại danh sách đơn hàng</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 lg:py-20 fade-in">
      <button onClick={() => navigate('/my-orders')} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
        <i className="fa-solid fa-arrow-left text-xs"></i>
        Quay lại danh sách đơn
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 p-8 lg:p-12 shadow-sm mb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-slate-50 pb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Đơn hàng #{orderWithItems.id}</h1>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">{orderWithItems.date}</p>
              </div>
              <div className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-sm">
                {orderWithItems.status}
              </div>
            </div>

            <div className="mb-16 relative">
              <div className="flex justify-between relative z-10 px-4">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      idx <= orderWithItems.statusStep ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-300'
                    }`}>
                      <i className={`fa-solid ${step.icon}`}></i>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest text-center ${idx <= orderWithItems.statusStep ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 -z-0 rounded-full overflow-hidden mx-10">
                <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${(orderWithItems.statusStep / (steps.length - 1)) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-xl font-black text-slate-900 mb-6">Sản phẩm trong đơn</h2>
              {orderWithItems.items.map((item, idx) => (
                <div key={idx} className="flex gap-6 items-center border-b border-slate-50 pb-8 last:border-0 last:pb-0 group">
                  <div className="w-24 h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-50 shadow-sm">
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/book/${item.bookId}`} className="font-black text-slate-900 hover:text-indigo-600 transition-colors">{item.title}</Link>
                      <span className="font-black text-slate-900">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-3 py-1 bg-slate-50 rounded-lg text-slate-500">Số lượng: {item.quantity}</span>
                      <Link to={`/book/${item.bookId}`} className="text-xs font-black text-indigo-600 hover:underline">Xem lại sách</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-24">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
              <i className="fa-solid fa-location-dot text-indigo-600"></i>
              Địa chỉ nhận hàng
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Người nhận</p>
                <p className="font-bold text-slate-900">{orderWithItems.customer.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Địa chỉ</p>
                <p className="font-medium text-slate-600 text-sm leading-relaxed">{orderWithItems.customer.address}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
              <i className="fa-solid fa-receipt text-indigo-400"></i>
              Thanh toán
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold">Tạm tính</span>
                <span className="font-bold text-slate-300">{formatPrice(orderWithItems.payment.subtotal)}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-lg font-black">Tổng tiền</span>
                <span className="text-2xl font-black text-indigo-400">{formatPrice(orderWithItems.payment.total)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/')} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-lg">Quay lại trang chủ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
