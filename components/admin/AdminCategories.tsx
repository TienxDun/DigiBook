import React, { useState } from 'react';
import { CategoryInfo } from '../../types';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import { AVAILABLE_ICONS } from '../../constants/categories';

interface AdminCategoriesProps {
  categories: CategoryInfo[];
  refreshData: () => void;
}

const AdminCategories: React.FC<AdminCategoriesProps> = ({ categories, refreshData }) => {
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
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Quản lý danh mục</h3>
          <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Tổng cộng {categories.length} danh mục</p>
        </div>
        <button 
          onClick={handleOpenAddCategory}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <i className="fa-solid fa-plus mr-2"></i>Thêm danh mục mới
        </button>
      </div>

      {/* Bulk Actions for Categories */}
      {categories.length > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={toggleSelectAllCategories}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedCategories.length === categories.length && categories.length > 0
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'border-slate-300 group-hover:border-indigo-400 shadow-inner'
                }`}
              >
                {selectedCategories.length === categories.length && categories.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
              </div>
              <span className="text-micro font-bold text-slate-600 uppercase tracking-premium">Chọn tất cả ({categories.length})</span>
            </label>
            {selectedCategories.length > 0 && (
              <div className="h-4 w-px bg-slate-200"></div>
            )}
            {selectedCategories.length > 0 && (
              <span className="text-micro font-bold text-indigo-600 uppercase tracking-premium">Đã chọn {selectedCategories.length} danh mục</span>
            )}
          </div>
          {selectedCategories.length > 0 && (
            <button 
              onClick={handleBulkDeleteCategories}
              disabled={isDeletingBulk}
              className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-micro font-bold uppercase tracking-premium hover:bg-rose-100 transition-all flex items-center gap-2"
            >
              <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
              <span>Xóa hàng loạt</span>
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-slate-100">
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium w-12 text-center">
                <div 
                  onClick={toggleSelectAllCategories}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    selectedCategories.length === categories.length && categories.length > 0
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'border-slate-300 bg-white shadow-inner'
                  }`}
                >
                  {selectedCategories.length === categories.length && categories.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                </div>
              </th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium">Danh mục</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium hidden md:table-cell">Mô tả</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map(category => (
              <tr key={category.name} className={`group hover:bg-slate-50/50 transition-all ${selectedCategories.includes(category.name) ? 'bg-indigo-50/30' : ''}`}>
                <td className="p-6 text-center">
                  <div 
                    onClick={() => toggleSelectCategory(category.name)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedCategories.includes(category.name)
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'border-slate-300 bg-white group-hover:border-indigo-400 shadow-inner'
                    }`}
                  >
                    {selectedCategories.includes(category.name) && <i className="fa-solid fa-check text-[10px]"></i>}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <i className={`fa-solid ${category.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-0.5">{category.name}</h4>
                      <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">Danh mục sách</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 hidden md:table-cell max-w-xs lg:max-w-md">
                  <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed font-medium">{category.description || 'Chưa có mô tả'}</p>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEditCategory(category)}
                      className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
                      title="Chỉnh sửa"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category)}
                      className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
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
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-tags text-slate-300 text-2xl"></i>
            </div>
            <h3 className="font-bold text-slate-400 uppercase tracking-premium text-micro">Chưa có danh mục nào</h3>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <h2 className="text-xl font-extrabold uppercase tracking-tight">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">
                  Tên danh mục *
                  {editingCategory && <span className="text-[10px] text-amber-500 ml-2">(không thể thay đổi mã)</span>}
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory}
                  value={categoryFormData.name || ''}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium ${
                    editingCategory ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white'
                  }`}
                  placeholder="Vd: Văn học, Kinh tế..."
                />
              </div>
              
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-3">Biểu tượng hiển thị (Icon) *</label>
                <div className="grid grid-cols-5 gap-3">
                  {AVAILABLE_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryFormData({...categoryFormData, icon})}
                      className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 flex items-center justify-center ${
                        categoryFormData.icon === icon
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-100'
                          : 'border-slate-100 text-slate-300 hover:border-indigo-200 hover:text-indigo-400'
                      }`}
                    >
                      <i className={`fa-solid ${icon} text-2xl`}></i>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Mô tả ngắn</label>
                <textarea
                  value={categoryFormData.description || ''}
                  onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium resize-none shadow-inner"
                  placeholder="Viết vài dòng mô tả về danh mục này..."
                />
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 bg-slate-50 text-slate-500 py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-slate-100 transition-all"
                >
                  Hủy thao tác
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
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
