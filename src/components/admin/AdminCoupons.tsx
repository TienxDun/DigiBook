import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '@/services/db';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Coupon } from '@/types';
import Pagination from '../ui/Pagination';
import { ErrorHandler } from '@/services/errorHandler';

// Portal component for rendering modals outside DOM structure
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

interface AdminCouponsProps {
  coupons: Coupon[];
  refreshData: () => void;
  theme?: 'light' | 'midnight';
}

const AdminCoupons: React.FC<AdminCouponsProps> = ({ coupons, refreshData, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [couponFormData, setCouponFormData] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    usageLimit: 100,
    expiryDate: '',
    isActive: true,
    usedCount: 0
  });

  // Lock scroll when modal is open
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
      isActive: true,
      usedCount: 0
    });
    setIsCouponModalOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponFormData({ ...coupon });
    setIsCouponModalOpen(true);
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (window.confirm(`Bạn có chắc muốn xóa mã khuyến mãi "${coupon.code}"?`)) {
      try {
        await db.deleteCoupon(coupon.id!);
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
      const finalCoupon = {
        ...couponFormData,
        code: couponFormData.code?.toUpperCase()
      } as Coupon;

      await db.saveCoupon(finalCoupon);
      toast.success(editingCoupon ? 'Cập nhật mã khuyến mãi thành công' : 'Đã tạo mã khuyến mãi mới');
      setIsCouponModalOpen(false);
      refreshData();
    } catch (err: any) {
      ErrorHandler.handle(err, 'lưu mã khuyến mãi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectCoupon = (id: string) => {
    setSelectedCoupons(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleSelectAllCoupons = () => {
    if (selectedCoupons.length === filteredCoupons.length) {
      setSelectedCoupons([]);
    } else {
      setSelectedCoupons(filteredCoupons.map(c => c.id || '').filter(Boolean));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCoupons.length === 0) return;
    if (window.confirm(`Xóa vĩnh viễn ${selectedCoupons.length} mã giảm giá đã chọn?`)) {
      setIsDeletingBulk(true);
      try {
        await Promise.all(selectedCoupons.map(id => db.deleteCoupon(id)));
        toast.success(`Đã xóa ${selectedCoupons.length} mã giảm giá`);
        setSelectedCoupons([]);
        refreshData();
      } catch (err) {
        ErrorHandler.handle(err, 'xóa hàng loạt mã giảm giá');
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  // Filter & Pagination
  const filteredCoupons = useMemo(() => {
    if (!searchTerm) return coupons;
    const lowerTerm = searchTerm.toLowerCase();
    return coupons.filter(c =>
      c.code.toLowerCase().includes(lowerTerm) ||
      (c.discountType === 'percentage' ? 'phần trăm' : 'cố định').includes(lowerTerm)
    );
  }, [coupons, searchTerm]);

  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice((currentPage - 1) * itemsPerPage, itemsPerPage * currentPage);

  return (
    <div className="space-y-6 animate-fadeIn text-foreground">
      {/* Coupons Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng mã giảm', value: coupons.length, icon: 'fa-ticket', color: 'primary' },
          { label: 'Đang hoạt động', value: coupons.filter(c => c.isActive).length, icon: 'fa-circle-check', color: 'chart-1' },
          { label: 'Đã hết hạn', value: coupons.filter(c => new Date(c.expiryDate) < new Date()).length, icon: 'fa-clock-rotate-left', color: 'destructive' },
          { label: 'Tạm dừng', value: coupons.filter(c => !c.isActive).length, icon: 'fa-circle-pause', color: 'muted' }
        ].map((stat, i) => (
          <div key={i} className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'} p-6 rounded-[2rem] border group transition-all hover:border-primary/50`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg bg-${stat.color}/10 text-${stat.color.replace('muted', 'slate-500')} border border-${stat.color}/20 shadow-sm group-hover:scale-110 transition-transform`}>
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-xl border-border shadow-xl shadow-slate-200/30'} flex flex-wrap items-center justify-between gap-6 p-5 rounded-[2.5rem] border transition-all hover:border-primary/20 sticky top-0 z-30`}>
        {/* Search & Stats Group */}
        <div className="flex flex-wrap items-center gap-5 flex-1 min-w-[300px]">
          <div className="relative group flex-1 max-w-md">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMidnight ? 'bg-slate-700 text-slate-400' : 'bg-muted text-muted-foreground'
              } group-focus-within:bg-primary group-focus-within:text-primary-foreground group-focus-within:shadow-lg group-focus-within:shadow-primary/20`}>
              <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm voucher..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className={`w-full h-12 pl-16 pr-5 rounded-2xl text-xs font-bold outline-none border transition-all ${isMidnight
                ? 'bg-slate-800/50 border-white/5 text-slate-200 focus:bg-slate-800'
                : 'bg-card border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/5'
                }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full transition-all flex items-center justify-center ${isMidnight ? 'bg-slate-700 text-slate-400 hover:bg-destructive' : 'bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground'
                  }`}
              >
                <i className="fa-solid fa-xmark text-[10px]"></i>
              </button>
            )}
          </div>

          <div className={`h-8 w-px hidden xl:block ${isMidnight ? 'bg-white/5' : 'bg-border'}`}></div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tổng:</span>
            <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">{coupons.length}</span>
          </div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddCoupon}
            className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-3 group active:scale-95"
          >
            <i className="fa-solid fa-plus text-xs group-hover:rotate-90 transition-transform duration-300"></i>
            Tạo ưu đãi
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedCoupons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`bg-card/40 backdrop-blur-md border-primary/20 shadow-xl flex items-center justify-between p-4 rounded-[2rem] border ${isMidnight ? 'bg-[#1e293b]/40' : ''}`}
          >
            <div className="flex items-center gap-4 ml-2">
              <span className="text-micro font-black text-primary uppercase tracking-premium">Đã chọn {selectedCoupons.length} voucher</span>
              <div className="h-4 w-px bg-border/60"></div>
              <button
                onClick={() => setSelectedCoupons([])}
                className="text-micro font-bold uppercase tracking-premium transition-colors text-muted-foreground hover:text-primary"
              >
                Bỏ chọn
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={isDeletingBulk}
                className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-5 py-2.5 rounded-xl text-micro font-bold uppercase tracking-premium transition-all shadow-sm flex items-center gap-2"
              >
                <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
                <span>Xóa ({selectedCoupons.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupons Table */}
      <div className={`${isMidnight ? 'bg-[#1e293b] border-white/5' : 'bg-card backdrop-blur-xl border-border shadow-2xl'} rounded-[2.5rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className={`border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/30 border-border'}`}>
                <th className="px-4 py-5 w-16 text-center">
                  <div
                    onClick={toggleSelectAllCoupons}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedCoupons.length === filteredCoupons.length && filteredCoupons.length > 0
                      ? 'bg-primary border-primary text-primary-foreground'
                      : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-card')
                      }`}
                  >
                    {selectedCoupons.length === filteredCoupons.length && filteredCoupons.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
                  </div>
                </th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Mã Voucher</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Loại ưu đãi</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Giá trị giảm</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Đơn tối thiểu</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Trạng thái</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
              {paginatedCoupons.length > 0 ? paginatedCoupons.map((coupon, idx) => (
                <motion.tr
                  key={coupon.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group transition-all ${selectedCoupons.includes(coupon.id!) ? (isMidnight ? 'bg-primary/10' : 'bg-primary/5') : (isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-muted/30')}`}
                >
                  <td className="px-4 py-4 text-center">
                    <div
                      onClick={() => toggleSelectCoupon(coupon.id!)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedCoupons.includes(coupon.id!)
                        ? 'bg-primary border-primary text-primary-foreground'
                        : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-card') + ' group-hover:border-primary/50'
                        }`}
                    >
                      {selectedCoupons.includes(coupon.id!) && <i className="fa-solid fa-check text-xs"></i>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10">
                        <i className="fa-solid fa-ticket"></i>
                      </div>
                      <div>
                        <span className="font-black tracking-widest uppercase text-primary text-sm block">{coupon.code}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          Hết hạn: {new Date(coupon.expiryDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-xs font-bold text-muted-foreground bg-secondary/50 px-3 py-1 rounded-lg border border-border/50">
                      {coupon.discountType === 'percentage' ? 'Phần trăm (%)' : 'Số tiền cố định'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-foreground">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `-${coupon.discountValue.toLocaleString()}đ`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-muted-foreground">{coupon.minOrderValue ? `${coupon.minOrderValue.toLocaleString()}đ` : 'Không giới hạn'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${coupon.isActive
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-emerald-500' : 'bg-destructive'}`}></span>
                        {coupon.isActive ? 'Active' : 'Stopped'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${isMidnight
                          ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-primary hover:text-primary hover:bg-slate-700'
                          : 'bg-muted text-foreground hover:bg-primary/10 hover:text-primary'
                          }`}
                        title="Chỉnh sửa"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${isMidnight
                          ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-destructive hover:text-destructive hover:bg-slate-700'
                          : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          }`}
                        title="Xóa"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                        <i className="fa-solid fa-ticket-simple text-3xl text-muted-foreground/30"></i>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Không tìm thấy voucher phù hợp</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t ${isMidnight ? 'border-white/5 bg-slate-900/40' : 'border-border/50 bg-secondary/20'}`}>
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

      {/* Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <Portal>
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 text-foreground">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setIsCouponModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`${isMidnight
                  ? 'bg-slate-800 border-white/10 shadow-2xl'
                  : 'bg-card border-border shadow-2xl'
                  } w-full max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col border relative z-10 rounded-[2.5rem]`}
              >
                {/* Header */}
                <div className={`px-8 py-6 flex items-center justify-between border-b ${isMidnight ? 'border-white/5 bg-slate-900/50' : 'border-border bg-muted/30'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                      <i className={`fa-solid ${editingCoupon ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
                    </div>
                    <div>
                      <h2 className={`text-xl font-black uppercase tracking-tight ${isMidnight ? 'text-slate-100' : 'text-foreground'}`}>
                        {editingCoupon ? 'Chỉnh sửa ưu đãi' : 'Tạo mã voucher mới'}
                      </h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-premium mt-0.5">Thiết lập chương trình khuyến mãi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCouponModalOpen(false)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isMidnight ? 'text-slate-500 hover:bg-white/5' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                </div>

                <form onSubmit={handleSaveCoupon} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-6">
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12">
                          <label className={`text-[10px] font-black uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'} ml-1`}>
                            Mã Voucher *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              disabled={!!editingCoupon}
                              value={couponFormData.code || ''}
                              onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                              className={`w-full h-12 pl-12 pr-4 rounded-2xl border transition-all font-black text-sm tracking-[0.2em] uppercase outline-none ${isMidnight
                                ? 'bg-slate-700/50 border-white/5 text-primary focus:border-primary'
                                : 'bg-secondary/50 border-border focus:bg-card focus:border-primary focus:shadow-lg focus:shadow-primary/5'
                                } ${editingCoupon ? 'opacity-50 cursor-not-allowed' : ''}`}
                              placeholder="SUMMER2024"
                            />
                            <i className="fa-solid fa-ticket absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                          </div>
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-black uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'} ml-1`}>
                            Loại giảm giá
                          </label>
                          <div className="relative">
                            <select
                              value={couponFormData.discountType || 'percentage'}
                              onChange={(e) => setCouponFormData({ ...couponFormData, discountType: e.target.value as 'percentage' | 'fixed' })}
                              className={`w-full h-12 px-4 rounded-2xl border transition-all font-bold outline-none cursor-pointer text-xs appearance-none ${isMidnight
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
                          <label className={`text-[10px] font-black uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'} ml-1`}>
                            Giá trị ({couponFormData.discountType === 'percentage' ? '%' : 'đ'})
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={couponFormData.discountValue || 0}
                            onChange={(e) => setCouponFormData({ ...couponFormData, discountValue: Number(e.target.value) })}
                            className={`w-full h-12 px-4 rounded-2xl border transition-all font-bold text-sm outline-none ${isMidnight
                              ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary'
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                              }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-black uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'} ml-1`}>
                            Đơn tối thiểu (đ)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={couponFormData.minOrderValue || 0}
                            onChange={(e) => setCouponFormData({ ...couponFormData, minOrderValue: Number(e.target.value) })}
                            className={`w-full h-12 px-4 rounded-2xl border transition-all font-bold text-sm outline-none ${isMidnight
                              ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary'
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                              }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-black uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'} ml-1`}>
                            Lượt dùng tối đa
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={couponFormData.usageLimit || 100}
                            onChange={(e) => setCouponFormData({ ...couponFormData, usageLimit: Number(e.target.value) })}
                            className={`w-full h-12 px-4 rounded-2xl border transition-all font-bold text-sm outline-none ${isMidnight
                              ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary'
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                              }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-black uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'} ml-1`}>
                            Ngày hết hạn
                          </label>
                          <input
                            type="date"
                            required
                            value={couponFormData.expiryDate || ''}
                            onChange={(e) => setCouponFormData({ ...couponFormData, expiryDate: e.target.value })}
                            className={`w-full h-12 px-4 rounded-2xl border transition-all font-bold text-xs outline-none ${isMidnight
                              ? 'bg-slate-700/50 border-white/5 text-white focus:border-primary'
                              : 'bg-secondary/50 border-border focus:bg-card focus:border-primary'
                              }`}
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-[10px] font-black uppercase tracking-wider mb-2 block ${isMidnight ? 'text-slate-500' : 'text-muted-foreground'} ml-1`}>
                            Trạng thái
                          </label>
                          <button
                            type="button"
                            onClick={() => setCouponFormData({ ...couponFormData, isActive: !couponFormData.isActive })}
                            className={`h-12 px-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all w-full ${couponFormData.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-destructive/5 border-destructive/20 text-destructive'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${couponFormData.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-destructive text-white'
                              }`}>
                              <i className={`fa-solid ${couponFormData.isActive ? 'fa-check' : 'fa-xmark'} text-[10px]`}></i>
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">{couponFormData.isActive ? 'Đang hoạt động' : 'Tạm dừng'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className={`px-8 py-6 flex items-center justify-end gap-3 border-t ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-secondary/30 border-border/50'}`}>
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(false)}
                      className={`px-6 h-12 rounded-2xl font-black text-micro uppercase tracking-widest transition-all hover:bg-black/5 active:scale-95 ${isMidnight
                        ? 'text-slate-400'
                        : 'text-muted-foreground'
                        }`}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 h-12 bg-primary text-primary-foreground rounded-2xl font-black text-micro uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center gap-2 active:scale-95"
                    >
                      {isSubmitting ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-check"></i>
                      )}
                      {editingCoupon ? 'Lưu thay đổi' : 'Tạo voucher'}
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

