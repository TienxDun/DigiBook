import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { db, Order, OrderItem } from '../../services/db';
import { ErrorHandler } from '../../services/errorHandler';
import Pagination from '../Pagination';
import { motion, AnimatePresence } from 'framer-motion';

// Portal component for rendering modals outside DOM structure
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return createPortal(children, document.body);
};

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

  // Lock scroll when modal is open
  React.useEffect(() => {
    if (isOrderModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOrderModalOpen]);

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
    <>
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
                        ? (isMidnight 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10' 
                            : 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-600 border border-emerald-100 shadow-lg shadow-emerald-100') :
                        order.statusStep === 2 
                        ? (isMidnight 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10' 
                            : 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 border border-indigo-100 shadow-lg shadow-indigo-100') :
                        order.statusStep === 1 
                        ? (isMidnight 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10' 
                            : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 border border-blue-100 shadow-lg shadow-blue-100') :
                        (isMidnight 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/10' 
                            : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 border border-amber-100 shadow-lg shadow-amber-100')
                      }`}
                    >
                      {orderStatusOptions.map(status => (
                        <option key={status.step} value={status.step} className={`font-bold uppercase tracking-premium ${isMidnight ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-900'}`}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <i className={`fa-solid fa-chevron-down text-xs ${isMidnight ? 'text-white/20' : 'text-slate-400'}`}></i>
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
    </div>

    {/* Order Details Modal */}
    <AnimatePresence>
      {isOrderModalOpen && selectedOrder && (
        <Portal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
              onClick={() => setIsOrderModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className={`${
                isMidnight 
                  ? 'bg-[#1e293b] border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)]' 
                  : 'bg-white border-slate-200 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)]'
              } w-full max-w-[1024px] max-h-[95vh] overflow-hidden flex flex-col border relative z-20 rounded-3xl`}
            >
                {/* Header */}
                <div className={`px-8 py-5 flex items-center justify-between border-b ${isMidnight ? 'border-white/5' : 'border-slate-100'}`}>
                  <div>
                    <h2 className={`text-lg font-black uppercase tracking-tight ${isMidnight ? 'text-slate-100' : 'text-slate-900'}`}>
                      Thông tin đơn hàng #{selectedOrder.id.slice(-8)}
                    </h2>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      Khởi tạo lúc: {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString('vi-VN') : selectedOrder.date}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsOrderModalOpen(false)} 
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                      isMidnight ? 'text-slate-500 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="max-w-4xl mx-auto space-y-8">
                    {/* Status Steps Bar */}
                    <div className={`flex items-center gap-4 overflow-x-auto no-scrollbar py-1 ${isMidnight ? 'border-b border-white/5 pb-8' : 'border-b border-slate-100 pb-8'}`}>
                      <span className={`text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Duyệt trạng thái:</span>
                      <div className="flex gap-2">
                        {orderStatusOptions.map(status => (
                          <button
                            key={status.step}
                            disabled={updatingOrderStatus}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, status.step)}
                            className={`px-4 h-11 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                              selectedOrder.statusStep === status.step
                              ? (status.color === 'emerald' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' :
                                 status.color === 'indigo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' :
                                 status.color === 'blue' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' :
                                 'bg-amber-600 text-white shadow-lg shadow-amber-500/25')
                              : (isMidnight ? 'bg-white/5 text-slate-500 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-100 hover:shadow-sm')
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                      {/* Customer Info Card */}
                      <div className="col-span-12 md:col-span-6">
                        <div className={`p-6 rounded-3xl border h-full ${
                          isMidnight ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'
                        }`}>
                          <div className="flex items-center gap-3 mb-6">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${isMidnight ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                              <i className="fa-solid fa-user"></i>
                            </div>
                            <h4 className={`text-xs font-bold uppercase tracking-widest ${isMidnight ? 'text-slate-300' : 'text-slate-900'}`}>Người mua hàng</h4>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between group">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Họ và tên</span>
                              <span className={`text-sm font-black ${isMidnight ? 'text-white' : 'text-slate-900'}`}>{selectedOrder.customer.name}</span>
                            </div>
                            <div className="flex items-center justify-between group">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Số điện thoại</span>
                              <span className={`text-sm font-black ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>{selectedOrder.customer.phone}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 border-t border-dashed border-slate-200">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Địa chỉ nhận hàng</span>
                              <span className={`text-xs font-bold leading-relaxed ${isMidnight ? 'text-slate-400' : 'text-slate-700'}`}>{selectedOrder.customer.address}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info Card */}
                      <div className="col-span-12 md:col-span-6">
                        <div className={`p-6 rounded-3xl border h-full ${
                          isMidnight ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'
                        }`}>
                          <div className="flex items-center gap-3 mb-6">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${isMidnight ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                              <i className="fa-solid fa-credit-card"></i>
                            </div>
                            <h4 className={`text-xs font-bold uppercase tracking-widest ${isMidnight ? 'text-slate-300' : 'text-slate-900'}`}>Thanh toán</h4>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Phụ phí & Giảm giá</span>
                              <div className="flex gap-2">
                                {selectedOrder.payment.couponDiscount > 0 && (
                                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[10px] font-black uppercase tracking-widest">
                                    Voucher
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 ${isMidnight ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-600 border border-slate-100'} rounded text-[10px] font-black uppercase tracking-widest`}>
                                  {selectedOrder.payment.method}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Tạm tính</span>
                              <span className={`text-[10px] font-bold ${isMidnight ? 'text-slate-300' : 'text-slate-700'}`}>{formatPrice(selectedOrder.payment.subtotal)}</span>
                            </div>
                            {selectedOrder.payment.couponDiscount > 0 && (
                              <div className="flex items-center justify-between text-rose-500">
                                <span className="text-[10px] font-black uppercase tracking-widest">Giảm giá mã quà tặng</span>
                                <span className="text-[10px] font-black">-{formatPrice(selectedOrder.payment.couponDiscount)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phí vận chuyển</span>
                              <span className={`text-[10px] font-bold ${isMidnight ? 'text-slate-300' : 'text-slate-700'}`}>+{formatPrice(selectedOrder.payment.shipping)}</span>
                            </div>
                            <div className={`pt-3 mt-1 border-t flex items-center justify-between ${isMidnight ? 'border-white/10' : 'border-slate-200'}`}>
                              <span className={`text-xs font-black uppercase tracking-[0.2em] ${isMidnight ? 'text-white' : 'text-slate-900'}`}>Tổng hóa đơn</span>
                              <span className={`text-xl font-black ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>{formatPrice(selectedOrder.payment.total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items List */}
                      <div className="col-span-12">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xs font-black uppercase tracking-widest ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Danh mục sản phẩm</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${isMidnight ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                              {selectedOrder.items.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm
                            </span>
                          </div>
                        </div>
                        
                        <div className={`rounded-3xl border overflow-hidden ${isMidnight ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className={`${isMidnight ? 'bg-white/5' : 'bg-slate-50'} border-b ${isMidnight ? 'border-white/5' : 'border-slate-100'}`}>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sản phẩm</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">SL</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Đơn giá</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-100'}`}>
                              {selectedOrder.items.map((item, index) => (
                                <tr key={index} className={`group transition-all ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform border border-slate-100">
                                        {item.cover ? (
                                          <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                            <i className="fa-solid fa-book text-[10px]"></i>
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`text-xs font-black truncate max-w-[200px] mb-0.5 ${isMidnight ? 'text-slate-100' : 'text-slate-900'}`}>{item.title}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{item.bookId.slice(-6)}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`text-[10px] font-black ${isMidnight ? 'text-slate-400' : 'text-slate-600'}`}>x {item.quantity}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className={`text-[10px] font-bold ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>{formatPrice(item.priceAtPurchase)}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <span className={`text-[10px] font-black ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>{formatPrice(item.priceAtPurchase * item.quantity)}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className={`px-8 py-5 flex items-center justify-end gap-3 border-t ${isMidnight ? 'bg-white/5 border-white/10' : 'bg-slate-50/80 border-slate-100'}`}>
                  <button
                    onClick={() => window.print()}
                    className={`px-6 h-11 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                      isMidnight 
                      ? 'bg-white/5 text-slate-400 hover:bg-white/10' 
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <i className="fa-solid fa-print"></i>
                    <span>In phiếu</span>
                  </button>
                  <button
                    onClick={() => setIsOrderModalOpen(false)}
                    className="px-8 h-11 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:shadow-none active:scale-95"
                  >
                    Hoàn tất
                  </button>
                </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </AnimatePresence>
    </>
  );
};

export default AdminOrders;

