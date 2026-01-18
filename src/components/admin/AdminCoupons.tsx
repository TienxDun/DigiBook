import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminCouponsProps {
  coupons: any[]; // Using any for now as Coupon type might not be fully defined in types.ts
  refreshData: () => void;
  theme?: 'light' | 'midnight';
}

const AdminCoupons: React.FC<AdminCouponsProps> = ({ coupons, refreshData, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
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
    <div className="space-y-6 animate-fadeIn">
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl hover:border-indigo-500/30' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/40 hover:border-slate-300'
        } flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all`}>
        <div>
          <h3 className={`text-lg font-extrabold uppercase tracking-tight ${isMidnight ? 'text-white' : 'text-slate-900'}`}>Mã khuyến mãi (Coupons)</h3>
          <p className={`text-micro font-bold uppercase tracking-premium mt-1 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Quản lý các chương trình ưu đãi của cửa hàng</p>
        </div>
        <button 
          onClick={handleOpenAddCoupon}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <i className="fa-solid fa-plus mr-2"></i>Tạo mã mới
        </button>
      </div>

      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/20'
        } rounded-[2rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
          <thead className={`${isMidnight ? 'bg-white/5' : 'bg-slate-50/50'}`}>
            <tr>
              <th className={`px-8 py-5 text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Mã code</th>
              <th className={`px-8 py-5 text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Loại giảm giá</th>
              <th className={`px-8 py-5 text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Giá trị</th>
              <th className={`px-8 py-5 text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Trạng thái</th>
              <th className={`px-8 py-5 text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Hết hạn</th>
              <th className={`px-8 py-5 text-micro font-bold uppercase tracking-premium text-center ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-100'}`}>
            {coupons.map(coupon => (
              <tr key={coupon.id} className={`transition-all ${isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                <td className="px-8 py-5">
                  <span className={`font-extrabold tracking-premium uppercase ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>{coupon.code}</span>
                </td>
                <td className="px-8 py-5 text-sm font-medium text-slate-600">
                  {coupon.discountType === 'percentage' ? 'Phần trăm (%)' : 'Cố định (đ)'}
                </td>
                <td className="px-8 py-5 text-sm font-bold text-slate-900">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}đ`}
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-micro font-bold uppercase tracking-premium ${
                    coupon.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {coupon.isActive ? 'Đang chạy' : 'Đã dừng'}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                  {coupon.expiryDate}
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleEditCoupon(coupon)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isMidnight ? 'bg-white/5 text-slate-300 hover:bg-indigo-500 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Chỉnh sửa"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isMidnight ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}
                      title="Xóa"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setIsCouponModalOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`${
                isMidnight 
                  ? 'bg-[#1e293b] border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)]' 
                  : 'bg-white border-slate-200 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)]'
              } w-full max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col border relative z-10 rounded-[2rem]`}
            >
              {/* Header */}
              <div className={`px-8 py-5 flex items-center justify-between border-b ${isMidnight ? 'border-white/5' : 'border-slate-100'}`}>
                <div>
                  <h2 className={`text-lg font-black uppercase tracking-tight ${isMidnight ? 'text-slate-100' : 'text-slate-900'}`}>
                    {editingCoupon ? 'Cấu hình ưu đãi' : 'Tạo mã voucher'}
                  </h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">Chiến dịch Marketing DigiBook</p>
                </div>
                <button 
                  onClick={() => setIsCouponModalOpen(false)} 
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                    isMidnight ? 'text-slate-500 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              
              <form onSubmit={handleSaveCoupon} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="grid grid-cols-12 gap-5">
                      <div className="col-span-12">
                        <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Mã định danh voucher *
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!!editingCoupon}
                          value={couponFormData.code || ''}
                          onChange={(e) => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})}
                          className={`w-full h-[54px] px-6 rounded-xl border transition-all font-black text-lg tracking-widest uppercase outline-none shadow-sm ${
                            isMidnight 
                            ? 'bg-white/5 border-white/5 text-indigo-400 focus:border-indigo-500' 
                            : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'
                          } ${editingCoupon ? 'opacity-40 cursor-not-allowed border-dashed' : ''}`}
                          placeholder="SummerSale2024"
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Loại hình giảm giá
                        </label>
                        <div className="relative">
                          <select
                            value={couponFormData.discountType || 'percentage'}
                            onChange={(e) => setCouponFormData({...couponFormData, discountType: e.target.value as 'percentage' | 'fixed'})}
                            className={`w-full h-[54px] px-6 rounded-xl border transition-all font-black outline-none cursor-pointer text-xs appearance-none ${
                              isMidnight 
                              ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                              : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500 shadow-sm'
                            }`}
                          >
                            <option value="percentage">Phần trăm (%)</option>
                            <option value="fixed">Số tiền cố định (đ)</option>
                          </select>
                          <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Giá trị ưu đãi ({couponFormData.discountType === 'percentage' ? '%' : 'đ'})
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={couponFormData.discountValue || 0}
                          onChange={(e) => setCouponFormData({...couponFormData, discountValue: Number(e.target.value)})}
                          className={`w-full h-[54px] px-6 rounded-xl border transition-all font-black text-sm outline-none shadow-sm ${
                            isMidnight 
                            ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                            : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Giá trị đơn tối thiểu (đ)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={couponFormData.minOrderValue || 0}
                          onChange={(e) => setCouponFormData({...couponFormData, minOrderValue: Number(e.target.value)})}
                          className={`w-full h-[54px] px-6 rounded-xl border transition-all font-black text-sm outline-none shadow-sm ${
                            isMidnight 
                            ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                            : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Tổng lượt sử dụng tối đa
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={couponFormData.usageLimit || 100}
                          onChange={(e) => setCouponFormData({...couponFormData, usageLimit: Number(e.target.value)})}
                          className={`w-full h-[54px] px-6 rounded-xl border transition-all font-black text-sm outline-none shadow-sm ${
                            isMidnight 
                            ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                            : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Hạn chót áp dụng
                        </label>
                        <input
                          type="date"
                          required
                          value={couponFormData.expiryDate || ''}
                          onChange={(e) => setCouponFormData({...couponFormData, expiryDate: e.target.value})}
                          className={`w-full h-[54px] px-6 rounded-xl border transition-all font-black text-xs outline-none shadow-sm ${
                            isMidnight 
                            ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                            : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Quyền thực thi
                        </label>
                        <div 
                          onClick={() => setCouponFormData({...couponFormData, isActive: !couponFormData.isActive})}
                          className={`h-[54px] px-6 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${
                            couponFormData.isActive 
                              ? (isMidnight ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]' : 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm')
                              : (isMidnight ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400')
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            couponFormData.isActive ? 'bg-current border-current' : 'border-slate-300'
                          }`}>
                            {couponFormData.isActive && <i className="fa-solid fa-check text-xs text-white"></i>}
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest">Kích hoạt ngay</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className={`px-8 py-5 flex items-center justify-between border-t ${isMidnight ? 'bg-white/5 border-white/10' : 'bg-slate-50/80 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isMidnight ? 'bg-emerald-500' : 'bg-emerald-400'}`}></div>
                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${isMidnight ? 'text-slate-400' : 'text-slate-500'}`}>
                      Marketing Sync
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(false)}
                      className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        isMidnight 
                        ? 'bg-white/5 text-slate-400 hover:bg-white/10' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      Hủy thao tác
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:shadow-none hover:translate-y-1 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-floppy-disk"></i>
                      )}
                      {editingCoupon ? 'Cập nhật mã' : 'Xác nhận khởi tạo'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;

