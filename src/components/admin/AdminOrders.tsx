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

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, refreshData }) => {
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
          <div className="bg-card/40 backdrop-blur-md border border-border p-8 rounded-[2.5rem] flex-1 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-primary/5">
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
                  className="w-full h-12 pl-12 pr-6 rounded-2xl bg-muted/30 border border-border transition-all text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-card"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs group-focus-within:text-primary transition-colors"></i>
              </div>
              
              <button 
                onClick={() => { refreshData(); toast.success('Đã làm mới dữ liệu'); }}
                className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm active:scale-95"
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
        <div className="bg-card/40 backdrop-blur-md border border-border rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium">Đơn hàng</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium">Khách hàng</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium text-right">Tổng thanh toán</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium text-center">Trạng thái</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium">Thời gian</th>
                  <th className="px-8 py-6 text-micro font-black text-muted-foreground uppercase tracking-premium text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedOrders.length > 0 ? paginatedOrders.map(order => (
                  <tr key={order.id} className="group hover:bg-primary/5 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primary mb-0.5">#{order.id.slice(-8).toUpperCase()}</span>
                        <div className="flex gap-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${order.payment.method === 'COD' ? 'bg-muted text-muted-foreground' : 'bg-chart-2/10 text-chart-2'}`}>
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
                          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm active:scale-95"
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
            <div className="px-10 py-8 border-t border-border bg-muted/10">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
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
              className="bg-card border border-border w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col relative z-20 rounded-[3.5rem] shadow-3xl shadow-primary/10"
            >
                {/* Header */}
                <div className="px-10 py-8 flex items-center justify-between border-b border-border bg-muted/20">
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                        <i className="fa-solid fa-file-invoice"></i>
                      </div>
                      Đơn hàng #{selectedOrder.id.slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1 ml-[60px]">
                      Khởi tạo: {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleString('vi-VN') : selectedOrder.date}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsOrderModalOpen(false)} 
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-95"
                  >
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                  <div className="max-w-5xl mx-auto space-y-12">
                    {/* Status Steps Bar */}
                    <div className="bg-card/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-border shadow-sm">
                      <h4 className="text-micro font-black uppercase tracking-premium text-muted-foreground mb-6 flex items-center gap-2">
                         <i className="fa-solid fa-signal text-xs"></i>
                         Quy trình xử lý vận đơn
                      </h4>
                      <div className="flex flex-wrap gap-4">
                        {orderStatusOptions.map(status => (
                          <button
                            key={status.step}
                            disabled={updatingOrderStatus}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, status.step)}
                            className={`px-8 h-14 rounded-2xl text-micro font-black uppercase tracking-premium transition-all whitespace-nowrap border-2 flex items-center gap-3 ${
                              selectedOrder.statusStep === status.step
                              ? 'bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105'
                              : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${selectedOrder.statusStep === status.step ? 'bg-primary-foreground animate-pulse' : 'bg-current opacity-30'}`}></span>
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                      {/* Customer Info Card */}
                      <div className="col-span-12 lg:col-span-6">
                        <div className="p-8 rounded-[2.5rem] bg-muted/20 border border-border h-full relative group">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-sm">
                              <i className="fa-solid fa-user-tag text-sm"></i>
                            </div>
                            <h4 className="text-micro font-black uppercase tracking-premium text-foreground">Người thụ hưởng</h4>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <span className="text-micro font-bold uppercase tracking-premium text-muted-foreground">Khách hàng</span>
                              <span className="text-sm font-black text-foreground">{selectedOrder.customer.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-micro font-bold uppercase tracking-premium text-muted-foreground">Liên lạc</span>
                              <span className="text-sm font-black text-primary">{selectedOrder.customer.phone}</span>
                            </div>
                            <div className="pt-6 border-t border-border">
                              <span className="text-micro font-bold uppercase tracking-premium text-muted-foreground block mb-2">Địa chỉ giao hàng</span>
                              <p className="text-xs font-bold leading-relaxed text-foreground bg-card/50 p-4 rounded-2xl border border-border/50">
                                {selectedOrder.customer.address}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info Card */}
                      <div className="col-span-12 lg:col-span-6">
                        <div className="p-8 rounded-[2.5rem] bg-muted/20 border border-border h-full">
                          <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center text-chart-1 shadow-sm">
                              <i className="fa-solid fa-wallet text-sm"></i>
                            </div>
                            <h4 className="text-micro font-black uppercase tracking-premium text-foreground">Thông tin thanh toán</h4>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-micro font-bold uppercase tracking-premium text-muted-foreground">Phương thức</span>
                              <div className="flex gap-2">
                                {selectedOrder.payment.couponDiscount > 0 && (
                                  <span className="px-3 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-micro font-black uppercase tracking-premium">
                                    Voucher
                                  </span>
                                )}
                                <span className="px-3 py-1 bg-card text-foreground border border-border shadow-sm rounded-full text-micro font-black uppercase tracking-premium">
                                  {selectedOrder.payment.method}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-micro font-bold uppercase tracking-premium text-muted-foreground">Giá trị hàng</span>
                              <span className="text-sm font-bold text-foreground">{formatPrice(selectedOrder.payment.subtotal)}</span>
                            </div>
                            {selectedOrder.payment.couponDiscount > 0 && (
                              <div className="flex items-center justify-between text-destructive">
                                <span className="text-micro font-black uppercase tracking-premium">Ưu đãi giảm giá</span>
                                <span className="text-sm font-black">-{formatPrice(selectedOrder.payment.couponDiscount)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between pb-6 border-b border-border">
                              <span className="text-micro font-bold uppercase tracking-premium text-muted-foreground">Phí vận chuyển</span>
                              <span className="text-sm font-bold text-foreground">+{formatPrice(selectedOrder.payment.shipping)}</span>
                            </div>
                            <div className="pt-2 flex items-center justify-between">
                              <span className="text-micro font-black uppercase tracking-premium text-foreground italic">Tổng thanh toán</span>
                              <span className="text-2xl font-black text-primary">{formatPrice(selectedOrder.payment.total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items List */}
                      <div className="col-span-12">
                        <div className="flex items-center justify-between mb-6 px-4">
                          <div className="flex items-center gap-3">
                            <h4 className="text-micro font-black uppercase tracking-premium text-muted-foreground flex items-center gap-2">
                               <i className="fa-solid fa-boxes-stacked text-xs"></i>
                               Chi tiết kiện hàng
                            </h4>
                            <span className="px-3 py-1 rounded-full text-micro font-black uppercase tracking-premium bg-primary/10 text-primary border border-primary/20">
                              {selectedOrder.items.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm
                            </span>
                          </div>
                        </div>
                        
                        <div className="rounded-[2.5rem] border border-border overflow-hidden bg-card/30 backdrop-blur-md shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-muted/30 border-b border-border">
                                <th className="px-8 py-5 text-micro font-black uppercase tracking-premium text-muted-foreground">Sản phẩm</th>
                                <th className="px-8 py-5 text-micro font-black uppercase tracking-premium text-muted-foreground text-center">SL</th>
                                <th className="px-8 py-5 text-micro font-black uppercase tracking-premium text-muted-foreground text-right">Đơn giá</th>
                                <th className="px-8 py-5 text-micro font-black uppercase tracking-premium text-muted-foreground text-right">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {selectedOrder.items.map((item, index) => (
                                <tr key={index} className="group hover:bg-primary/5 transition-all">
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-6">
                                      <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform shadow-md border border-border">
                                        {item.cover ? (
                                          <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                                            <i className="fa-solid fa-book text-sm"></i>
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-black text-foreground truncate max-w-[300px] mb-1">{item.title}</p>
                                        <div className="flex items-center gap-2">
                                           <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded">#{item.bookId.slice(-6).toUpperCase()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 text-center">
                                    <span className="text-sm font-black text-foreground antialiased opacity-60">× {item.quantity}</span>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <span className="text-sm font-bold text-muted-foreground tracking-tight">{formatPrice(item.priceAtPurchase)}</span>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <span className="text-base font-black text-primary tracking-tight italic">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
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
                <div className="px-10 py-8 flex items-center justify-between border-t border-border bg-muted/10">
                  <p className="text-micro font-bold text-muted-foreground italic flex items-center gap-2">
                     <i className="fa-solid fa-keyboard text-xs"></i>
                     Nhấn Esc để đóng nhanh
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => window.print()}
                      className="px-8 h-12 rounded-2xl bg-card border border-border text-foreground text-micro font-black uppercase tracking-premium transition-all flex items-center gap-3 hover:bg-muted active:scale-95 shadow-sm"
                    >
                      <i className="fa-solid fa-print"></i>
                      <span>In hóa đơn</span>
                    </button>
                    <button
                      onClick={() => setIsOrderModalOpen(false)}
                      className="px-12 h-14 bg-primary text-primary-foreground rounded-2xl text-micro font-black uppercase tracking-premium hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-95"
                    >
                      Xác nhận & Đóng
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

