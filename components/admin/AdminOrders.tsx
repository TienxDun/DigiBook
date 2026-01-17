import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { db, Order, OrderItem } from '../../services/db';
import { ErrorHandler } from '../../services/errorHandler';

interface AdminOrdersProps {
  orders: Order[];
  refreshData: () => Promise<void>;
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

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, refreshData }) => {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone.includes(searchQuery)
    );
  }, [orders, searchQuery]);

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
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Danh sách đơn hàng</h3>
          <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Quản lý và cập nhật trạng thái đơn hàng</p>
        </div>
        <div className="relative group w-full sm:w-80">
          <input 
            type="text" 
            placeholder="Tìm theo mã đơn, tên khách, SĐT..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 ring-indigo-50 font-bold shadow-sm transition-all text-sm"
          />
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1100px]">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Mã đơn</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Khách hàng</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Tổng tiền</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Trạng thái</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Ngày đặt</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length > 0 ? filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-5 text-sm font-bold text-slate-900">#{order.id.slice(-8)}</td>
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-700">{order.customer?.name || 'N/A'}</span>
                    <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">{order.customer?.phone}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm font-bold text-indigo-600">{formatPrice(order.payment.total)}</td>
                <td className="px-8 py-5">
                  <select
                    disabled={updatingOrderStatus}
                    value={order.statusStep}
                    onChange={(e) => handleUpdateOrderStatus(order.id, Number(e.target.value))}
                    className={`px-4 py-2 rounded-xl text-micro font-bold uppercase tracking-premium border-none outline-none cursor-pointer transition-all shadow-sm ${
                      order.statusStep === 3 ? 'bg-emerald-50 text-emerald-600' :
                      order.statusStep === 2 ? 'bg-indigo-50 text-indigo-600' :
                      order.statusStep === 1 ? 'bg-blue-50 text-blue-600' :
                      'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {orderStatusOptions.map(status => (
                      <option key={status.step} value={status.step} className="font-bold uppercase tracking-premium bg-white">
                        {status.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-8 py-5 text-sm text-slate-500 font-medium whitespace-nowrap">
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : order.date}
                </td>
                <td className="px-8 py-5 text-center">
                  <button 
                    onClick={() => handleViewOrderDetails(order)}
                    className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    <i className="fa-solid fa-eye text-xs"></i>
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <i className="fa-solid fa-inbox text-6xl text-slate-200"></i>
                    <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">Không tìm thấy đơn hàng nào</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[999] p-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsOrderModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 animate-scaleIn">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Chi tiết đơn hàng #{selectedOrder.id.slice(-8)}</h3>
                <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Ngày đặt: {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString('vi-VN') : selectedOrder.date}</p>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white transition-all text-slate-400 hover:text-rose-500 shadow-sm">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Customer Info */}
                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
                  <h4 className="text-micro font-bold text-indigo-600 uppercase tracking-premium mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-user"></i> Thông tin khách hàng
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Họ tên:</span>
                      <span className="text-sm font-extrabold text-slate-900">{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Số điện thoại:</span>
                      <span className="text-sm font-extrabold text-slate-900">{selectedOrder.customer.phone}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Địa chỉ:</span>
                      <span className="text-sm font-extrabold text-slate-900 text-right">{selectedOrder.customer.address}</span>
                    </div>
                    {selectedOrder.customer.note && (
                      <div className="pt-2 border-t border-indigo-100">
                        <span className="text-xs font-bold text-slate-500">Ghi chú:</span>
                        <p className="text-xs font-bold text-indigo-600 mt-1">"{selectedOrder.customer.note}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50">
                  <h4 className="text-micro font-bold text-emerald-600 uppercase tracking-premium mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-credit-card"></i> Thanh toán
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Phương thức:</span>
                      <span className="text-sm font-extrabold text-slate-900">{selectedOrder.payment.method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Tạm tính:</span>
                      <span className="text-sm font-extrabold text-slate-900">{formatPrice(selectedOrder.payment.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-500">
                      <span className="text-xs font-bold">Giảm giá:</span>
                      <span className="text-sm font-extrabold">-{formatPrice(selectedOrder.payment.discount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Phí vận chuyển:</span>
                      <span className="text-sm font-extrabold text-slate-900">{formatPrice(selectedOrder.payment.shipping)}</span>
                    </div>
                    <div className="pt-3 border-t border-emerald-100 flex justify-between items-center">
                      <span className="text-sm font-extrabold text-slate-900">Tổng cộng:</span>
                      <span className="text-xl font-black text-emerald-600">{formatPrice(selectedOrder.payment.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="text-micro font-bold text-slate-400 uppercase tracking-premium mb-4">Sản phẩm đã đặt</h4>
                <div className="border border-slate-100 rounded-3xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-6 py-4 text-micro font-bold text-slate-400 uppercase tracking-premium">Sản phẩm</th>
                        <th className="px-6 py-4 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">Số lượng</th>
                        <th className="px-6 py-4 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Đơn giá</th>
                        <th className="px-6 py-4 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.cover ? (
                                <img src={item.cover} alt={item.title} className="w-10 h-14 object-cover rounded shadow-sm" />
                              ) : (
                                <div className="w-10 h-14 bg-slate-100 rounded flex items-center justify-center text-slate-300">
                                  <i className="fa-solid fa-book"></i>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-extrabold text-slate-900 line-clamp-1">{item.title}</p>
                                <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">ID: {item.id.slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-extrabold text-slate-700">x{item.quantity}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-500">{formatPrice(item.price)}</td>
                          <td className="px-6 py-4 text-right text-sm font-extrabold text-indigo-600">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                        ? `bg-${status.color}-600 text-white shadow-lg shadow-${status.color}-100 ring-4 ring-${status.color}-50`
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
