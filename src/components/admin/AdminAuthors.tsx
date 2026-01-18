import React, { useState } from 'react';
import { Author } from '../../types';
import { db } from '../../services/db';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../../services/errorHandler';
import Pagination from '../Pagination';

interface AdminAuthorsProps {
  authors: Author[];
  refreshData: () => void;
}

const AdminAuthors: React.FC<AdminAuthorsProps> = ({ authors, refreshData }) => {
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [authorFormData, setAuthorFormData] = useState<Partial<Author>>({});
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

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
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Quản lý tác giả</h3>
          <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Tổng cộng {authors.length} tác giả</p>
        </div>
        <button 
          onClick={handleOpenAddAuthor}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          <i className="fa-solid fa-plus mr-2"></i>Thêm tác giả mới
        </button>
      </div>

      {/* Bulk Actions for Authors */}
      {authors.length > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={toggleSelectAllAuthors}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedAuthors.length === authors.length && authors.length > 0
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'border-slate-300 group-hover:border-indigo-400 shadow-inner'
                }`}
              >
                {selectedAuthors.length === authors.length && authors.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
              </div>
              <span className="text-micro font-bold text-slate-600 uppercase tracking-premium">Chọn tất cả ({authors.length})</span>
            </label>
            {selectedAuthors.length > 0 && (
              <div className="h-4 w-px bg-slate-200"></div>
            )}
            {selectedAuthors.length > 0 && (
              <span className="text-micro font-bold text-indigo-600 uppercase tracking-premium">Đã chọn {selectedAuthors.length} tác giả</span>
            )}
          </div>
          {selectedAuthors.length > 0 && (
            <button 
              onClick={handleBulkDeleteAuthors}
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
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-slate-100">
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium w-12 text-center">
                <div 
                  onClick={toggleSelectAllAuthors}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    selectedAuthors.length === authors.length && authors.length > 0
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'border-slate-300 bg-white shadow-inner'
                  }`}
                >
                  {selectedAuthors.length === authors.length && authors.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                </div>
              </th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium">Tác giả</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium hidden md:table-cell">Tiểu sử</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAuthors.map(author => (
              <tr key={author.id} className={`group hover:bg-slate-50/50 transition-all ${selectedAuthors.includes(author.id) ? 'bg-indigo-50/30' : ''}`}>
                <td className="p-6 text-center">
                  <div 
                    onClick={() => toggleSelectAuthor(author.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedAuthors.includes(author.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'border-slate-300 bg-white group-hover:border-indigo-400 shadow-inner'
                    }`}
                  >
                    {selectedAuthors.includes(author.id) && <i className="fa-solid fa-check text-[10px]"></i>}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={author.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author.name) + '&background=6366f1&color=fff'} 
                      alt={author.name} 
                      className="w-12 h-12 object-cover rounded-full shadow-sm"
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author.name) + '&background=6366f1&color=fff'; }}
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-0.5">{author.name}</h4>
                      <p className="text-micro font-bold text-slate-400 uppercase tracking-premium">Tác giả DigiBook</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 hidden md:table-cell max-w-xs xl:max-w-md">
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">{author.bio || 'Chưa có tiểu sử'}</p>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEditAuthor(author)}
                      className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
                      title="Chỉnh sửa"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteAuthor(author)}
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
        {authors.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-user-pen text-slate-300 text-2xl"></i>
            </div>
            <h3 className="font-bold text-slate-400 uppercase tracking-premium text-micro">Chưa có tác giả nào</h3>
          </div>
        )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30">
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
      {isAuthorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <h2 className="text-xl font-extrabold uppercase tracking-tight">
                {editingAuthor ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
              </h2>
              <button onClick={() => setIsAuthorModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveAuthor} className="p-8 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Họ & Tên tác giả *</label>
                <input
                  type="text"
                  required
                  value={authorFormData.name || ''}
                  onChange={(e) => setAuthorFormData({...authorFormData, name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium shadow-inner"
                  placeholder="Nhập tên đầy đủ của tác giả"
                />
              </div>
              
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Tiểu sử tóm tắt</label>
                <textarea
                  value={authorFormData.bio || ''}
                  onChange={(e) => setAuthorFormData({...authorFormData, bio: e.target.value})}
                  rows={4}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium resize-none shadow-inner"
                  placeholder="Hành trình sáng tác, giải thưởng..."
                />
              </div>
              
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Đường dẫn ảnh chân dung (URL)</label>
                <input
                  type="url"
                  value={authorFormData.avatar || ''}
                  onChange={(e) => setAuthorFormData({...authorFormData, avatar: e.target.value})}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium shadow-inner"
                  placeholder="https://link-anh.com/tac-gia.jpg"
                />
                {authorFormData.avatar && (
                  <div className="mt-4 flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <img 
                      src={authorFormData.avatar} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded-full border-2 border-white shadow-md"
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=tac+gia&background=6366f1&color=fff'; }}
                    />
                    <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">Xem trước ảnh chân dung</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAuthorModalOpen(false)}
                  className="flex-1 bg-slate-50 text-slate-500 py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-slate-100 transition-all"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {editingAuthor ? 'Cập nhật' : 'Lưu tác giả'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuthors;
