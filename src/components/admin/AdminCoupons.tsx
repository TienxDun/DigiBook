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

  const isMidnight = theme === 'midnight';

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
    <div className="space-y-4 animate-fadeIn text-foreground">
      {/* Header Card */}
      <div className={`${
        isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'
        } flex items-center justify-between p-5 rounded-3xl border transition-all`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-primary ${isMidnight ? 'bg-primary/20' : 'bg-primary/10'}`}>
            <i className="fa-solid fa-ticket text-xl"></i>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Mã ưu đãi (Coupons)</h3>
            <p className="text-xs text-muted-foreground">Quản lý các chương trình Marketing</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAddCoupon}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group"
        >
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i>
          <span>Tạo mã mới</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className={`${
        isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'
        } rounded-3xl border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${isMidnight ? 'border-b border-white/5 bg-white/[0.02]' : 'border-b border-border/50 bg-secondary/30'}`}>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Mã Voucher</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Loại ưu đãi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Giá trị giảm</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Đơn tối thiểu</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
              {coupons.map((coupon, idx) => (
                <motion.tr 
                  key={coupon.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`group transition-colors ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-secondary/20'}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className="font-bold tracking-wider uppercase text-primary text-sm px-3 py-1 bg-primary/10 rounded-lg">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {coupon.discountType === 'percentage' ? 'Phần trăm (%)' : 'Số tiền cố định (đ)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-foreground">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}đ`}
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground">
                    {coupon.minOrderValue ? `${coupon.minOrderValue.toLocaleString()}đ` : 'Không yêu cầu'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                        coupon.isActive 
                        ? 'bg-success/10 text-success border-success/20' 
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        <i className={`fa-solid ${coupon.isActive ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                        {coupon.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditCoupon(coupon)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${
                          isMidnight 
                            ? 'bg-white/5 border-white/5 text-slate-400 hover:border-primary hover:text-primary' 
                            : 'bg-background border-border text-muted-foreground hover:border-primary hover:text-primary'
                        }`}
                        title="Chỉnh sửa"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${
                          isMidnight 
                            ? 'bg-white/5 border-white/5 text-slate-400 hover:border-destructive hover:text-destructive' 
                            : 'bg-background border-border text-muted-foreground hover:border-destructive hover:text-destructive'
                        }`}
                        title="Xóa"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {coupons.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-3xl bg-secondary/50 flex items-center justify-center mx-auto mb-6 border border-border/50 text-muted-foreground/30">
                <i className="fa-solid fa-ticket text-3xl"></i>
              </div>
              <h3 className="text-sm font-bold text-muted-foreground">Chưa có mã ưu đãi nào</h3>
              <p className="text-xs text-muted-foreground/60 mt-1">Phát hành voucher để tăng tỷ lệ chuyển đổi đơn hàng.</p>
              <button 
                onClick={handleOpenAddCoupon}
                className="mt-6 text-primary font-bold text-xs hover:underline"
              >
                Tạo mã ưu đãi ngay
              </button>
            </div>
          )}
        </div>
      </div>

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
                    ? 'bg-slate-800 border-white/10 shadow-2xl' 
                    : 'bg-card border-border shadow-2xl'
                } w-full max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col border relative z-10 rounded-3xl`}
              >
                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${isMidnight ? 'border-white/5' : 'border-border'}`}>
                  <div>
                    <h2 className={`text-base font-bold uppercase ${isMidnight ? 'text-slate-100' : 'text-foreground'}`}>
                      {editingCoupon ? 'Chỉnh sửa ưu đãi' : 'Tạo mã voucher mới'}
                    </h2>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Hệ thống DigiBook</p>
                  </div>
                  <button 
                    onClick={() => setIsCouponModalOpen(false)} 
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                      isMidnight ? 'text-slate-500 hover:bg-white/5' : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                
                <form onSubmit={handleSaveCoupon} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="space-y-5">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12">
                          <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Mã Voucher *
                          </label>
                          <input
                            type="text"
                            required
                            disabled={!!editingCoupon}
                            value={couponFormData.code || ''}
                            onChange={(e) => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})}
                            className={`w-full h-10 px-4 rounded-xl border transition-all font-bold text-sm tracking-widest uppercase outline-none ${
                              isMidnight 
                              ? 'bg-slate-700/50 border-white/5 text-primary focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            } ${editingCoupon ? 'opacity-50 cursor-not-allowed' : ''}`}
                            placeholder="DI GIBOOK2024"
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Loại giảm giá
                          </label>
                          <div className="relative">
                            <select
                              value={couponFormData.discountType || 'percentage'}
                              onChange={(e) => setCouponFormData({...couponFormData, discountType: e.target.value as 'percentage' | 'fixed'})}
                              className={`w-full h-10 px-4 rounded-xl border transition-all font-bold outline-none cursor-pointer text-xs appearance-none ${
                                isMidnight 
                                ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary' 
                                : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                              }`}
                            >
                              <option value="percentage">Phần trăm (%)</option>
                              <option value="fixed">Số tiền cố định (đ)</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] pointer-events-none"></i>
                          </div>
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Giá trị ({couponFormData.discountType === 'percentage' ? '%' : 'đ'})
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={couponFormData.discountValue || 0}
                            onChange={(e) => setCouponFormData({...couponFormData, discountValue: Number(e.target.value)})}
                            className={`w-full h-10 px-4 rounded-xl border transition-all font-bold text-sm outline-none ${
                              isMidnight 
                              ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Đơn tối thiểu (đ)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={couponFormData.minOrderValue || 0}
                            onChange={(e) => setCouponFormData({...couponFormData, minOrderValue: Number(e.target.value)})}
                            className={`w-full h-10 px-4 rounded-xl border transition-all font-bold text-sm outline-none ${
                              isMidnight 
                              ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Lượt dùng tối đa
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={couponFormData.usageLimit || 100}
                            onChange={(e) => setCouponFormData({...couponFormData, usageLimit: Number(e.target.value)})}
                            className={`w-full h-10 px-4 rounded-xl border transition-all font-bold text-sm outline-none ${
                              isMidnight 
                              ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Ngày hết hạn
                          </label>
                          <input
                            type="date"
                            required
                            value={couponFormData.expiryDate || ''}
                            onChange={(e) => setCouponFormData({...couponFormData, expiryDate: e.target.value})}
                            className={`w-full h-10 px-4 rounded-xl border transition-all font-bold text-xs outline-none ${
                              isMidnight 
                              ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary' 
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                            }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'}`}>
                            Trạng thái
                          </label>
                          <button
                            type="button" 
                            onClick={() => setCouponFormData({...couponFormData, isActive: !couponFormData.isActive})}
                            className={`h-10 px-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all w-full ${
                              couponFormData.isActive 
                                ? 'bg-success/5 border-success/20 text-success'
                                : 'bg-slate-500/5 border-border text-muted-foreground/50'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                              couponFormData.isActive ? 'bg-success border-success' : 'border-muted-foreground/30'
                            }`}>
                              {couponFormData.isActive && <i className="fa-solid fa-check text-[8px] text-white"></i>}
                            </div>
                            <span className="text-[11px] font-bold">Kích hoạt ngay</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`px-6 py-4 flex items-center justify-end gap-2 border-t ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-secondary/30 border-border'}`}>
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(false)}
                      className={`px-5 h-10 rounded-xl font-bold text-xs transition-all ${
                        isMidnight 
                        ? 'text-slate-400 hover:bg-white/5' 
                        : 'bg-card text-muted-foreground border border-border hover:bg-secondary'
                      }`}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 h-10 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-check"></i>
                      )}
                      {editingCoupon ? 'Cập nhật' : 'Tạo mới'}
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

