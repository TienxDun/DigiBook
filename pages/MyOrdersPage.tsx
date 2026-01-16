
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
      <div className="container mx-auto px-6 py-32 text-center fade-in">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <i className="fa-solid fa-user-lock text-4xl text-slate-300"></i>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Bạn chưa đăng nhập</h1>
        <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto">Vui lòng đăng nhập tài khoản để xem lại lịch sử các đơn hàng bạn đã đặt.</p>
        <button onClick={() => setShowLoginModal(true)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100">Đăng nhập ngay</button>
      </div>
    );
  }

  return (
    <div className="w-[92%] xl:w-[60%] mx-auto px-4 py-12 lg:py-20 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">Lịch sử giao dịch</p>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mb-1">Đơn hàng của tôi</h1>
          <p className="text-slate-500 text-sm font-medium">Theo dõi và quản lý các đơn hàng bạn đã đặt tại DigiBook.</p>
        </div>
      </div>

      <div className="space-y-6">
        {orders.length > 0 ? (
          orders.map(order => {
            const itemCount = orderItemsCounts[order.id] || 0;
            
            return (
              <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <i className="fa-solid fa-box-open text-2xl"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Đơn hàng #{order.id}</h3>
                      <p className="text-sm text-slate-400 font-bold">{order.date} • {itemCount} sản phẩm</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-8 w-full md:w-auto">
                     <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Trạng thái</p>
                       <span className={`px-4 py-1.5 rounded-full text-xs font-black ${order.statusStep < 3 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {order.status}
                       </span>
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Tổng cộng</p>
                       <p className="text-lg font-black text-slate-900">{formatPrice(order.payment.total)}</p>
                     </div>
                     <button onClick={() => navigate(`/my-orders/${order.id}`)} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all">Chi tiết đơn</button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <i className="fa-solid fa-receipt text-5xl text-slate-200 mb-6"></i>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Bạn chưa có đơn hàng nào</h3>
            <p className="text-slate-500 mb-8">Hãy trải nghiệm mua sắm những cuốn sách tuyệt vời ngay nhé!</p>
            <Link to="/" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Mua sắm ngay</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
