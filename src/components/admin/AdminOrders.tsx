import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { db } from '@/services/db';
import { Order, OrderItem } from '@/types';
import { ErrorHandler } from '@/services/errorHandler';
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

  const renderStatusPill = (step: number) => {
    const status = orderStatusOptions.find(s => s.step === step) || orderStatusOptions[0];
    const styles = {
      0: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
      1: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
      2: 'bg-primary/10 text-primary border-primary/20',
      3: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
    };
    const colors = {
      0: 'bg-chart-1',
      1: 'bg-chart-2',
      2: 'bg-primary',
      3: 'bg-chart-4',
    };

    return (
      <div className={`px-4 py-1.5 rounded-full text-micro font-black uppercase tracking-premium border flex items-center gap-2 justify-center ${styles[step as keyof typeof styles]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors[step as keyof typeof colors]}`}></span>
        {status.label}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Search & Stats Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-2xl shadow-primary/5'} p-8 rounded-[2.5rem] flex-1 flex flex-col md:flex-row items-center justify-between gap-6`}>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                <i className="fa-solid fa-receipt text-primary"></i>
                Đơn hàng mới
              </h3>
              <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1">Quản lý và vận hành đơn vận</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80 group">
                <input
                  type="text"
                  placeholder="Tra cứu mã đơn, tên, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full h-12 pl-12 pr-6 rounded-2xl transition-all text-sm font-bold outline-none ${isMidnight
                      ? 'bg-slate-800/50 border-white/5 text-slate-200 focus:bg-slate-800 focus:border-primary/50'
                      : 'bg-muted/30 border border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-card'
                    }`}
                />
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs group-focus-within:text-primary transition-colors"></i>
              </div>

              <button
                onClick={() => { refreshData(); toast.success('Đã làm mới dữ liệu'); }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${isMidnight
                    ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-primary hover:text-primary-foreground'
                    : 'bg-muted border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                  }`}
                title="Làm mới"
              >
                <i className="fa-solid fa-rotate"></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-[350px]">
            <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2.5rem] flex flex-col justify-center">
              <span className="text-micro font-black text-primary uppercase tracking-premium">Tổng đơn</span>
              <span className="text-2xl font-black text-foreground">{orders.length}</span>
            </div>
            <div className="bg-chart-1/5 border border-chart-1/10 p-6 rounded-[2.5rem] flex flex-col justify-center">
              <span className="text-micro font-black text-chart-1 uppercase tracking-premium">Chờ duyệt</span>
              <span className="text-2xl font-black text-foreground">{orders.filter(o => o.statusStep === 0).length}</span>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-2xl shadow-primary/5'} rounded-[2.5rem] overflow-hidden`}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className={`${isMidnight ? 'bg-slate-900/50 border-white/5' : 'border-border bg-muted/20'} border-b`}>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium">Đơn hàng</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium">Khách hàng</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium text-right">Tổng thanh toán</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium text-center">Trạng thái</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium">Thời gian</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
                {paginatedOrders.length > 0 ? paginatedOrders.map(order => (
                  <tr key={order.id} className={`group transition-all ${isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-primary/5'}`}>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primary mb-0.5">#{order.id.slice(-8).toUpperCase()}</span>
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${order.payment.method === 'COD'
                              ? (isMidnight ? 'bg-slate-700 text-slate-400' : 'bg-muted text-muted-foreground')
                              : 'bg-chart-2/10 text-chart-2'
                            }`}>
                            {order.payment.method}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-foreground">{order.customer?.name || 'Vãng lai'}</span>
                        <span className="text-micro font-bold text-muted-foreground tracking-premium">{order.customer?.phone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-base font-black text-foreground italic">{formatPrice(order.payment.total)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center group/status relative">
                        {renderStatusPill(order.statusStep)}

                        {/* Quick Change Dropdown on Hover/Click */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                          <select
                            value={order.statusStep}
                            onChange={(e) => handleUpdateOrderStatus(order.id, Number(e.target.value))}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          >
                            {orderStatusOptions.map(opt => (
                              <option key={opt.step} value={opt.step}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-micro font-black text-muted-foreground uppercase tracking-premium">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : order.date}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground/60">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${isMidnight
                              ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-primary hover:text-primary-foreground hover:border-primary'
                              : 'bg-card border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary'
                            }`}
                          title="Chi tiết đơn hàng"
                        >
                          <i className="fa-solid fa-eye text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center text-3xl">
                          <i className="fa-solid fa-inbox opacity-20"></i>
                        </div>
                        <p className="text-micro font-black uppercase tracking-premium">Chưa có dữ liệu đơn hàng</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={`px-10 py-8 border-t ${isMidnight ? 'border-white/5 bg-slate-900/20' : 'border-border bg-muted/10'}`}>
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
                onClick={() => setIsOrderModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className={`${isMidnight ? 'bg-slate-800 border-white/10' : 'bg-card border-border'} w-full max-w-4xl h-full max-h-[85vh] overflow-hidden flex flex-col relative z-20 rounded-[2.5rem] shadow-3xl`}
              >
                {/* Header */}
                <div className={`px-8 py-6 flex items-center justify-between border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/20 border-border'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                      <i className="fa-solid fa-file-invoice text-sm"></i>
                    </div>
                    <div>
                      <h2 className={`text-xl font-black tracking-tight ${isMidnight ? 'text-slate-100' : 'text-foreground'}`}>
                        Đơn #{selectedOrder.id.slice(-8).toUpperCase()}
                      </h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-premium mt-0.5">
                        Ngày đặt: {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString('vi-VN') : selectedOrder.date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOrderModalOpen(false)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${isMidnight ? 'bg-slate-700/50 text-slate-400 hover:bg-destructive/10 hover:text-destructive' : 'bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                      }`}
                  >
                    <i className="fa-solid fa-xmark text-base"></i>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <div className="space-y-6">
                    {/* Status Steps Bar */}
                    <div className={`${isMidnight ? 'bg-slate-700/20 border-white/5' : 'bg-gradient-to-r from-muted/5 to-muted/10 border-border/50'} p-5 rounded-2xl border`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black uppercase tracking-premium text-muted-foreground flex items-center gap-2">
                          <i className="fa-solid fa-signal text-[9px]"></i>
                          Trạng thái đơn hàng
                        </h4>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {orderStatusOptions.find(s => s.step === selectedOrder.statusStep)?.label || 'Chưa xác định'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {orderStatusOptions.map(status => (
                          <button
                            key={status.step}
                            disabled={updatingOrderStatus}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, status.step)}
                            className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase tracking-premium transition-all whitespace-nowrap border flex items-center gap-2 ${selectedOrder.statusStep === status.step
                                ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10'
                                : (isMidnight
                                  ? 'bg-slate-700/50 border-white/5 text-slate-400 hover:border-primary/30 hover:text-primary'
                                  : 'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary')
                              }`}
                          >
                            <span className={`w-1 h-1 rounded-full ${selectedOrder.statusStep === status.step ? 'bg-primary-foreground' : 'bg-current opacity-30'}`}></span>
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Customer Info Card */}
                      <div className={`lg:col-span-1 p-5 rounded-2xl border space-y-4 ${isMidnight ? 'bg-slate-900 border-white/5' : 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20'
                        }`}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <i className="fa-solid fa-user text-primary text-xs"></i>
                          </div>
                          <h4 className="text-[11px] font-black uppercase tracking-premium text-foreground">Người nhận</h4>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Tên khách hàng</span>
                            <span className="text-sm font-black text-foreground">{selectedOrder.customer.name}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Số điện thoại</span>
                            <span className="text-sm font-black text-primary">{selectedOrder.customer.phone}</span>
                          </div>
                          <div className={`pt-3 border-t ${isMidnight ? 'border-white/5' : 'border-border/50'}`}>
                            <span className="text-[9px] font-black uppercase text-muted-foreground block mb-2">Địa chỉ giao hàng</span>
                            <p className={`text-[11px] font-bold leading-relaxed p-3 rounded-lg border ${isMidnight ? 'bg-slate-800 border-white/5 text-slate-300' : 'bg-card/50 border-border/30 text-foreground/80'
                              }`}>
                              {selectedOrder.customer.address}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info Card */}
                      <div className={`lg:col-span-1 p-5 rounded-2xl border space-y-4 ${isMidnight ? 'bg-slate-900 border-white/5' : 'bg-gradient-to-br from-chart-1/5 to-chart-1/10 border-chart-1/20'
                        }`}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-chart-1/20 flex items-center justify-center">
                            <i className="fa-solid fa-wallet text-chart-1 text-xs"></i>
                          </div>
                          <h4 className="text-[11px] font-black uppercase tracking-premium text-foreground">Thanh toán</h4>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Phương thức</span>
                            <span className={`px-2 py-1 border rounded text-[9px] font-black uppercase tracking-premium ${isMidnight ? 'bg-slate-800 border-white/5 text-slate-300' : 'bg-card border-border text-foreground'
                              }`}>
                              {selectedOrder.payment.method}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Tiền hàng</span>
                            <span className="text-sm font-bold text-foreground">{formatPrice(selectedOrder.payment.subtotal)}</span>
                          </div>
                          {selectedOrder.payment.couponDiscount > 0 && (
                            <div className="flex items-center justify-between text-destructive">
                              <span className="text-[9px] font-black uppercase">Coupon</span>
                              <span className="text-sm font-black">-{formatPrice(selectedOrder.payment.couponDiscount)}</span>
                            </div>
                          )}
                          <div className={`flex items-center justify-between pb-3 border-b ${isMidnight ? 'border-white/5' : 'border-border/50'}`}>
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Vận chuyển</span>
                            <span className="text-sm font-bold text-foreground">+{formatPrice(selectedOrder.payment.shipping)}</span>
                          </div>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-foreground">Tổng cộng</span>
                            <span className="text-lg font-black text-primary">{formatPrice(selectedOrder.payment.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Summary Card */}
                      <div className={`lg:col-span-1 p-5 rounded-2xl border space-y-4 ${isMidnight ? 'bg-slate-900 border-white/5' : 'bg-gradient-to-br from-muted/5 to-muted/10 border-border/50'
                        }`}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center">
                            <i className="fa-solid fa-chart-line text-muted-foreground text-xs"></i>
                          </div>
                          <h4 className="text-[11px] font-black uppercase tracking-premium text-foreground">Tóm tắt</h4>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Mã đơn</span>
                            <span className="text-[10px] font-black text-primary">#{selectedOrder.id.slice(-8).toUpperCase()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Ngày đặt</span>
                            <span className="text-[10px] font-bold text-foreground">
                              {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleDateString('vi-VN') : selectedOrder.date}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Số lượng</span>
                            <span className="text-sm font-black text-chart-2">{selectedOrder.items.reduce((acc, item) => acc + item.quantity, 0)} sp</span>
                          </div>
                          <div className={`pt-3 border-t ${isMidnight ? 'border-white/5' : 'border-border/50'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase text-muted-foreground">Trạng thái</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${selectedOrder.statusStep >= 3 ? 'bg-green-500' :
                                    selectedOrder.statusStep >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}></span>
                                <span className="text-[10px] font-bold text-foreground capitalize">
                                  {orderStatusOptions.find(s => s.step === selectedOrder.statusStep)?.label || 'Chưa xác định'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Table */}
                    <div className={`p-6 rounded-2xl border space-y-4 ${isMidnight ? 'bg-slate-900 border-white/5' : 'bg-gradient-to-br from-card/50 to-card/30 border-border/50'
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black uppercase tracking-premium text-foreground flex items-center gap-2">
                          <i className="fa-solid fa-boxes-stacked text-[9px]"></i>
                          Chi tiết sản phẩm
                        </h4>
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                          {selectedOrder.items.reduce((acc, item) => acc + item.quantity, 0)} món
                        </span>
                      </div>

                      <div className={`rounded-xl border overflow-hidden ${isMidnight ? 'bg-slate-800 border-white/5' : 'bg-card/20 border-border/30'
                        }`}>
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`border-b ${isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-muted/10 border-border/30'}`}>
                              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-premium text-muted-foreground">Sản phẩm</th>
                              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-premium text-muted-foreground text-center">SL</th>
                              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-premium text-muted-foreground text-right">Tổng</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border/20'}`}>
                            {selectedOrder.items.map((item, index) => (
                              <tr key={index} className="hover:bg-primary/5 transition-all">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-10 rounded-md overflow-hidden flex-shrink-0 border bg-card ${isMidnight ? 'border-white/5' : 'border-border/30'
                                      }`}>
                                      {item.cover ? (
                                        <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-muted/20 flex items-center justify-center text-muted-foreground">
                                          <i className="fa-solid fa-book text-[9px]"></i>
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-bold text-foreground truncate max-w-[180px]">{item.title}</p>
                                      <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{formatPrice(item.priceAtPurchase)}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <span className="text-[11px] font-black text-foreground">×{item.quantity}</span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <span className="text-[11px] font-black text-primary">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className={`px-8 py-6 flex items-center justify-between border-t ${isMidnight ? 'bg-slate-900 border-white/10' : 'bg-muted/5 border-border'}`}>
                  <p className="">
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className={`px-6 h-11 rounded-xl text-micro font-black uppercase tracking-premium transition-all flex items-center gap-2.5 active:scale-95 shadow-sm ${isMidnight ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-card border border-border text-foreground hover:bg-muted'
                        }`}
                    >
                      <i className="fa-solid fa-print text-[11px]"></i>
                      <span>In đơn</span>
                    </button>
                    <button
                      onClick={() => setIsOrderModalOpen(false)}
                      className="px-6 h-11 rounded-xl bg-primary text-primary-foreground text-micro font-black uppercase tracking-premium transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary/10"
                    >
                      Hoàn thành
                    </button>
                  </div>
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

