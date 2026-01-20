import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Author } from '../../types';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import Pagination from '../Pagination';

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
    <div className="space-y-6 animate-fadeIn">
      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/40'
        } flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all hover:border-indigo-500/30`}>
        <div>
          <h3 className={`text-lg font-extrabold uppercase tracking-tight ${isMidnight ? 'text-slate-100' : 'text-slate-900'}`}>Quản lý tác giả</h3>
          <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Tổng cộng {authors.length} tác giả trong hệ thống</p>
        </div>
        <button 
          onClick={handleOpenAddAuthor}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Thêm tác giả mới</span>
        </button>
      </div>

      {/* Bulk Actions for Authors */}
      {authors.length > 0 && (
        <div className={`${
          isMidnight 
          ? 'bg-[#1e293b]/30 backdrop-blur-md border-white/5 shadow-xl' 
          : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/30'
          } flex items-center justify-between p-4 rounded-2xl border`}>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={toggleSelectAllAuthors}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedAuthors.length === authors.length && authors.length > 0
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : `${isMidnight ? 'border-slate-700 group-hover:border-indigo-500/50' : 'border-slate-300 group-hover:border-indigo-400'}`
                }`}
              >
                {selectedAuthors.length === authors.length && authors.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
              </div>
              <span className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-400' : 'text-slate-600'}`}>Chọn tất cả ({authors.length})</span>
            </label>
            {selectedAuthors.length > 0 && (
              <div className={`h-4 w-px ${isMidnight ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            )}
            {selectedAuthors.length > 0 && (
              <span className="text-micro font-bold text-indigo-500 uppercase tracking-premium">Đã chọn {selectedAuthors.length} tác giả</span>
            )}
          </div>
          {selectedAuthors.length > 0 && (
            <button 
              onClick={handleBulkDeleteAuthors}
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

      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/20'
        } rounded-[2rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className={`${isMidnight ? 'bg-slate-800/30' : 'bg-slate-50/50'} border-b ${isMidnight ? 'border-white/5' : 'border-slate-100'}`}>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium w-12 text-center">
                <div 
                  onClick={toggleSelectAllAuthors}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    selectedAuthors.length === authors.length && authors.length > 0
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : `${isMidnight ? 'border-slate-700 bg-slate-900 shadow-inner' : 'border-slate-300 bg-white shadow-inner'}`
                  }`}
                >
                  {selectedAuthors.length === authors.length && authors.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
                </div>
              </th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium">Thông tin tác giả</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium hidden md:table-cell">Tiểu sử tóm tắt</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-100'}`}>
            {paginatedAuthors.map(author => (
              <tr key={author.id} className={`group transition-all ${
                selectedAuthors.includes(author.id) 
                ? (isMidnight ? 'bg-indigo-500/10' : 'bg-indigo-50/30') 
                : (isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50')
              }`}>
                <td className="p-6 text-center">
                  <div 
                    onClick={() => toggleSelectAuthor(author.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedAuthors.includes(author.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : `${isMidnight ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white group-hover:border-indigo-400 shadow-inner'}`
                    }`}
                  >
                    {selectedAuthors.includes(author.id) && <i className="fa-solid fa-check text-xs"></i>}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={author.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author.name) + '&background=6366f1&color=fff'} 
                      alt={author.name} 
                      className="w-12 h-12 object-cover rounded-full shadow-md border-2 border-white/10"
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author.name) + '&background=6366f1&color=fff'; }}
                    />
                    <div>
                      <h4 className={`font-bold text-sm mb-0.5 ${isMidnight ? 'text-slate-100' : 'text-slate-900'}`}>{author.name}</h4>
                      <p className="text-micro font-bold text-slate-500 uppercase tracking-premium">Tác giả DigiBook</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 hidden md:table-cell max-w-xs xl:max-w-md">
                  <p className={`text-xs line-clamp-2 leading-relaxed font-medium ${isMidnight ? 'text-slate-400' : 'text-slate-500'}`}>{author.bio || 'Chưa có tiểu sử'}</p>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEditAuthor(author)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isMidnight ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Chỉnh sửa"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteAuthor(author)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isMidnight ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
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
        {authors.length === 0 && (
          <div className="p-16 text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isMidnight ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <i className={`fa-solid fa-user-pen text-3xl ${isMidnight ? 'text-slate-700' : 'text-slate-200'}`}></i>
            </div>
            <h3 className={`font-bold uppercase tracking-premium text-micro ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Chưa có tác giả nào</h3>
          </div>
        )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`p-6 border-t ${isMidnight ? 'border-white/5 bg-slate-800/20' : 'border-slate-100 bg-slate-50/30'}`}>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>

      {/* Author Modal */}
      {isAuthorModalOpen && createPortal(
        <div 
          onClick={() => setIsAuthorModalOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`${
              isMidnight ? 'bg-slate-900 border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
            } rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border`}
          >
            <div className={`px-6 py-5 border-b flex items-center justify-between sticky top-0 z-10 ${
              isMidnight ? 'border-white/5 bg-slate-900' : 'border-slate-100 bg-white'
            }`}>
              <h2 className={`text-lg font-bold uppercase tracking-widest ${isMidnight ? 'text-slate-200' : 'text-slate-800'}`}>
                {editingAuthor ? 'Sửa tác giả' : 'Thêm tác giả'}
              </h2>
              <button 
                onClick={() => setIsAuthorModalOpen(false)} 
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  isMidnight ? 'bg-white/5 text-slate-500 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                <i className="fa-solid fa-times text-sm"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveAuthor} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên tác giả *</label>
                <input
                  type="text"
                  required
                  value={authorFormData.name || ''}
                  onChange={(e) => setAuthorFormData({...authorFormData, name: e.target.value})}
                  className={`w-full px-4 py-3 rounded-xl border transition-all text-sm font-medium outline-none ${
                    isMidnight 
                    ? 'bg-white/5 border-white/5 text-slate-200 focus:border-indigo-500/50' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500'
                  }`}
                  placeholder="Nhập họ tên..."
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tiểu sử</label>
                <textarea
                  value={authorFormData.bio || ''}
                  onChange={(e) => setAuthorFormData({...authorFormData, bio: e.target.value})}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border transition-all text-sm font-medium resize-none outline-none ${
                    isMidnight 
                    ? 'bg-white/5 border-white/5 text-slate-200 focus:border-indigo-500/50 shadow-inner' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 shadow-inner'
                  }`}
                  placeholder="Mô tả tóm tắt..."
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ảnh đại diện (URL)</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={authorFormData.avatar || ''}
                    onChange={(e) => setAuthorFormData({...authorFormData, avatar: e.target.value})}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all text-sm font-medium outline-none ${
                      isMidnight 
                      ? 'bg-white/5 border-white/5 text-slate-200 focus:border-indigo-500/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500'
                    }`}
                    placeholder="https://..."
                  />
                  {authorFormData.avatar && (
                    <img 
                      src={authorFormData.avatar} 
                      className="w-10 h-10 object-cover rounded-full border border-white/10 shadow-sm" 
                      alt="Preview"
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=tac+gia&background=6366f1&color=fff'; }}
                    />
                  )}
                </div>
              </div>
              
              <div className={`flex gap-3 pt-4 border-t ${isMidnight ? 'border-white/5' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsAuthorModalOpen(false)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isMidnight ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
                >
                  {editingAuthor ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminAuthors;

