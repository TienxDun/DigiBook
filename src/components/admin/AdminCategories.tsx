import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CategoryInfo } from '../../types';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import { AVAILABLE_ICONS } from '../../constants/categories';
import { motion, AnimatePresence } from 'framer-motion';

// Portal component for rendering modals outside DOM structure
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return createPortal(children, document.body);
};

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khóa cuộn trang khi mở popup
  useEffect(() => {
    if (isCategoryModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCategoryModalOpen]);

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
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-8 animate-fadeIn text-foreground">
      {/* Header Card */}
      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-3xl'} flex flex-wrap items-center justify-between gap-6 p-8 rounded-[2.5rem] transition-all hover:border-primary/20`}>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <i className="fa-solid fa-tags text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Quản lý danh mục</h3>
            <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              {categories.length} danh mục hiện có
            </p>
          </div>
        </div>
        <button 
          onClick={handleOpenAddCategory}
          className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/25 flex items-center gap-3 group"
        >
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i>
          <span>Thêm danh mục mới</span>
        </button>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedCategories.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${isMidnight ? 'bg-[#1e293b]/40 border-primary/20' : 'bg-card/40 backdrop-blur-md border-primary/20 shadow-xl'} flex items-center justify-between p-5 rounded-[2rem]`}
          >
            <div className="flex items-center gap-5 ml-2">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span className="text-micro font-black text-primary uppercase tracking-premium">Đã chọn {selectedCategories.length} danh mục</span>
              </div>
              <div className="h-4 w-px bg-border/60"></div>
              <button 
                onClick={toggleSelectAllCategories}
                className={`text-micro font-bold uppercase tracking-premium transition-colors ${
                  isMidnight ? 'text-slate-400 hover:text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                Bỏ chọn tất cả
              </button>
            </div>
            <button 
              onClick={handleBulkDeleteCategories}
              disabled={isDeletingBulk}
              className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-6 py-3 rounded-xl text-micro font-bold uppercase tracking-premium transition-all shadow-sm flex items-center gap-2"
            >
              <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
              <span>Xóa hàng loạt</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Grid Table */}
      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-3xl'} rounded-[2.5rem] overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'border-border/50'}`}>
                <th className="p-8 w-20 text-center">
                  <div 
                    onClick={toggleSelectAllCategories}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedCategories.length === categories.length && categories.length > 0
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30' 
                      : (isMidnight ? 'border-white/10 bg-slate-800 shadow-inner' : 'border-border bg-background shadow-inner')
                    }`}
                  >
                    {selectedCategories.length === categories.length && categories.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                  </div>
                </th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Danh mục phân loại</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium hidden md:table-cell">Mô tả tóm tắt</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border/30'}`}>
              {categories.map((category, idx) => (
                <motion.tr 
                  key={category.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group transition-all duration-300 ${
                    selectedCategories.includes(category.name) 
                    ? (isMidnight ? 'bg-primary/10' : 'bg-primary/[0.04]')
                    : (isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-secondary/30')
                  }`}
                >
                  <td className="p-8 text-center">
                    <div 
                      onClick={() => toggleSelectCategory(category.name)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                        selectedCategories.includes(category.name)
                        ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                        : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-background shadow-inner') + ' group-hover:border-primary/50'
                      }`}
                    >
                      {selectedCategories.includes(category.name) && <i className="fa-solid fa-check text-[10px]"></i>}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        selectedCategories.includes(category.name)
                        ? 'bg-primary text-white scale-110 rotate-3 shadow-xl shadow-primary/20'
                        : (isMidnight ? 'bg-slate-800 text-primary border-white/5' : 'bg-secondary text-primary border-border/50') + ' border group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-primary group-hover:text-white'
                      }`}>
                        <i className={`fa-solid ${category.icon} text-xl`}></i>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground mb-1 group-hover:text-primary transition-colors">{category.name}</h4>
                        <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium italic">ID: {category.name.toLowerCase().replace(/\s+/g, '-')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 hidden md:table-cell max-w-xs lg:max-w-md">
                    <p className="text-sm line-clamp-2 leading-relaxed font-semibold text-muted-foreground italic">
                      {category.description || 'Không có mô tả chi tiết cho danh mục này.'}
                    </p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleEditCategory(category)}
                        className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all shadow-sm active:scale-95 ${
                          isMidnight 
                            ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-primary hover:text-primary hover:bg-slate-700' 
                            : 'bg-background border border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
                        }`}
                        title="Chỉnh sửa"
                      >
                        <i className="fa-solid fa-pen-to-square text-sm"></i>
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category)}
                        className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all shadow-sm active:scale-95 ${
                          isMidnight 
                            ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-destructive hover:text-destructive hover:bg-slate-700' 
                            : 'bg-background border border-border text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/5'
                        }`}
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
          
          {categories.length === 0 && (
            <div className="p-24 text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center mx-auto mb-8 shadow-inner border border-border/50">
                <i className="fa-solid fa-tags text-4xl text-muted-foreground/30"></i>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chưa có danh mục nào</h3>
              <p className="text-xs font-semibold text-muted-foreground/60 mt-2">Vui lòng khởi tạo danh mục để phân loại các đầu sách.</p>
              <button 
                onClick={handleOpenAddCategory}
                className="mt-8 text-primary font-black uppercase tracking-premium text-micro border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
              >
                Khởi tạo danh mục
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <Portal>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className={`relative w-full max-w-lg border shadow-3xl rounded-[2.5rem] overflow-hidden flex flex-col ${
                  isMidnight ? 'bg-slate-800 border-white/10' : 'bg-card border-border'
                }`}
              >
                {/* Modal Header */}
                <div className={`px-8 py-6 border-b flex items-center justify-between backdrop-blur-xl ${
                  isMidnight ? 'border-white/5 bg-slate-800/80' : 'border-border/50 bg-card/50'
                }`}>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                      {editingCategory ? 'Sửa danh mục' : 'Thêm mới'}
                    </h2>
                    <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-0.5">Phân loại sách hệ thống</p>
                  </div>
                  <button 
                    onClick={() => setIsCategoryModalOpen(false)} 
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                      isMidnight ? 'bg-slate-700 text-slate-400 hover:bg-primary/10 hover:text-primary' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <i className="fa-solid fa-times text-base"></i>
                  </button>
                </div>
                
                <form onSubmit={handleSaveCategory} className="p-8 space-y-6 overflow-y-auto custom-scrollbar max-h-[75vh]">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Tên danh mục *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground/30 group-focus-within:text-primary transition-colors">
                          <i className="fa-solid fa-tag text-xs"></i>
                        </div>
                        <input
                          type="text"
                          required
                          value={categoryFormData.name || ''}
                          onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                          className={`w-full pl-11 pr-6 py-3.5 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                            isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/20 border-border'
                          }`}
                          placeholder="VD: Kinh tế, Văn học..."
                          readOnly={!!editingCategory}
                        />
                      </div>
                      {editingCategory && (
                        <p className="text-[9px] text-amber-500 font-bold uppercase ml-1 opacity-80 tracking-tighter">Tên danh mục cố định không thể sửa</p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Icon đại diện</label>
                      <div className={`grid grid-cols-6 sm:grid-cols-8 gap-2.5 p-4 rounded-[1.5rem] border ${
                        isMidnight ? 'bg-white/5 border-white/5' : 'bg-secondary/20 border-border/50'
                      }`}>
                        {AVAILABLE_ICONS.slice(0, 16).map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setCategoryFormData({...categoryFormData, icon})}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                              categoryFormData.icon === icon 
                              ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' 
                              : (isMidnight ? 'bg-slate-800 text-slate-400 border-white/5 hover:border-primary/40' : 'bg-background text-muted-foreground/40 border border-border/50 hover:border-primary/40')
                            }`}
                            title={icon}
                          >
                            <i className={`fa-solid ${icon} text-xs`}></i>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Mô tả tóm tắt</label>
                      <textarea
                        value={categoryFormData.description || ''}
                        onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                        rows={3}
                        className={`w-full px-5 py-4 rounded-2xl border transition-all font-semibold resize-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 leading-relaxed text-sm ${
                          isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/20 border-border'
                        }`}
                        placeholder="Nội dung danh mục..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className={`flex-1 py-4 rounded-2xl text-micro font-black uppercase tracking-widest transition-all active:scale-95 ${
                        isMidnight ? 'text-slate-400 hover:bg-slate-700/50' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[1.5] bg-primary text-primary-foreground py-4 rounded-2xl text-micro font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                      ) : (
                        <i className="fa-solid fa-check-circle text-xs"></i>
                      )}
                      <span>Lưu thay đổi</span>
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

export default AdminCategories;
