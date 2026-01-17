
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db, Order, OrderItem } from '../services/db';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItemsCounts, setOrderItemsCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // FIX: Await getOrdersByUserId and fetch item counts
    const fetchOrders = async () => {
      if (user) {
        const userOrders = await db.getOrdersByUserId(user.id);
        setOrders(userOrders);
        
        // Fetch items for each order to get accurate count
        const counts: Record<string, number> = {};
        for (const order of userOrders) {
           const detail = await db.getOrderWithItems(order.id);
           counts[order.id] = detail?.items.length || 0;
        }
        setOrderItemsCounts(counts);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-32 text-center fade-in">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-user-lock text-3xl text-slate-300"></i>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Bạn chưa đăng nhập</h1>
        <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto font-medium leading-relaxed">Vui lòng đăng nhập tài khoản để xem lại lịch sử các đơn hàng bạn đã đặt.</p>
        <button onClick={() => setShowLoginModal(true)} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-extrabold uppercase tracking-premium text-micro shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase">Đăng nhập ngay</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24 pb-32 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <p className="text-micro font-bold uppercase tracking-premium text-indigo-600 mb-1.5">Lịch sử giao dịch</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Đơn hàng của tôi</h1>
          <p className="text-slate-500 text-xs font-medium">Theo dõi và quản lý các đơn đặt hàng tại DigiBook.</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map(order => {
            const itemCount = orderItemsCounts[order.id] || 0;
            
            return (
              <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <i className="fa-solid fa-box-open text-xl"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Đơn hàng #{order.id}</h3>
                      <p className="text-label text-slate-400 font-bold">{order.date} • {itemCount} sản phẩm</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
                     <div>
                       <p className="text-micro text-slate-400 font-bold uppercase tracking-premium mb-1">Trạng thái</p>
                       <span className={`px-3 py-1 rounded-lg text-micro font-bold uppercase tracking-premium ${order.statusStep < 3 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {order.status}
                       </span>
                     </div>
                     <div>
                       <p className="text-micro text-slate-400 font-bold uppercase tracking-premium mb-1">Tổng cộng</p>
                       <p className="text-base font-extrabold text-slate-900">{formatPrice(order.payment.total)}</p>
                     </div>
                     <button onClick={() => navigate(`/my-orders/${order.id}`)} className="flex-1 md:flex-none px-5 py-2.5 bg-slate-900 text-white rounded-xl text-micro font-extrabold uppercase tracking-premium hover:bg-indigo-600 transition-all active:scale-95">Chi tiết đơn</button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <i className="fa-solid fa-receipt text-4xl text-slate-200 mb-5"></i>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1.5 uppercase tracking-premium">Bạn chưa có đơn đặt hàng nào</h3>
            <p className="text-slate-500 text-xs mb-8 font-medium">Hãy trải nghiệm mua sắm những cuốn sách tuyệt vời ngay nhé!</p>
            <Link to="/" className="inline-block px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-extrabold uppercase tracking-premium text-micro active:scale-95 transition-all shadow-lg shadow-indigo-100">Mua sắm ngay</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
