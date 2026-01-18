import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { db, Order, OrderItem } from '../../services/db';
import { ErrorHandler } from '../../services/errorHandler';
import Pagination from '../Pagination';

interface AdminOrdersProps {
  orders: Order[];
  refreshData: () => Promise<void>;
  theme?: 'light' | 'midnight';
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const orderStatusOptions = [
  { step: 0, label: 'Đang xử lý', color: 'amber' },
  { step: 1, label: 'Đã xác nhận', color: 'blue' },
  { step: 2, label: 'Đang giao', color: 'indigo' },
  { step: 3, label: 'Đã giao', color: 'emerald' }
];

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, refreshData, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone.includes(searchQuery)
    );
  }, [orders, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleViewOrderDetails = async (order: Order) => {
    try {
      const orderWithItems = await db.getOrderWithItems(order.id);
      if (orderWithItems) {
        setSelectedOrder(orderWithItems);
        setIsOrderModalOpen(true);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'tải chi tiết đơn hàng');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatusStep: number) => {
    const newStatusLabel = orderStatusOptions.find(opt => opt.step === newStatusStep)?.label || 'Đang xử lý';
    
    if (!window.confirm(`Cập nhật trạng thái đơn hàng thành "${newStatusLabel}"?`)) return;
    
    setUpdatingOrderStatus(true);
    try {
      await db.updateOrderStatus(orderId, newStatusLabel, newStatusStep);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatusLabel, statusStep: newStatusStep });
      }
      toast.success('Cập nhật trạng thái thành công!');
      refreshData();
    } catch (error) {
      ErrorHandler.handle(error, 'cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Filter Bar */}
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl hover:border-indigo-500/30' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/40 hover:border-slate-300'
        } flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all`}>
        <div>
          <h3 className={`text-lg font-extrabold uppercase tracking-tight ${isMidnight ? 'text-white' : 'text-slate-900'}`}>Danh sách đơn hàng</h3>
          <p className={`text-micro font-bold uppercase tracking-premium mt-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Quản lý và cập nhật trạng thái đơn hàng</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative group w-full sm:w-80">
            <input 
              type="text" 
              placeholder="Tìm theo mã đơn, tên khách, SĐT..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-2xl outline-none font-bold transition-all text-sm ${
                isMidnight 
                ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500 focus:bg-white/10' 
                : 'bg-slate-50 border-none focus:ring-4 ring-indigo-50 focus:bg-white'
              }`}
            />
            <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs transition-colors ${
              isMidnight ? 'text-slate-600 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'
            }`}></i>
          </div>
          <button 
            onClick={() => { refreshData(); toast.success('Đã làm mới dữ liệu'); }}
            className={`w-12 h-12 rounded-xl transition-all border flex items-center justify-center ${
              isMidnight 
              ? 'bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border-white/5' 
              : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-slate-100'
            }`}
            title="Làm mới danh sách"
          >
            <i className="fa-solid fa-rotate"></i>
          </button>
        </div>
      </div>

      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/20'
        } rounded-[2rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1100px]">
          <thead>
            <tr className={`${isMidnight ? 'bg-white/5 border-white/5' : 'bg-slate-50/50'} border-b`}>
              <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Mã đơn</th>
              <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Khách hàng</th>
              <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Tổng tiền</th>
              <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Trạng thái</th>
              <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Ngày đặt</th>
              <th className={`px-8 py-5 text-micro font-extrabold uppercase tracking-widest text-center ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-100'}`}>
            {paginatedOrders.length > 0 ? paginatedOrders.map(order => (
              <tr key={order.id} className={`group transition-all ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                <td className={`px-8 py-5 text-sm font-bold ${isMidnight ? 'text-indigo-400' : 'text-slate-900'}`}>#{order.id.slice(-8)}</td>
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className={`text-sm font-extrabold ${isMidnight ? 'text-slate-200' : 'text-slate-700'}`}>{order.customer?.name || 'Vãng lai'}</span>
                    <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>{order.customer?.phone}</span>
                  </div>
                </td>
                <td className={`px-8 py-5 text-sm font-extrabold ${isMidnight ? 'text-emerald-400' : 'text-indigo-600'}`}>{formatPrice(order.payment.total)}</td>
                <td className="px-8 py-5">
                  <div className="relative inline-block w-full max-w-[180px]">
                    <select
                      disabled={updatingOrderStatus}
                      value={order.statusStep}
                      onChange={(e) => handleUpdateOrderStatus(order.id, Number(e.target.value))}
                      className={`w-full px-4 py-2 rounded-xl text-micro font-extrabold uppercase tracking-widest border-none outline-none cursor-pointer transition-all shadow-sm appearance-none ${
                        order.statusStep === 3 
                        ? (isMidnight ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600') :
                        order.statusStep === 2 
                        ? (isMidnight ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600') :
                        order.statusStep === 1 
                        ? (isMidnight ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600') :
                        (isMidnight ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600')
                      }`}
                    >
                      {orderStatusOptions.map(status => (
                        <option key={status.step} value={status.step} className={`font-bold uppercase tracking-premium ${isMidnight ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-900'}`}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <i className={`fa-solid fa-chevron-down text-[8px] ${isMidnight ? 'text-white/20' : 'text-slate-400'}`}></i>
                    </div>
                  </div>
                </td>
                <td className={`px-8 py-5 text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : order.date}
                </td>
                <td className="px-8 py-5 text-center">
                  <button 
                    onClick={() => handleViewOrderDetails(order)}
                    className={`w-10 h-10 rounded-xl transition-all shadow-sm flex items-center justify-center mx-auto ${
                      isMidnight 
                      ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isMidnight ? 'bg-white/5 text-slate-700' : 'bg-slate-50 text-slate-200'}`}>
                      <i className="fa-solid fa-inbox text-3xl opacity-20"></i>
                    </div>
                    <span className={`text-sm font-bold ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Không tìm thấy đơn hàng nào</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-8 py-6 border-t ${isMidnight ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/30'}`}>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              theme={theme}
            />
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[999] p-4 flex items-center justify-center">
          <div className={`absolute inset-0 backdrop-blur-md ${isMidnight ? 'bg-black/60' : 'bg-slate-900/40'}`} onClick={() => setIsOrderModalOpen(false)}></div>
          <div className={`rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 animate-scaleIn border ${
            isMidnight ? 'bg-[#1e1e2d] border-white/10' : 'bg-white border-white'
          }`}>
            <div className={`p-8 border-b flex justify-between items-center ${
              isMidnight ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <div>
                <h3 className={`text-xl font-extrabold uppercase tracking-tight ${isMidnight ? 'text-white' : 'text-slate-900'}`}>Chi tiết đơn hàng #{selectedOrder.id.slice(-8)}</h3>
                <p className={`text-micro font-bold uppercase tracking-premium mt-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Ngày đặt: {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString('vi-VN') : selectedOrder.date}
                </p>
              </div>
              <button 
                onClick={() => setIsOrderModalOpen(false)} 
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-sm ${
                  isMidnight ? 'bg-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'bg-white text-slate-400 hover:text-rose-500'
                }`}
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Customer Info */}
                <div className={`p-6 rounded-3xl border ${
                  isMidnight ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100/50'
                }`}>
                  <h4 className={`text-micro font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2 ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    <i className="fa-solid fa-user"></i> Thông tin khách hàng
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>Họ tên:</span>
                      <span className={`text-sm font-extrabold ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>Số điện thoại:</span>
                      <span className={`text-sm font-extrabold ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{selectedOrder.customer.phone}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'} whitespace-nowrap`}>Địa chỉ:</span>
                      <span className={`text-sm font-extrabold text-right leading-relaxed ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{selectedOrder.customer.address}</span>
                    </div>
                    {selectedOrder.customer.note && (
                      <div className={`pt-3 border-t ${isMidnight ? 'border-indigo-500/10' : 'border-indigo-100'}`}>
                        <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>Ghi chú:</span>
                        <p className={`text-xs font-bold mt-1 ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>"{selectedOrder.customer.note}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className={`p-6 rounded-3xl border ${
                  isMidnight ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50/50 border-emerald-100/50'
                }`}>
                  <h4 className={`text-micro font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2 ${isMidnight ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <i className="fa-solid fa-credit-card"></i> Thanh toán
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>Phương thức:</span>
                      <span className={`text-sm font-extrabold ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{selectedOrder.payment.method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>Tạm tính:</span>
                      <span className={`text-sm font-extrabold ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{formatPrice(selectedOrder.payment.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-500">
                      <span className="text-micro font-bold uppercase tracking-premium">Giảm giá:</span>
                      <span className="text-sm font-extrabold">-{formatPrice(selectedOrder.payment.couponDiscount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>Phí vận chuyển:</span>
                      <span className={`text-sm font-extrabold ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{formatPrice(selectedOrder.payment.shipping)}</span>
                    </div>
                    <div className={`pt-3 border-t flex justify-between items-center ${isMidnight ? 'border-emerald-500/10' : 'border-emerald-100'}`}>
                      <span className={`text-sm font-extrabold ${isMidnight ? 'text-white' : 'text-slate-900'}`}>Tổng cộng:</span>
                      <span className={`text-xl font-black ${isMidnight ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatPrice(selectedOrder.payment.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Sản phẩm ({selectedOrder.items.length})
                  </h4>
                  <span className={`text-micro font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
                    isMidnight ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {selectedOrder.items.reduce((acc, item) => acc + item.quantity, 0)} cuốn
                  </span>
                </div>
                <div className={`border rounded-3xl overflow-hidden ${isMidnight ? 'border-white/5' : 'border-slate-100'}`}>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                      <thead className={`sticky top-0 z-10 shadow-sm ${isMidnight ? 'bg-[#2a2a3d]' : 'bg-slate-50'}`}>
                        <tr>
                          <th className={`px-6 py-4 text-micro font-extrabold uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Sản phẩm</th>
                          <th className={`px-6 py-4 text-micro font-extrabold uppercase tracking-widest text-center ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Số lượng</th>
                          <th className={`px-6 py-4 text-micro font-extrabold uppercase tracking-widest text-right ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Đơn giá</th>
                          <th className={`px-6 py-4 text-micro font-extrabold uppercase tracking-widest text-right ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isMidnight ? 'divide-white/5 bg-white/[0.02]' : 'divide-slate-100 bg-white'}`}>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className={`transition-all ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {item.cover ? (
                                  <img src={item.cover} alt={item.title} className="w-10 h-14 object-cover rounded shadow-sm border border-white/10" />
                                ) : (
                                  <div className={`w-10 h-14 rounded flex items-center justify-center ${isMidnight ? 'bg-white/5 text-slate-700' : 'bg-slate-100 text-slate-300'}`}>
                                    <i className="fa-solid fa-book"></i>
                                  </div>
                                )}
                                <div>
                                  <p className={`text-sm font-extrabold line-clamp-1 ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{item.title}</p>
                                  <p className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>ID: {item.bookId.slice(-6)}</p>
                                </div>
                              </div>
                            </td>
                            <td className={`px-6 py-4 text-center text-sm font-extrabold ${isMidnight ? 'text-slate-300' : 'text-slate-700'}`}>x{item.quantity}</td>
                            <td className={`px-6 py-4 text-right text-sm font-bold ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>{formatPrice(item.priceAtPurchase)}</td>
                            <td className={`px-6 py-4 text-right text-sm font-extrabold ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>{formatPrice(item.priceAtPurchase * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">Trạng thái đơn hàng:</span>
                <div className="flex gap-2">
                  {orderStatusOptions.map(status => (
                    <button
                      key={status.step}
                      disabled={updatingOrderStatus}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, status.step)}
                      className={`px-4 py-2 rounded-xl text-micro font-bold uppercase tracking-premium transition-all ${
                        selectedOrder.statusStep === status.step
                        ? (status.color === 'emerald' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 ring-4 ring-emerald-50' :
                           status.color === 'indigo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50' :
                           status.color === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50' :
                           'bg-amber-600 text-white shadow-lg shadow-amber-100 ring-4 ring-amber-50')
                        : 'bg-white text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-micro uppercase tracking-premium hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
              >
                <i className="fa-solid fa-print"></i>
                <span>In hóa đơn</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
