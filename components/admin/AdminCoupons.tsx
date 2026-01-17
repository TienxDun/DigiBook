import React, { useState } from 'react';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';

interface AdminCouponsProps {
  coupons: any[]; // Using any for now as Coupon type might not be fully defined in types.ts
  refreshData: () => void;
}

const AdminCoupons: React.FC<AdminCouponsProps> = ({ coupons, refreshData }) => {
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [couponFormData, setCouponFormData] = useState<any>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    usageLimit: 100,
    expiryDate: '',
    isActive: true
  });

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
    try {
      await db.saveCoupon(couponFormData);
      toast.success(editingCoupon ? 'Cập nhật mã khuyến mãi thành công' : 'Đã tạo mã khuyến mãi mới');
      setIsCouponModalOpen(false);
      refreshData();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || 'Không thể lưu mã khuyến mãi'));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Mã khuyến mãi (Coupons)</h3>
          <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Quản lý các chương trình ưu đãi của cửa hàng</p>
        </div>
        <button 
          onClick={handleOpenAddCoupon}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <i className="fa-solid fa-plus mr-2"></i>Tạo mã mới
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Mã code</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Loại giảm giá</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Giá trị</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Trạng thái</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium">Hết hạn</th>
              <th className="px-8 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.map(coupon => (
              <tr key={coupon.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-5">
                  <span className="font-extrabold text-indigo-600 tracking-premium uppercase">{coupon.code}</span>
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
                      className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
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

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center sm:sticky sm:top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-extrabold text-slate-900">
                {editingCoupon ? 'Chỉnh sửa mã' : 'Tạo mã khuyến mãi mới'}
              </h2>
              <button 
                onClick={() => setIsCouponModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveCoupon} className="p-8 space-y-6">
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Mã code ưu đãi *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingCoupon}
                  value={couponFormData.code || ''}
                  onChange={(e) => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-extrabold text-indigo-600 tracking-premium disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                  placeholder="VD: SUMMER2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Loại hình</label>
                  <select
                    value={couponFormData.discountType || 'percentage'}
                    onChange={(e) => setCouponFormData({...couponFormData, discountType: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-bold outline-none"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">
                    {couponFormData.discountType === 'percentage' ? 'Giá trị (%)' : 'Giá trị (đ)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={couponFormData.discountValue || 0}
                    onChange={(e) => setCouponFormData({...couponFormData, discountValue: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Đơn tối thiểu (đ)</label>
                  <input
                    type="number"
                    min="0"
                    value={couponFormData.minOrderValue || 0}
                    onChange={(e) => setCouponFormData({...couponFormData, minOrderValue: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Giới hạn sử dụng</label>
                  <input
                    type="number"
                    min="1"
                    value={couponFormData.usageLimit || 100}
                    onChange={(e) => setCouponFormData({...couponFormData, usageLimit: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Thời hạn kết thúc</label>
                <input
                  type="date"
                  required
                  value={couponFormData.expiryDate || ''}
                  onChange={(e) => setCouponFormData({...couponFormData, expiryDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-bold"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[1.25rem]">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={couponFormData.isActive ?? true}
                  onChange={(e) => setCouponFormData({...couponFormData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-micro font-bold text-slate-600 uppercase tracking-premium cursor-pointer">Kích hoạt mã khuyến mãi ngay</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-500 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-slate-100 transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  {editingCoupon ? 'Cập nhật mã' : 'Xác nhận tạo mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
