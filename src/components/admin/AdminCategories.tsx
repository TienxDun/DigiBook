import React, { useState } from 'react';
import { CategoryInfo } from '../../types';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import { AVAILABLE_ICONS } from '../../constants/categories';

interface AdminCategoriesProps {
  categories: CategoryInfo[];
  refreshData: () => void;
  theme?: 'light' | 'midnight';
}

const AdminCategories: React.FC<AdminCategoriesProps> = ({ categories, refreshData, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<CategoryInfo>>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      icon: 'fa-book-open',
      description: ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: CategoryInfo) => {
    setEditingCategory(category);
    setCategoryFormData({ ...category });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (category: CategoryInfo) => {
    if (window.confirm(`Xóa danh mục "${category.name}"? Thao tác này có thể ảnh hưởng đến hiển thị sách trong danh mục này.`)) {
      try {
        await db.deleteCategory(category.name);
        toast.success('Đã xóa danh mục thành công');
        refreshData();
      } catch (err: any) {
        toast.error('Lỗi: ' + (err.message || 'Không thể xóa danh mục'));
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await db.saveCategory({ ...editingCategory, ...categoryFormData } as CategoryInfo);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await db.saveCategory(categoryFormData as CategoryInfo);
        toast.success('Đã thêm danh mục mới');
      }
      setIsCategoryModalOpen(false);
      refreshData();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || 'Không thể lưu danh mục'));
    }
  };

  const toggleSelectCategory = (name: string) => {
    setSelectedCategories(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleSelectAllCategories = () => {
    setSelectedCategories(prev => prev.length === categories.length ? [] : categories.map(c => c.name));
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.length === 0) return;
    if (window.confirm(`Xóa vĩnh viễn ${selectedCategories.length} danh mục đã chọn?`)) {
      setIsDeletingBulk(true);
      try {
        await Promise.all(selectedCategories.map(name => db.deleteCategory(name)));
        toast.success(`Đã xóa ${selectedCategories.length} danh mục`);
        setSelectedCategories([]);
        refreshData();
      } catch (err) {
        ErrorHandler.handle(err, 'xóa hàng loạt danh mục');
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/40'
        } flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all hover:border-indigo-500/30`}>
        <div>
          <h3 className={`text-lg font-extrabold uppercase tracking-tight ${isMidnight ? 'text-slate-100' : 'text-slate-900'}`}>Quản lý danh mục</h3>
          <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Tổng cộng {categories.length} danh mục trong hệ thống</p>
        </div>
        <button 
          onClick={handleOpenAddCategory}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Thêm danh mục mới</span>
        </button>
      </div>

      {/* Bulk Actions for Categories */}
      {categories.length > 0 && (
        <div className={`${
          isMidnight 
          ? 'bg-[#1e293b]/30 backdrop-blur-md border-white/5 shadow-xl' 
          : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/30'
          } flex items-center justify-between p-4 rounded-2xl border`}>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={toggleSelectAllCategories}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedCategories.length === categories.length && categories.length > 0
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : `${isMidnight ? 'border-slate-700' : 'border-slate-300'} group-hover:border-indigo-400`
                }`}
              >
                {selectedCategories.length === categories.length && categories.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
              </div>
              <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-400' : 'text-slate-600'}`}>Chọn tất cả ({categories.length})</span>
            </label>
            {selectedCategories.length > 0 && (
              <div className={`h-4 w-px ${isMidnight ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            )}
            {selectedCategories.length > 0 && (
              <span className="text-micro font-bold text-indigo-500 uppercase tracking-premium">Đã chọn {selectedCategories.length} danh mục</span>
            )}
          </div>
          {selectedCategories.length > 0 && (
            <button 
              onClick={handleBulkDeleteCategories}
              disabled={isDeletingBulk}
              className={`${
                isMidnight ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              } px-4 py-2 rounded-xl text-micro font-bold uppercase tracking-premium transition-all flex items-center gap-2`}
            >
              <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
              <span>Xóa hàng loạt</span>
            </button>
          )}
        </div>
      )}

      {/* Categories Table */}
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/20'
        } rounded-[2rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className={`${isMidnight ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'} border-b`}>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium w-12 text-center">
                <div 
                  onClick={toggleSelectAllCategories}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    selectedCategories.length === categories.length && categories.length > 0
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : `${isMidnight ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-white shadow-inner'}`
                  }`}
                >
                  {selectedCategories.length === categories.length && categories.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                </div>
              </th>
              <th className={`p-6 text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-400' : 'text-slate-400'}`}>Danh mục</th>
              <th className={`p-6 text-micro font-bold uppercase tracking-premium hidden md:table-cell ${isMidnight ? 'text-slate-400' : 'text-slate-400'}`}>Mô tả</th>
              <th className={`p-6 text-micro font-bold uppercase tracking-premium text-right ${isMidnight ? 'text-slate-400' : 'text-slate-400'}`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-100'}`}>
            {categories.map(category => (
              <tr key={category.name} className={`group transition-all ${
                selectedCategories.includes(category.name) 
                ? (isMidnight ? 'bg-indigo-500/10' : 'bg-indigo-50/30') 
                : (isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50')
              }`}>
                <td className="p-6 text-center">
                  <div 
                    onClick={() => toggleSelectCategory(category.name)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedCategories.includes(category.name)
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                      : `${isMidnight ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-white shadow-inner'} group-hover:border-indigo-400`
                    }`}
                  >
                    {selectedCategories.includes(category.name) && <i className="fa-solid fa-check text-[10px]"></i>}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isMidnight ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600 shadow-sm'
                    } group-hover:bg-indigo-600 group-hover:text-white`}>
                      <i className={`fa-solid ${category.icon}`}></i>
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm mb-0.5 ${isMidnight ? 'text-white' : 'text-slate-900'}`}>{category.name}</h4>
                      <p className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Danh mục sách</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 hidden md:table-cell max-w-xs lg:max-w-md">
                  <p className={`text-xs line-clamp-1 leading-relaxed font-medium ${isMidnight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {category.description || 'Chưa có mô tả'}
                  </p>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEditCategory(category)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isMidnight ? 'bg-white/5 text-slate-300 hover:bg-indigo-500 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Chỉnh sửa"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category)}
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
        {categories.length === 0 && (
          <div className="p-12 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isMidnight ? 'bg-white/5' : 'bg-slate-50'}`}>
              <i className={`fa-solid fa-tags text-2xl ${isMidnight ? 'text-slate-700' : 'text-slate-300'}`}></i>
            </div>
            <h3 className={`font-bold uppercase tracking-premium text-micro ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Chưa có danh mục nào</h3>
          </div>
        )}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[300] p-4 animate-fadeIn">
          <div className={`${
            isMidnight ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-100'
          } rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border`}>
            <div className={`p-8 border-b flex items-center justify-between ${
              isMidnight ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900'
            }`}>
              <h2 className="text-xl font-extrabold uppercase tracking-tight">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button 
                onClick={() => setIsCategoryModalOpen(false)} 
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  isMidnight ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div>
                <label className={`block text-micro font-bold uppercase tracking-premium mb-2 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Tên danh mục *
                  {editingCategory && <span className="text-[10px] text-amber-500 ml-2">(không thể thay đổi mã)</span>}
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory}
                  value={categoryFormData.name || ''}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  className={`w-full px-5 py-3.5 rounded-2xl transition-all font-medium ${
                    isMidnight 
                    ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' 
                    : 'bg-white border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500'
                  } ${editingCategory ? (isMidnight ? 'opacity-50 cursor-not-allowed' : 'bg-slate-50 text-slate-400 cursor-not-allowed') : ''}`}
                  placeholder="Vd: Văn học, Kinh tế..."
                />
              </div>
              
              <div>
                <label className={`block text-micro font-bold uppercase tracking-premium mb-3 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Biểu tượng hiển thị (Icon) *</label>
                <div className="grid grid-cols-5 gap-3">
                  {AVAILABLE_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryFormData({...categoryFormData, icon})}
                      className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 flex items-center justify-center ${
                        categoryFormData.icon === icon
                          ? (isMidnight ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100')
                          : (isMidnight ? 'border-white/5 text-slate-600 hover:border-white/20' : 'border-slate-100 text-slate-300 hover:border-indigo-200 hover:text-indigo-400')
                      }`}
                    >
                      <i className={`fa-solid ${icon} text-2xl`}></i>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className={`block text-micro font-bold uppercase tracking-premium mb-2 ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Mô tả ngắn</label>
                <textarea
                  value={categoryFormData.description || ''}
                  onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  rows={3}
                  className={`w-full px-5 py-3.5 rounded-2xl transition-all font-medium resize-none ${
                    isMidnight
                    ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                    : 'bg-white border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 shadow-inner'
                  }`}
                  placeholder="Viết vài dòng mô tả về danh mục này..."
                />
              </div>
              
              <div className={`flex gap-4 pt-6 border-t ${isMidnight ? 'border-white/5' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className={`flex-1 py-4 rounded-2xl text-micro font-bold uppercase tracking-premium transition-all ${
                    isMidnight ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Hủy thao tác
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
