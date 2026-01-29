import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CategoryInfo, Book } from '@/shared/types';
import { db } from '@/services/db';
import toast from '@/shared/utils/toast';
import { ErrorHandler } from '@/services/errorHandler';
import { AVAILABLE_ICONS } from '@/shared/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '@/shared/components';

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
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter Categories
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return categories;
    const lowerTerm = searchTerm.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(lowerTerm) ||
      c.description.toLowerCase().includes(lowerTerm)
    );
  }, [categories, searchTerm]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const handleSeedCategories = async () => {
    if (window.confirm("Khởi tạo danh mục mặc định từ hệ thống?")) {
      setIsSeeding(true);
      try {
        const result = await db.seedDatabase();
        if (result.success) {
          toast.success(`Đã khởi tạo thành công ${result.count} danh mục`);
          refreshData();
        } else {
          toast.error(`Lỗi: ${result.error}`);
        }
      } catch (err) {
        ErrorHandler.handle(err, 'khởi tạo danh mục');
      } finally {
        setIsSeeding(false);
      }
    }
  };

  const toggleSelectCategory = (name: string) => {
    setSelectedCategories(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleSelectAllCategories = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(c => c.name));
    }
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
      {/* Categories Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Tổng danh mục', value: categories.length, icon: 'fa-shapes', color: 'primary' },
          { label: 'Hoạt động', value: categories.length, icon: 'fa-check-circle', color: 'chart-1' }
        ].map((stat, i) => (
          <div key={i} className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card border-border shadow-sm'} p-6 rounded-[2rem] border group transition-all hover:border-primary/50`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg bg-${stat.color}/10 text-${stat.color} border border-${stat.color}/20 shadow-sm group-hover:scale-110 transition-transform`}>
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
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">{categories.length}</span>
          </div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedCategories}
            disabled={isSeeding}
            className={`h-12 px-4 border ${isMidnight ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-border text-muted-foreground hover:bg-muted'} rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50`}
            title="Khởi tạo danh mục mặc định"
          >
            <i className={`fa-solid ${isSeeding ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
            <span className="hidden sm:inline">Khởi tạo nhanh</span>
          </button>
          <button
            onClick={handleOpenAddCategory}
            className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-3 group active:scale-95"
          >
            <i className="fa-solid fa-plus text-xs group-hover:rotate-90 transition-transform duration-300"></i>
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`bg-card/40 backdrop-blur-md border-primary/20 shadow-xl flex items-center justify-between p-4 rounded-[2rem] border ${isMidnight ? 'bg-[#1e293b]/40' : ''}`}
          >
            <div className="flex items-center gap-4 ml-2">
              <span className="text-micro font-black text-primary uppercase tracking-premium">Đã chọn {selectedCategories.length} danh mục</span>
              <div className="h-4 w-px bg-border/60"></div>
              <button
                onClick={toggleSelectAllCategories}
                className="text-micro font-bold uppercase tracking-premium transition-colors text-muted-foreground hover:text-primary"
              >
                Bỏ chọn
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDeleteCategories}
                disabled={isDeletingBulk}
                className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-5 py-2.5 rounded-xl text-micro font-bold uppercase tracking-premium transition-all shadow-sm flex items-center gap-2"
              >
                <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
                <span>Xóa ({selectedCategories.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Table */}
      <div className={`${isMidnight ? 'bg-[#1e293b] border-white/5' : 'bg-card backdrop-blur-xl border-border shadow-2xl'} rounded-[2.5rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className={`border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/30 border-border'}`}>
                <th className="px-4 py-5 w-20 text-center">
                  <div
                    onClick={toggleSelectAllCategories}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedCategories.length === filteredCategories.length && filteredCategories.length > 0
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : (isMidnight ? 'border-white/10 bg-slate-800 shadow-inner' : 'border-border bg-card shadow-inner')
                      }`}
                  >
                    {selectedCategories.length === filteredCategories.length && filteredCategories.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
                  </div>
                </th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide">Tên danh mục</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-center">Biểu tượng</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide md:w-1/3">Mô tả</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
              {paginatedCategories.map((category, idx) => (
                <motion.tr
                  key={category.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group transition-all ${selectedCategories.includes(category.name)
                    ? (isMidnight ? 'bg-primary/10' : 'bg-primary/5')
                    : (isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-muted/30')
                    }`}
                >
                  <td className="px-4 py-4 text-center">
                    <div
                      onClick={() => toggleSelectCategory(category.name)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedCategories.includes(category.name)
                        ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                        : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-card') + ' group-hover:border-primary/40'
                        }`}
                    >
                      {selectedCategories.includes(category.name) && <i className="fa-solid fa-check text-xs"></i>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{category.name}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${isMidnight
                      ? 'bg-slate-800/80 text-primary border border-white/5 shadow-lg shadow-black/20'
                      : 'bg-card text-primary border border-border shadow-md'}`}>
                      <i className={`fa-solid ${category.icon}`}></i>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                      {category.description || 'Chưa có mô tả'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${isMidnight
                          ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-primary hover:text-primary hover:bg-slate-700'
                          : 'bg-muted text-foreground hover:bg-primary/10 hover:text-primary'
                          }`}
                        title="Chỉnh sửa"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
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
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="p-24 text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center mx-auto mb-8 shadow-inner border border-border/50">
                <i className="fa-solid fa-folder-open text-4xl text-muted-foreground/30"></i>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chưa có danh mục nào</h3>
              <p className="text-xs font-semibold text-muted-foreground/60 mt-2">Tạo danh mục để phân loại sách.</p>
              <button
                onClick={handleOpenAddCategory}
                className="mt-8 text-primary font-black uppercase tracking-premium text-micro border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
              >
                Tạo danh mục ngay
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`p-8 border-t ${isMidnight ? 'border-white/5 bg-slate-900/40' : 'border-border/50 bg-secondary/20'}`}>
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
                className={`relative w-full max-w-lg border shadow-3xl rounded-[2.5rem] overflow-hidden flex flex-col ${isMidnight ? 'bg-slate-800 border-white/10' : 'bg-card border-border'
                  }`}
              >
                {/* Modal Header */}
                <div className={`px-8 py-6 border-b flex items-center justify-between backdrop-blur-xl ${isMidnight ? 'border-white/5 bg-slate-800/80' : 'border-border/50 bg-card/50'
                  }`}>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                      {editingCategory ? 'Sửa danh mục' : 'Thêm mới'}
                    </h2>
                    <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-0.5">Phân loại sách hệ thống</p>
                  </div>
                  <button
                    onClick={() => setIsCategoryModalOpen(false)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${isMidnight ? 'bg-slate-700 text-slate-400 hover:bg-primary/10 hover:text-primary' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
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
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                          className={`w-full pl-11 pr-6 py-3.5 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/20 border-border'
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
                      <div className={`grid grid-cols-6 sm:grid-cols-8 gap-2.5 p-4 rounded-[1.5rem] border ${isMidnight ? 'bg-white/5 border-white/5' : 'bg-secondary/20 border-border/50'
                        }`}>
                        {AVAILABLE_ICONS.slice(0, 16).map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setCategoryFormData({ ...categoryFormData, icon })}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${categoryFormData.icon === icon
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
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                        rows={3}
                        className={`w-full px-5 py-4 rounded-2xl border transition-all font-semibold resize-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 leading-relaxed text-sm ${isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/20 border-border'
                          }`}
                        placeholder="Nội dung danh mục..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className={`flex-1 py-4 rounded-2xl text-micro font-black uppercase tracking-widest transition-all active:scale-95 ${isMidnight ? 'text-slate-400 hover:bg-slate-700/50' : 'text-muted-foreground hover:bg-secondary'
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
