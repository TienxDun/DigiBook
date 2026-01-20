import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Author } from '../../types';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import Pagination from '../Pagination';

// Portal component for rendering modals outside DOM structure
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};

interface AdminAuthorsProps {
  authors: Author[];
  refreshData: () => void;
  theme?: 'light' | 'midnight';
}

const AdminAuthors: React.FC<AdminAuthorsProps> = ({ authors, refreshData, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [authorFormData, setAuthorFormData] = useState<Partial<Author>>({});
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isAuthorModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAuthorModalOpen]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(authors.length / itemsPerPage);
  const paginatedAuthors = authors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAddAuthor = () => {
    setEditingAuthor(null);
    setAuthorFormData({
      name: '',
      bio: '',
      avatar: ''
    });
    setIsAuthorModalOpen(true);
  };

  const handleEditAuthor = (author: Author) => {
    setEditingAuthor(author);
    setAuthorFormData({ ...author });
    setIsAuthorModalOpen(true);
  };

  const handleDeleteAuthor = async (author: Author) => {
    if (window.confirm(`Bạn có chắc muốn xóa tác giả "${author.name}"? Thao tác này có thể ảnh hưởng đến các sách của tác giả này.`)) {
      try {
        await db.deleteAuthor(author.id);
        toast.success('Đã xóa tác giả thành công');
        refreshData();
      } catch (err) {
        ErrorHandler.handle(err, 'xóa tác giả');
      }
    }
  };

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAuthor) {
        await db.saveAuthor({ ...editingAuthor, ...authorFormData } as Author);
        toast.success('Cập nhật tác giả thành công');
      } else {
        await db.saveAuthor(authorFormData as Author);
        toast.success('Đã thêm tác giả mới');
      }
      setIsAuthorModalOpen(false);
      refreshData();
    } catch (err: any) {
      toast.error('Lỗi: ' + (err.message || 'Không thể lưu tác giả'));
    }
  };

  const toggleSelectAuthor = (id: string) => {
    setSelectedAuthors(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleSelectAllAuthors = () => {
    setSelectedAuthors(prev => prev.length === authors.length ? [] : authors.map(a => a.id));
  };

  const handleBulkDeleteAuthors = async () => {
    if (selectedAuthors.length === 0) return;
    if (window.confirm(`Xóa vĩnh viễn ${selectedAuthors.length} tác giả đã chọn?`)) {
      setIsDeletingBulk(true);
      try {
        await Promise.all(selectedAuthors.map(id => db.deleteAuthor(id)));
        toast.success(`Đã xóa ${selectedAuthors.length} tác giả`);
        setSelectedAuthors([]);
        refreshData();
      } catch (err) {
        ErrorHandler.handle(err, 'xóa hàng loạt tác giả');
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
            <i className="fa-solid fa-user-pen text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Quản lý tác giả</h3>
            <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              {authors.length} tác giả trong hệ thống
            </p>
          </div>
        </div>
        <button 
          onClick={handleOpenAddAuthor}
          className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/25 flex items-center gap-3 group"
        >
          <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform"></i>
          <span>Thêm tác giả mới</span>
        </button>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedAuthors.length > 0 && (
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
                <span className="text-micro font-black text-primary uppercase tracking-premium">Đã chọn {selectedAuthors.length} tác giả</span>
              </div>
              <div className="h-4 w-px bg-border/60"></div>
              <button 
                onClick={toggleSelectAllAuthors}
                className={`text-micro font-bold uppercase tracking-premium transition-colors ${
                  isMidnight ? 'text-slate-400 hover:text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                Bỏ chọn tất cả
              </button>
            </div>
            <button 
              onClick={handleBulkDeleteAuthors}
              disabled={isDeletingBulk}
              className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-6 py-3 rounded-xl text-micro font-bold uppercase tracking-premium transition-all shadow-sm flex items-center gap-2"
            >
              <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
              <span>Xóa hàng loạt</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Table */}
      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-md border-border shadow-3xl'} rounded-[2.5rem] overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className={`border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'border-border/50'}`}>
                <th className="p-8 w-20 text-center">
                  <div 
                    onClick={toggleSelectAllAuthors}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedAuthors.length === authors.length && authors.length > 0
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30' 
                      : (isMidnight ? 'border-white/10 bg-slate-800 shadow-inner' : 'border-border bg-background shadow-inner')
                    }`}
                  >
                    {selectedAuthors.length === authors.length && authors.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                  </div>
                </th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium">Thông tin tác giả</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium hidden md:table-cell">Tiểu sử tóm tắt</th>
                <th className="p-8 text-micro font-black text-muted-foreground uppercase tracking-premium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border/30'}`}>
              {paginatedAuthors.map((author, idx) => (
                <motion.tr 
                  key={author.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group transition-all duration-300 ${
                    selectedAuthors.includes(author.id) 
                    ? (isMidnight ? 'bg-primary/10' : 'bg-primary/[0.04]')
                    : (isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-secondary/30')
                  }`}
                >
                  <td className="p-8 text-center">
                    <div 
                      onClick={() => toggleSelectAuthor(author.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                        selectedAuthors.includes(author.id)
                        ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                        : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-background') + ' group-hover:border-primary/50 shadow-inner'
                      }`}
                    >
                      {selectedAuthors.includes(author.id) && <i className="fa-solid fa-check text-[10px]"></i>}
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-5">
                      <div className="relative group/avatar">
                        <img 
                          src={author.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author.name) + '&background=7033ff&color=fff'} 
                          alt={author.name} 
                          className="w-14 h-14 object-cover rounded-2xl shadow-lg border-2 border-white transition-transform group-hover/avatar:scale-105"
                          onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author.name) + '&background=7033ff&color=fff'; }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background border border-border rounded-full flex items-center justify-center shadow-sm">
                          <i className="fa-solid fa-check text-[8px] text-green-500"></i>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground mb-1 group-hover:text-primary transition-colors">{author.name}</h4>
                        <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium">ID: {author.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 hidden md:table-cell max-w-xs xl:max-w-md">
                    <p className="text-sm line-clamp-2 leading-relaxed font-semibold text-muted-foreground italic">
                      {author.bio || 'Chưa có thông tin tiểu sử chi tiết.'}
                    </p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleEditAuthor(author)}
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
                        onClick={() => handleDeleteAuthor(author)}
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
          
          {authors.length === 0 && (
            <div className="p-24 text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center mx-auto mb-8 shadow-inner border border-border/50">
                <i className="fa-solid fa-user-pen text-4xl text-muted-foreground/30"></i>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Chưa có tác giả nào</h3>
              <p className="text-xs font-semibold text-muted-foreground/60 mt-2">Bắt đầu bằng cách thêm tác giả đầu tiên của bạn.</p>
              <button 
                onClick={handleOpenAddAuthor}
                className="mt-8 text-primary font-black uppercase tracking-premium text-micro border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
              >
                Thêm tác giả ngay
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-8 border-t border-border/50 bg-secondary/20">
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

      {/* Author Modal */}
      <AnimatePresence>
        {isAuthorModalOpen && (
          <Portal>
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
              <motion.div 
                key="author-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAuthorModalOpen(false)}
                className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
              />
              
              <motion.div 
                key="author-modal-content"
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
                      {editingAuthor ? 'Cập nhật tác giả' : 'Thêm tác giả mới'}
                    </h2>
                    <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-0.5">Thông tin định danh tác giả</p>
                  </div>
                  <button 
                    onClick={() => setIsAuthorModalOpen(false)} 
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                      isMidnight ? 'bg-slate-700 text-slate-400 hover:bg-primary/10 hover:text-primary' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <i className="fa-solid fa-times text-base"></i>
                  </button>
                </div>
                
                <form onSubmit={handleSaveAuthor} className="p-8 space-y-6 overflow-y-auto custom-scrollbar max-h-[75vh]">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Tên tác giả *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-muted-foreground/30">
                          <i className="fa-solid fa-user-tag text-xs"></i>
                        </div>
                        <input
                          type="text"
                          required
                          value={authorFormData.name || ''}
                          onChange={(e) => setAuthorFormData({...authorFormData, name: e.target.value})}
                          className={`w-full pl-12 pr-6 py-3.5 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                            isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/20 border-border'
                          }`}
                          placeholder="Nhập tên..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1 flex justify-between">
                        <span>Tiểu sử</span>
                        <span className="text-[9px] text-muted-foreground/40 font-bold lowercase italic">tùy chọn</span>
                      </label>
                      <textarea
                        value={authorFormData.bio || ''}
                        onChange={(e) => setAuthorFormData({...authorFormData, bio: e.target.value})}
                        rows={3}
                        className={`w-full px-5 py-4 rounded-2xl border transition-all font-semibold resize-none outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 leading-relaxed text-sm ${
                          isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/20 border-border'
                        }`}
                        placeholder="Giới thiệu về tác giả..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">Ảnh đại diện</label>
                      <div className="flex gap-4">
                        <div className={`w-16 h-16 shrink-0 rounded-2xl border overflow-hidden shadow-inner flex items-center justify-center ${
                          isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary border-border bg-muted/30'
                        }`}>
                          {authorFormData.avatar ? (
                            <img 
                              src={authorFormData.avatar} 
                              className="w-full h-full object-cover" 
                              alt="Preview"
                              onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=tac+gia&background=7033ff&color=fff'; }}
                            />
                          ) : (
                            <i className="fa-solid fa-image text-muted-foreground/10 text-xl"></i>
                          )}
                        </div>
                        <div className="flex-1 relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/30">
                            <i className="fa-solid fa-link text-xs"></i>
                          </div>
                          <input
                            type="url"
                            value={authorFormData.avatar || ''}
                            onChange={(e) => setAuthorFormData({...authorFormData, avatar: e.target.value})}
                            className={`w-full h-full pl-11 pr-4 py-3.5 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                              isMidnight ? 'bg-slate-700/50 border-white/5' : 'bg-secondary/20 border-border'
                            }`}
                            placeholder="URL hình ảnh..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAuthorModalOpen(false)}
                      className={`flex-1 py-4 rounded-2xl text-micro font-black uppercase tracking-widest transition-all active:scale-95 ${
                        isMidnight ? 'text-slate-400 hover:bg-slate-700/50' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex-[1.5] bg-primary text-primary-foreground py-4 rounded-2xl text-micro font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
                    >
                      <i className="fa-solid fa-save text-xs"></i>
                      <span>{editingAuthor ? 'Cập nhật' : 'Thêm mới'}</span>
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

export default AdminAuthors;

