import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Portal component for rendering modals outside DOM structure
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return createPortal(children, document.body);
};

interface AdminCouponsProps {
  coupons: any[]; // Using any for now as Coupon type might not be fully defined in types.ts
  refreshData: () => void;
  theme?: 'light' | 'midnight';
}

const AdminCoupons: React.FC<AdminCouponsProps> = ({ coupons, refreshData, theme = 'light' }) => {
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponFormData, setCouponFormData] = useState<any>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    usageLimit: 100,
    expiryDate: '',
    isActive: true
  });

  // Khóa cuộn trang khi mở popup
  useEffect(() => {
    if (isCouponModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCouponModalOpen]);

  const handleOpenAddCoupon = () => {
    setEditingCoupon(null);
    setCouponFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderValue: 0,
      usageLimit: 100,
      expiryDate: '',
      isActive: true
    });
    setIsCouponModalOpen(true);
  };

  const handleEditCoupon = (coupon: any) => {
    setEditingCoupon(coupon);
    setCouponFormData({ ...coupon });
    setIsCouponModalOpen(true);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa mã khuyến mãi này?')) {
      try {
        await db.deleteCoupon(id);
        toast.success('Đã xóa mã khuyến mãi');
        refreshData();
      } catch (err: any) {
        toast.error('Lỗi: ' + (err.message || 'Không thể xóa mã khuyến mãi'));
      }
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await db.saveCoupon(couponFormData);
      toast.success(editingCoupon ? 'Cập nhật mã khuyến mãi thành công' : 'Đã tạo mã khuyến mãi mới');
      setIsCouponModalOpen(false);
      refreshData();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || 'Không thể lưu mã khuyến mãi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-foreground">
      {/* Header Card */}
      <div className="bg-card/40 backdrop-blur-md border border-border shadow-3xl flex flex-wrap items-center justify-between gap-6 p-8 rounded-[2.5rem] transition-all hover:border-primary/20">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <i className="fa-solid fa-ticket text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Mã ưu đãi (Coupons)</h3>
            <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Quản lý các chương trình Marketing
            </p>
          </div>
        </div>
        <button 
          onClick={handleOpenAddCoupon}
          className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/25 flex items-center gap-3 group"
        >
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i>
          <span>Tạo mã mới</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-card/40 backdrop-blur-md border border-border shadow-3xl rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Mã định danh</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Loại ưu đãi</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Giá trị giảm</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Đơn tối thiểu</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Trạng thái</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {coupons.map((coupon, idx) => (
                <motion.tr 
                  key={coupon.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group transition-all duration-300 hover:bg-secondary/30"
                >
                  <td className="p-8">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                      <span className="font-black tracking-widest uppercase text-primary text-base">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="text-sm font-bold text-muted-foreground">
                      {coupon.discountType === 'percentage' ? 'Phần trăm (%)' : 'Cố định (đ)'}
                    </span>
                  </td>
                  <td className="p-8 text-base font-black text-foreground">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}đ`}
                  </td>
                  <td className="p-8 text-sm font-semibold text-muted-foreground">
                    {coupon.minOrderValue ? `${coupon.minOrderValue.toLocaleString()}đ` : 'Không yêu cầu'}
                  </td>
                  <td className="p-8">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-micro font-black uppercase tracking-widest ${
                      coupon.isActive 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`}></span>
                      {coupon.isActive ? 'Đang hoạt động' : 'Đã tạm dừng'}
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleEditCoupon(coupon)}
                        className="w-11 h-11 flex items-center justify-center rounded-2xl bg-background border border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm active:scale-95"
                        title="Chỉnh sửa"
                      >
                        <i className="fa-solid fa-pen-to-square text-sm"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="w-11 h-11 flex items-center justify-center rounded-2xl bg-background border border-border text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/5 transition-all shadow-sm active:scale-95"
                        title="Xóa"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {coupons.length === 0 && (
            <div className="p-24 text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center mx-auto mb-8 shadow-inner border border-border/50">
                <i className="fa-solid fa-ticket text-4xl text-muted-foreground/30"></i>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chưa có mã ưu đãi nào</h3>
              <p className="text-xs font-semibold text-muted-foreground/60 mt-2">Phát hành voucher để tăng tỷ lệ chuyển đổi đơn hàng.</p>
              <button 
                onClick={handleOpenAddCoupon}
                className="mt-8 text-primary font-black uppercase tracking-premium text-micro border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
              >
                Phát hành Voucher ngay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <Portal>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCouponModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-xl bg-card border border-border shadow-3xl rounded-[3.5rem] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-10 py-8 border-b border-border/50 flex items-center justify-between bg-card/50 backdrop-blur-xl">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                      {editingCoupon ? 'Cập nhật Voucher' : 'Thiết lập ưu đãi mới'}
                    </h2>
                    <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1">Chiến dịch ưu đãi bán hàng</p>
                  </div>
                  <button 
                    onClick={() => setIsCouponModalOpen(false)} 
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-secondary text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    <i className="fa-solid fa-times text-lg"></i>
                  </button>
                </div>
                
                <form onSubmit={handleSaveCoupon} className="p-10 space-y-8 overflow-y-auto custom-scrollbar max-h-[75vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="col-span-full space-y-3">
                      <label className="text-micro font-black text-muted-foreground uppercase tracking-widest ml-1">Mã định danh (CODE) *</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingCoupon}
                        value={couponFormData.code || ''}
                        onChange={(e) => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})}
                        className="w-full px-6 py-4 rounded-[1.5rem] border border-border bg-secondary/30 text-primary font-black tracking-[0.2em] outline-none focus:border-primary focus:bg-card transition-all disabled:opacity-50 text-base"
                        placeholder="VD: GIAMGIA2024"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-micro font-black text-muted-foreground uppercase tracking-widest ml-1">Loại hình giảm</label>
                      <select
                        value={couponFormData.discountType || 'percentage'}
                        onChange={(e) => setCouponFormData({...couponFormData, discountType: e.target.value as 'percentage' | 'fixed'})}
                        className="w-full px-6 py-4 rounded-[1.5rem] border border-border bg-secondary/30 text-foreground font-bold outline-none focus:border-primary focus:bg-card transition-all appearance-none cursor-pointer"
                      >
                        <option value="percentage">Phần trăm (%)</option>
                        <option value="fixed">Số tiền (đ)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-micro font-black text-muted-foreground uppercase tracking-widest ml-1">
                        Giá trị giảm ({couponFormData.discountType === 'percentage' ? '%' : 'đ'})
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={couponFormData.discountValue || 0}
                        onChange={(e) => setCouponFormData({...couponFormData, discountValue: Number(e.target.value)})}
                        className="w-full px-6 py-4 rounded-[1.5rem] border border-border bg-secondary/30 text-foreground font-black outline-none focus:border-primary focus:bg-card transition-all"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-micro font-black text-muted-foreground uppercase tracking-widest ml-1">Đơn tối thiểu (đ)</label>
                      <input
                        type="number"
                        min="0"
                        value={couponFormData.minOrderValue || 0}
                        onChange={(e) => setCouponFormData({...couponFormData, minOrderValue: Number(e.target.value)})}
                        className="w-full px-6 py-4 rounded-[1.5rem] border border-border bg-secondary/30 text-foreground font-bold outline-none focus:border-primary focus:bg-card transition-all"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-micro font-black text-muted-foreground uppercase tracking-widest ml-1">Giới hạn lượt dùng</label>
                      <input
                        type="number"
                        min="1"
                        value={couponFormData.usageLimit || 100}
                        onChange={(e) => setCouponFormData({...couponFormData, usageLimit: Number(e.target.value)})}
                        className="w-full px-6 py-4 rounded-[1.5rem] border border-border bg-secondary/30 text-foreground font-bold outline-none focus:border-primary focus:bg-card transition-all"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-micro font-black text-muted-foreground uppercase tracking-widest ml-1">Ngày hết hạn</label>
                      <input
                        type="date"
                        value={couponFormData.expiryDate || ''}
                        onChange={(e) => setCouponFormData({...couponFormData, expiryDate: e.target.value})}
                        className="w-full px-6 py-4 rounded-[1.5rem] border border-border bg-secondary/30 text-foreground font-bold outline-none focus:border-primary focus:bg-card transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-1 ml-1 col-span-full">
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={couponFormData.isActive}
                          onChange={(e) => setCouponFormData({...couponFormData, isActive: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                        <span className="ml-3 text-micro font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">Kích hoạt mã khuyến mãi</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(false)}
                      className="flex-1 py-5 rounded-[1.5rem] text-micro font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-all"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[1.5] bg-primary text-primary-foreground py-5 rounded-[1.5rem] text-micro font-black uppercase tracking-widest hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-save"></i>
                      )}
                      <span>{editingCoupon ? 'Cập nhật nâng cao' : 'Khởi tạo Voucher'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;

      {/* Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 text-foreground">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
                onClick={() => setIsCouponModalOpen(false)}
              />

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`${
                  isMidnight 
                    ? 'bg-[#1e293b] border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)]' 
                    : 'bg-card border-border shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)]'
                } w-full max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col border relative z-10 rounded-3xl`}
              >
                {/* Header */}
                <div className={`px-8 py-5 flex items-center justify-between border-b ${isMidnight ? 'border-white/5' : 'border-border'}`}>
                  <div>
                    <h2 className={`text-lg font-black uppercase tracking-tight ${isMidnight ? 'text-slate-100' : 'text-foreground'}`}>
                      {editingCoupon ? 'Cấu hình ưu đãi' : 'Tạo mã voucher'}
                    </h2>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-0.5">Chiến dịch Marketing DigiBook</p>
                  </div>
                  <button 
                    onClick={() => setIsCouponModalOpen(false)} 
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                      isMidnight ? 'text-slate-500 hover:bg-white/5' : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                
                <form onSubmit={handleSaveCoupon} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-6">
                      <div className="grid grid-cols-12 gap-5">
                        <div className="col-span-12">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Mã định danh voucher *
                          </label>
                          <input
                            type="text"
                            required
                            disabled={!!editingCoupon}
                            value={couponFormData.code || ''}
                            onChange={(e) => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})}
                            className={`w-full h-11 px-6 rounded-2xl border transition-all font-black text-sm tracking-widest uppercase outline-none ${
                              isMidnight 
                              ? 'bg-white/5 border-white/5 text-primary focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            } ${editingCoupon ? 'opacity-40 cursor-not-allowed border-dashed' : ''}`}
                            placeholder="SummerSale2024"
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Loại hình giảm giá
                          </label>
                          <div className="relative">
                            <select
                              value={couponFormData.discountType || 'percentage'}
                              onChange={(e) => setCouponFormData({...couponFormData, discountType: e.target.value as 'percentage' | 'fixed'})}
                              className={`w-full h-11 px-6 rounded-2xl border transition-all font-black outline-none cursor-pointer text-xs appearance-none ${
                                isMidnight 
                                ? 'bg-white/5 border-white/5 text-white focus:border-primary' 
                                : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                              }`}
                            >
                              <option value="percentage">Phần trăm (%)</option>
                              <option value="fixed">Số tiền cố định (đ)</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none"></i>
                          </div>
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Giá trị ưu đãi ({couponFormData.discountType === 'percentage' ? '%' : 'đ'})
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={couponFormData.discountValue || 0}
                            onChange={(e) => setCouponFormData({...couponFormData, discountValue: Number(e.target.value)})}
                            className={`w-full h-11 px-6 rounded-2xl border transition-all font-black text-sm outline-none ${
                              isMidnight 
                              ? 'bg-white/5 border-white/5 text-white focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Giá trị đơn tối thiểu (đ)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={couponFormData.minOrderValue || 0}
                            onChange={(e) => setCouponFormData({...couponFormData, minOrderValue: Number(e.target.value)})}
                            className={`w-full h-11 px-6 rounded-2xl border transition-all font-black text-sm outline-none ${
                              isMidnight 
                              ? 'bg-white/5 border-white/5 text-white focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Tổng lượt sử dụng tối đa
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={couponFormData.usageLimit || 100}
                            onChange={(e) => setCouponFormData({...couponFormData, usageLimit: Number(e.target.value)})}
                            className={`w-full h-11 px-6 rounded-2xl border transition-all font-black text-sm outline-none ${
                              isMidnight 
                              ? 'bg-white/5 border-white/5 text-white focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Hạn chót áp dụng
                          </label>
                          <input
                            type="date"
                            required
                            value={couponFormData.expiryDate || ''}
                            onChange={(e) => setCouponFormData({...couponFormData, expiryDate: e.target.value})}
                            className={`w-full h-11 px-6 rounded-2xl border transition-all font-black text-xs outline-none ${
                              isMidnight 
                              ? 'bg-white/5 border-white/5 text-white focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Quyền thực thi
                          </label>
                          <div 
                            onClick={() => setCouponFormData({...couponFormData, isActive: !couponFormData.isActive})}
                            className={`h-11 px-6 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all ${
                              couponFormData.isActive 
                                ? (isMidnight ? 'bg-success/10 border-success/20 text-success' : 'bg-success/10 border-success/20 text-success')
                                : (isMidnight ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-secondary/50 border-border text-muted-foreground/30')
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              couponFormData.isActive ? 'bg-current border-current' : 'border-current'
                            }`}>
                              {couponFormData.isActive && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">Kích hoạt ngay</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`px-8 py-5 flex items-center justify-end gap-3 border-t ${isMidnight ? 'bg-white/5 border-white/10' : 'bg-secondary/80 border-border'}`}>
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(false)}
                      className={`px-6 h-11 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        isMidnight 
                        ? 'bg-white/5 text-slate-400 hover:bg-white/10' 
                        : 'bg-card text-muted-foreground border border-border hover:bg-secondary shadow-sm'
                      }`}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 h-11 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl hover:shadow-none active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-floppy-disk"></i>
                      )}
                      {editingCoupon ? 'Cập nhật' : 'Phát hành'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;

