
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/features/auth';
import { db, Order } from '@/services/db';
import { SEO } from '@/shared/components';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const ORDER_STATUSES = [
  { id: 'all', label: 'Tất cả', icon: 'fa-list-ul' },
  { id: 'processing', label: 'Đang xử lý', icon: 'fa-spinner', step: 1 },
  { id: 'shipping', label: 'Đang giao', icon: 'fa-truck-fast', step: 2 },
  { id: 'completed', label: 'Đã giao', icon: 'fa-circle-check', step: 3 },
  { id: 'cancelled', label: 'Đã hủy', icon: 'fa-circle-xmark', step: -1 },
];

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItemsCounts, setOrderItemsCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        setLoading(true);
        try {
          const userOrders = await db.getOrdersByUserId(user.id);
          // Sort by date descending
          userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setOrders(userOrders);

          const counts: Record<string, number> = {};
          for (const order of userOrders) {
            const detail = await db.getOrderWithItems(order.id);
            counts[order.id] = detail?.items.length || 0;
          }
          setOrderItemsCounts(counts);
        } catch (error) {
          console.error("Error fetching orders:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrders();
    window.scrollTo(0, 0);
  }, [user]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeTab === 'all') return matchesSearch;

      const statusConfig = ORDER_STATUSES.find(s => s.id === activeTab);
      if (activeTab === 'cancelled') return matchesSearch && order.statusStep === -1;
      if (activeTab === 'completed') return matchesSearch && order.statusStep >= 3;
      if (activeTab === 'shipping') return matchesSearch && order.statusStep === 2;
      if (activeTab === 'processing') return matchesSearch && (order.statusStep === 0 || order.statusStep === 1);

      return matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 text-center max-w-lg border border-slate-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
              <i className="fa-solid fa-user-lock text-4xl"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Dừng lại một chút!</h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-10">
              Bạn cần đăng nhập để truy cập vào lịch sử mua hàng và theo dõi hành trình của những cuốn sách đang đến với mình.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              Đăng nhập ngay
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-12 lg:pt-16 pb-32 lg:pb-16">
      <SEO title="Đơn hàng của tôi" description="Quản lý và theo dõi lịch sử mua hàng của bạn tại DigiBook." />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-50/30 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        {/* Header Segment */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <nav className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              <Link to="/" className="hover:text-indigo-600 transition-all">TRANG CHỦ</Link>
              <span className="opacity-20">/</span>
              <span className="text-indigo-600">ĐƠN HÀNG</span>
            </nav>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Lịch sử mua hàng
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-100 w-full md:w-72"
          >
            <i className="fa-solid fa-magnifying-glass text-xs text-slate-400"></i>
            <input
              type="text"
              placeholder="Tìm theo mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow bg-transparent outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300"
            />
          </motion.div>
        </div>

        {/* Tabs Controls */}
        <div className="mb-8 flex overflow-x-auto pb-2 gap-2 no-scrollbar">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status.id}
              onClick={() => setActiveTab(status.id)}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2.5 ${activeTab === status.id
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200 hover:text-slate-600'
                }`}
            >
              <i className={`fa-solid ${status.icon} text-xs`}></i>
              {status.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 animate-pulse flex flex-col md:flex-row gap-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl"></div>
                  <div className="flex-grow space-y-2">
                    <div className="h-3 bg-slate-50 rounded w-1/4"></div>
                    <div className="h-2 bg-slate-50 rounded w-1/3"></div>
                  </div>
                </div>
              ))
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: index * 0.03 }}
                  className="group bg-white p-5 lg:p-6 rounded-[2rem] border border-slate-100/80 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${order.statusStep === -1 ? 'bg-rose-50 text-rose-500' :
                        order.statusStep >= 3 ? 'bg-emerald-50 text-emerald-500' :
                          'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
                        }`}>
                        <i className={`fa-solid ${order.statusStep === -1 ? 'fa-rectangle-xmark' :
                          order.statusStep >= 3 ? 'fa-circle-check' :
                            'fa-boxes-packing'
                          }`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">#{order.id.slice(-8).toUpperCase()}</h3>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-widest ${order.statusStep === -1 ? 'bg-rose-50 text-rose-600' :
                            order.statusStep >= 3 ? 'bg-emerald-50 text-emerald-600' :
                              'bg-indigo-50 text-indigo-600'
                            }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 uppercase tracking-wide">
                          <span className="flex items-center gap-1.5">
                            <i className="fa-regular fa-calendar"></i>
                            {new Date(order.date).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-book-open"></i>
                            {orderItemsCounts[order.id] || 0} sản phẩm
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-10 w-full lg:w-auto pt-5 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                      <div className="flex flex-col lg:items-end">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Tổng cộng</p>
                        <p className="text-lg font-black text-slate-900 tracking-tight">{formatPrice(order.payment.total)}</p>
                      </div>

                      <button
                        onClick={() => navigate(`/my-orders/${order.id}`)}
                        className="px-6 py-3.5 bg-slate-50 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2.5"
                      >
                        <span>Chi tiết</span>
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                  <i className="fa-solid fa-receipt text-4xl text-slate-200"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">KHÔNG TÌM THẤY ĐƠN HÀNG</h3>
                <p className="text-slate-400 font-medium mb-12 max-w-sm mx-auto px-4 leading-relaxed">
                  Có vẻ như bạn chưa có đơn hàng nào hoặc tiêu chí tìm kiếm không phù hợp. Hãy bắt đầu hành trình đọc sách ngay hôm nay!
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-all shadow-2xl shadow-indigo-200 hover:bg-indigo-700"
                >
                  <i className="fa-solid fa-shopping-bag"></i>
                  Khám phá cửa hàng
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MyOrdersPage;

