import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from '@/shared/utils/toast';
import { db } from '@/services/db';
import { Order, OrderItem } from '@/shared/types';
import { ErrorHandler } from '@/services/errorHandler';
import { Pagination } from '@/shared/components';
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
      <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-2 justify-center ${styles[step as keyof typeof styles]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors[step as keyof typeof colors]}`}></span>
        {status.label}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'} p-6 rounded-[2rem] border flex items-center justify-between`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Tổng đơn hàng</p>
              <p className="text-2xl font-black text-foreground">{orders.length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <i className="fa-solid fa-receipt"></i>
            </div>
          </div>

          <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'} p-6 rounded-[2rem] border flex items-center justify-between`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-chart-1 mb-1">Đơn chờ duyệt</p>
              <p className="text-2xl font-black text-foreground">{orders.filter(o => o.statusStep === 0).length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg bg-chart-1/10 text-chart-1 border border-chart-1/20 shadow-sm">
              <i className="fa-solid fa-clock"></i>
            </div>
          </div>
        </div>

        {/* Sticky Toolbar */}
        <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-xl border-border shadow-xl shadow-slate-200/30'} flex flex-wrap items-center justify-between gap-6 p-5 rounded-[2.5rem] border transition-all hover:border-primary/20 sticky top-0 z-30`}>
          <div className="flex flex-wrap items-center gap-5 flex-1 min-w-[300px]">
            <div className="relative group flex-1 max-w-md">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMidnight ? 'bg-slate-700 text-slate-400' : 'bg-muted text-muted-foreground'
                } group-focus-within:bg-primary group-focus-within:text-primary-foreground group-focus-within:shadow-lg group-focus-within:shadow-primary/20`}>
                <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
              </div>
              <input
                type="text"
                placeholder="Tra cứu mã đơn, tên, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-12 pl-16 pr-5 rounded-2xl text-xs font-bold outline-none border transition-all ${isMidnight
                  ? 'bg-slate-800/50 border-white/5 text-slate-200 focus:bg-slate-800'
                  : 'bg-card border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/5'
                  }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full transition-all flex items-center justify-center ${isMidnight ? 'bg-slate-700 text-slate-400 hover:bg-destructive' : 'bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground'
                    }`}
                >
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              )}
            </div>

            <div className={`h-8 w-px hidden xl:block ${isMidnight ? 'bg-white/5' : 'bg-border'}`}></div>

            <button
              onClick={() => { refreshData(); toast.success('Đã làm mới dữ liệu'); }}
              className={`h-12 px-6 rounded-2xl font-bold transition-all shadow-sm border flex items-center gap-2 group ${isMidnight
                ? 'bg-slate-800 border-white/10 text-slate-400 hover:text-primary hover:bg-slate-700'
                : 'bg-card border-border text-muted-foreground hover:text-primary hover:bg-muted'
                }`}
            >
              <i className="fa-solid fa-rotate-right group-hover:rotate-180 transition-transform duration-500"></i>
              <span className="text-xs uppercase tracking-wider">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className={`${isMidnight ? 'bg-[#1e293b] border-white/5' : 'bg-card backdrop-blur-xl border-border shadow-2xl'} rounded-[2.5rem] border overflow-hidden`}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className={`${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/30 border-border'} border-b`}>
                  <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Đơn hàng</th>
                  <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Khách hàng</th>
                  <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-right">Tổng thanh toán</th>
                  <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Trạng thái</th>
                  <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Thời gian</th>
                  <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
                {paginatedOrders.length > 0 ? paginatedOrders.map(order => (
                  <tr key={order.id} className={`group transition-all ${isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-muted/30'}`}>
                    <td className="px-4 py-4">
                      <div className="flex bg-primary/10 w-fit px-2 py-1 rounded-lg">
                        <span className="text-sm font-black text-primary">#{order.id.slice(-8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isMidnight ? 'bg-slate-700 text-slate-300' : 'bg-muted text-muted-foreground'}`}>
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground line-clamp-1">{order.customer?.name || 'Vãng lai'}</p>
                          <p className="text-xs text-muted-foreground">{order.customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide mr-3 ${order.payment.method === 'COD'
                        ? (isMidnight ? 'bg-slate-700 text-slate-400' : 'bg-muted text-muted-foreground')
                        : 'bg-chart-2/10 text-chart-2'
                        }`}>
                        {order.payment.method}
                      </span>
                      <span className="text-base font-black text-foreground">{formatPrice(order.payment.total)}</span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-center group/status relative">
                        {renderStatusPill(order.statusStep)}
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
                    <td className="px-4 py-4 text-sm font-medium text-muted-foreground">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : order.date}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleViewOrderDetails(order)}
                        className={`w-9 h-9 rounded-lg inline-flex items-center justify-center transition-all shadow-sm active:scale-95 ${isMidnight
                          ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-primary hover:text-primary-foreground hover:border-primary'
                          : 'bg-card border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary'
                          }`}
                        title="Chi tiết đơn hàng"
                      >
                        <i className="fa-solid fa-eye text-xs"></i>
                      </button>
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
                className={`${isMidnight ? 'bg-slate-900 border-white/10' : 'bg-card border-border'} w-full max-w-5xl h-full max-h-[90vh] overflow-hidden flex flex-col relative z-20 rounded-[2.5rem] shadow-4xl`}
              >
                {/* Header */}
                <div className={`px-8 py-6 flex items-center justify-between border-b ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/20 border-border'}`}>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                      <i className="fa-solid fa-file-invoice text-xl"></i>
                    </div>
                    <div>
                      <h2 className={`text-2xl font-black tracking-tight ${isMidnight ? 'text-slate-100' : 'text-foreground'}`}>
                        Đơn #{selectedOrder.id.slice(-8).toUpperCase()}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
                        <p className="text-sm font-medium text-muted-foreground">
                          Ngày đặt: {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString('vi-VN') : selectedOrder.date}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOrderModalOpen(false)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${isMidnight ? 'bg-slate-700/50 text-slate-400 hover:bg-destructive/10 hover:text-destructive' : 'bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                      }`}
                  >
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="space-y-8">
                    {/* Status Steps Bar */}
                    <div className={`${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-card border-border'} p-6 rounded-3xl border shadow-sm`}>
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <i className="fa-solid fa-signal text-xs"></i>
                          Trạng thái đơn hàng
                        </h4>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedOrder.statusStep >= 3 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50' :
                          selectedOrder.statusStep >= 2 ? 'bg-blue-500/10 text-blue-600 border-blue-200/50' :
                            selectedOrder.statusStep >= 1 ? 'bg-amber-500/10 text-amber-600 border-amber-200/50' :
                              'bg-slate-500/10 text-slate-600 border-slate-200/50'
                          }`}>
                          {orderStatusOptions.find(s => s.step === selectedOrder.statusStep)?.label || 'Chưa xác định'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {orderStatusOptions.map(status => (
                          <button
                            key={status.step}
                            disabled={updatingOrderStatus}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, status.step)}
                            className={`px-5 h-11 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-3 ${selectedOrder.statusStep === status.step
                              ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                              : (isMidnight
                                ? 'bg-slate-700/30 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted hover:text-foreground')
                              }`}
                          >
                            <span className={`w-2 h-2 rounded-full ring-2 ring-offset-1 ring-offset-transparent ${selectedOrder.statusStep === status.step ? 'bg-white ring-white/30' : 'bg-current opacity-30 ring-transparent'}`}></span>
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Customer Info Card */}
                      <div className={`lg:col-span-1 p-6 rounded-3xl border space-y-5 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-card border-border shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <i className="fa-solid fa-user text-sm"></i>
                          </div>
                          <h4 className="text-sm font-bold text-foreground">Người nhận</h4>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Tên khách hàng</span>
                            <span className="text-base font-bold text-foreground">{selectedOrder.customer.name}</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Số điện thoại</span>
                            <span className="text-base font-bold text-foreground font-mono">{selectedOrder.customer.phone}</span>
                          </div>
                          <div className={`pt-4 border-t ${isMidnight ? 'border-white/5' : 'border-border/50'}`}>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2.5">Địa chỉ giao hàng</span>
                            <p className={`text-sm font-medium leading-relaxed p-4 rounded-xl border ${isMidnight ? 'bg-slate-900/50 border-white/5 text-slate-300' : 'bg-muted/30 border-border/50 text-foreground/80'}`}>
                              {selectedOrder.customer.address}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info Card */}
                      <div className={`lg:col-span-1 p-6 rounded-3xl border space-y-5 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-card border-border shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                            <i className="fa-solid fa-wallet text-sm"></i>
                          </div>
                          <h4 className="text-sm font-bold text-foreground">Thanh toán</h4>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phương thức</span>
                            <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider ${isMidnight ? 'bg-slate-700/50 border-white/5 text-slate-300' : 'bg-muted/50 border-border text-foreground'
                              }`}>
                              {selectedOrder.payment.method}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Tiền hàng</span>
                            <span className="text-sm font-bold text-foreground">{formatPrice(selectedOrder.payment.subtotal)}</span>
                          </div>
                          {selectedOrder.payment.couponDiscount > 0 && (
                            <div className="flex items-center justify-between text-rose-500">
                              <span className="text-[10px] font-black uppercase tracking-wider">Coupon</span>
                              <span className="text-sm font-bold">-{formatPrice(selectedOrder.payment.couponDiscount)}</span>
                            </div>
                          )}
                          <div className={`flex items-center justify-between pb-3 border-b ${isMidnight ? 'border-white/5' : 'border-border/50'}`}>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Vận chuyển</span>
                            <span className="text-sm font-bold text-foreground">+{formatPrice(selectedOrder.payment.shipping)}</span>
                          </div>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Tổng cộng</span>
                            <span className="text-xl font-black text-primary">{formatPrice(selectedOrder.payment.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Summary Card */}
                      <div className={`lg:col-span-1 p-6 rounded-3xl border space-y-5 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-card border-border shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <i className="fa-solid fa-chart-pie text-sm"></i>
                          </div>
                          <h4 className="text-sm font-bold text-foreground">Tóm tắt</h4>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Mã đơn</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground font-mono">#{selectedOrder.id.slice(-8).toUpperCase()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ngày đặt</span>
                            <span className="text-sm font-bold text-foreground">
                              {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleDateString('vi-VN') : selectedOrder.date}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Số lượng</span>
                            <span className="text-sm font-black text-foreground">{selectedOrder.items.reduce((acc, item) => acc + item.quantity, 0)} sp</span>
                          </div>
                          <div className={`pt-3 border-t ${isMidnight ? 'border-white/5' : 'border-border/50'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Trạng thái</span>
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${selectedOrder.statusStep >= 3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                  selectedOrder.statusStep >= 2 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' :
                                    selectedOrder.statusStep >= 1 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' :
                                      'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                  }`}></span>
                                <span className="text-xs font-bold text-foreground capitalize">
                                  {orderStatusOptions.find(s => s.step === selectedOrder.statusStep)?.label || 'Chưa xác định'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Table */}
                    <div className={`p-6 rounded-3xl border space-y-5 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-card border-border shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                            <i className="fa-solid fa-layer-group text-xs"></i>
                          </div>
                          Chi tiết sản phẩm
                        </h4>
                        <span className="text-xs font-bold text-foreground bg-muted px-3 py-1.5 rounded-full border border-border">
                          {selectedOrder.items.reduce((acc, item) => acc + item.quantity, 0)} món
                        </span>
                      </div>

                      <div className={`rounded-2xl border overflow-hidden ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-card border-border/50'
                        }`}>
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`border-b ${isMidnight ? 'bg-slate-800/80 border-white/5' : 'bg-muted/30 border-border/50'}`}>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Sản phẩm</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground text-center">SL</th>
                              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right">Tổng</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border/20'}`}>
                            {selectedOrder.items.map((item, index) => (
                              <tr key={index} className="hover:bg-primary/5 transition-all">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 border bg-card shadow-sm ${isMidnight ? 'border-white/10' : 'border-border/30'
                                      }`}>
                                      {item.cover ? (
                                        <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-muted/20 flex items-center justify-center text-muted-foreground">
                                          <i className="fa-solid fa-book text-xs"></i>
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 py-1">
                                      <p className="text-sm font-bold text-foreground truncate max-w-[250px] mb-1">{item.title}</p>
                                      <p className="text-xs text-muted-foreground font-medium">{formatPrice(item.priceAtPurchase)}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-sm font-bold text-foreground px-2 py-1 rounded-md bg-muted/50">×{item.quantity}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-sm font-black text-primary">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
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
                <div className={`px-8 py-6 flex items-center justify-between border-t ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/20 border-border'}`}>
                  <p className="text-xs font-medium text-muted-foreground">
                    * Đơn hàng đã bao gồm VAT nếu có
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => window.print()}
                      className={`px-6 h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 active:scale-95 shadow-sm border ${isMidnight ? 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700' : 'bg-card border-border text-foreground hover:bg-muted'
                        }`}
                    >
                      <i className="fa-solid fa-print text-sm opacity-70"></i>
                      <span>In đơn hàng</span>
                    </button>
                    <button
                      onClick={() => setIsOrderModalOpen(false)}
                      className="px-8 h-12 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary/25"
                    >
                      Đóng
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

