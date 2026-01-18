
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { db } from '../../services/db';
import { Book, CategoryInfo, Author } from '../../types';
import { ErrorHandler } from '../../services/errorHandler';
import Pagination from '../Pagination';

interface AdminBooksProps {
  books: Book[];
  authors: Author[];
  categories: CategoryInfo[];
  refreshData: () => Promise<void>;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const AdminBooks: React.FC<AdminBooksProps> = ({ books, authors, categories, refreshData }) => {
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookFormData, setBookFormData] = useState<Partial<Book>>({});

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (filterStock === 'low') return book.stockQuantity > 0 && book.stockQuantity <= 10;
      if (filterStock === 'out') return book.stockQuantity === 0;
      return true;
    });
  }, [books, filterStock]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectBook = (id: string) => {
    setSelectedBooks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAllBooks = () => {
    if (selectedBooks.length === filteredBooks.length && filteredBooks.length > 0) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(filteredBooks.map(b => b.id));
    }
  };

  const handleAutoSync = async () => {
    setIsSyncing(true);
    setSeedStatus({ msg: "Đang quét dữ liệu từ Google Books & Open Library...", type: 'info' });
    try {
      const queries = [
        'sách kinh tế bán chạy', 'văn học kinh điển', 'tâm lý học hành vi', 
        'lịch sử thế giới', 'triết học phương đông', 'sách thiếu nhi hay',
        'phát triển bản thân', 'startup khởi nghiệp'
      ];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const newBooks = await db.fetchBooksFromGoogle(randomQuery, 20);
      
      if (newBooks.length === 0) {
        setSeedStatus({ msg: "Không tìm thấy sách mới phù hợp hoặc tất cả đã tồn tại.", type: 'info' });
        setIsSyncing(false);
        return;
      }
      
      setSeedStatus({ msg: `Đã tìm thấy ${newBooks.length} sách mới. Đang đồng bộ...`, type: 'info' });
      const count = await db.saveBooksBatch(newBooks);
      
      setSeedStatus({ msg: `Đồng bộ thành công ${count} cuốn sách từ Google Books!`, type: 'success' });
      await refreshData();
    } catch (error: any) {
      console.error("Auto Sync Error:", error);
      setSeedStatus({ msg: `Lỗi đồng bộ: ${error.message}`, type: 'error' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSeedStatus(null), 5000);
    }
  };

  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookFormData({
      title: '',
      authorId: authors[0]?.id || '',
      category: categories[0]?.name || '',
      price: 0,
      originalPrice: undefined,
      stockQuantity: 10,
      description: '',
      isbn: '',
      cover: '',
      publishYear: new Date().getFullYear(),
      pages: 0,
      publisher: '',
      language: 'Tiếng Việt',
      badge: ''
    });
    setIsBookModalOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      authorId: book.authorId || authors.find(a => a.name === book.author)?.id || '',
      category: book.category,
      price: book.price,
      originalPrice: book.originalPrice,
      stockQuantity: book.stockQuantity,
      description: book.description,
      isbn: book.isbn,
      pages: book.pages,
      publisher: book.publisher,
      publishYear: book.publishYear,
      language: book.language,
      cover: book.cover,
      badge: book.badge
    });
    setIsBookModalOpen(true);
  };

  const handleDeleteBook = async (book: Book) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sách "${book.title}"?`)) return;
    try {
      await db.deleteBook(book.id);
      toast.success('Đã xóa sách thành công');
      refreshData();
    } catch (error) {
      ErrorHandler.handle(error, 'xóa sách');
    }
  };

  const handleBulkDeleteBooks = async () => {
    if (selectedBooks.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedBooks.length} cuốn sách đã chọn?`)) return;
    
    setIsDeletingBulk(true);
    try {
      await db.deleteBooksBulk(selectedBooks);
      toast.success(`Đã xóa ${selectedBooks.length} cuốn sách`);
      setSelectedBooks([]);
      refreshData();
    } catch (err) {
      ErrorHandler.handle(err, 'xóa hàng loạt sách');
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedAuthor = authors.find(a => a.id === bookFormData.authorId);
      const finalBook = {
        ...bookFormData,
        id: editingBook ? editingBook.id : Date.now().toString(),
        author: selectedAuthor?.name || 'Vô danh',
        rating: editingBook?.rating || 5.0
      } as Book;
      await db.saveBook(finalBook);
      toast.success(editingBook ? 'Cập nhật sách thành công' : 'Thêm sách mới thành công');
      setIsBookModalOpen(false);
      refreshData();
    } catch (error) {
      ErrorHandler.handle(error, 'lưu sách');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {seedStatus && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-slideIn ${
          seedStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          seedStatus.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
          'bg-indigo-50 text-indigo-700 border border-indigo-100'
        }`}>
          <i className={`fa-solid ${
            seedStatus.type === 'success' ? 'fa-check-circle' :
            seedStatus.type === 'error' ? 'fa-exclamation-circle' :
            'fa-info-circle'
          }`}></i>
          <p className="text-sm font-bold">{seedStatus.msg}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/40 transition-all hover:border-slate-300">
        <div className="flex items-center gap-4">
          <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">Lọc kho:</span>
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'low', label: 'Sắp hết' },
              { id: 'out', label: 'Hết hàng' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterStock(filter.id as any)}
                className={`px-4 py-1.5 rounded-lg text-micro font-bold uppercase tracking-premium transition-all ${
                  filterStock === filter.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleAutoSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
              isSyncing 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-emerald-600/10'
            }`}
          >
            <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'}`}></i>
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Auto Sync từ Internet'}</span>
          </button>
          <button 
            onClick={handleOpenAddBook}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <i className="fa-solid fa-plus mr-2"></i>Thêm sách mới
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredBooks.length > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={toggleSelectAllBooks}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'border-slate-300 group-hover:border-indigo-400'
                }`}
              >
                {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
              </div>
              <span className="text-xs font-bold text-slate-600">Chọn tất cả ({filteredBooks.length})</span>
            </label>
            {selectedBooks.length > 0 && (
              <div className="h-4 w-px bg-slate-200"></div>
            )}
            {selectedBooks.length > 0 && (
              <span className="text-xs font-bold text-indigo-600">Đã chọn {selectedBooks.length} sản phẩm</span>
            )}
          </div>
          {selectedBooks.length > 0 && (
            <button 
              onClick={handleBulkDeleteBooks}
              disabled={isDeletingBulk}
              className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-micro font-bold uppercase tracking-premium hover:bg-rose-100 transition-all flex items-center gap-2"
            >
              <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
              <span>Xóa hàng loạt</span>
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm shadow-slate-200/20 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-slate-100">
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium w-12 text-center">
                <div 
                  onClick={toggleSelectAllBooks}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'border-slate-300 bg-white shadow-inner'
                  }`}
                >
                  {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                </div>
              </th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium">Thông tin sách</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium hidden md:table-cell">Giá bán</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium hidden lg:table-cell">Tồn kho</th>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedBooks.map(book => (
              <tr key={book.id} className={`group hover:bg-slate-50/50 transition-all ${selectedBooks.includes(book.id) ? 'bg-indigo-50/30' : ''}`}>
                <td className="p-6 text-center">
                  <div 
                    onClick={() => toggleSelectBook(book.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedBooks.includes(book.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 bg-white group-hover:border-indigo-400'
                    }`}
                  >
                    {selectedBooks.includes(book.id) && <i className="fa-solid fa-check text-[10px]"></i>}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img src={book.cover || '/placeholder-book.jpg'} alt={book.title} className="w-12 h-16 object-cover rounded-lg shadow-sm" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm mb-0.5 line-clamp-1">{book.title}</h3>
                      <p className="text-micro font-bold text-slate-500 uppercase tracking-premium">{book.author}</p>
                      <p className="text-micro text-slate-400 mt-1 md:hidden font-extrabold">{formatPrice(book.price)} • {book.stockQuantity > 0 ? `${book.stockQuantity} cuốn` : 'Hết hàng'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 hidden md:table-cell">
                  <span className="text-sm font-extrabold text-indigo-600 tracking-tight">{formatPrice(book.price)}</span>
                </td>
                <td className="p-6 hidden lg:table-cell">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-micro font-bold uppercase tracking-premium ${
                    book.stockQuantity > 10 ? 'bg-emerald-50 text-emerald-600' :
                    book.stockQuantity > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <div className={`w-1 h-1 rounded-full mr-1.5 ${
                       book.stockQuantity > 10 ? 'bg-emerald-600' :
                       book.stockQuantity > 0 ? 'bg-amber-600' : 'bg-rose-600'
                    }`}></div>
                    {book.stockQuantity > 0 ? `${book.stockQuantity} quyển` : 'Hết hàng'}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEditBook(book)}
                      className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
                      title="Chỉnh sửa"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteBook(book)}
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
        {filteredBooks.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-box-open text-slate-300 text-2xl"></i>
            </div>
            <h3 className="font-bold text-slate-400 uppercase tracking-premium text-micro">Không có dữ liệu phù hợp</h3>
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

      {/* Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900 sticky top-0 z-10">
              <h2 className="text-xl font-extrabold uppercase tracking-tight">
                {editingBook ? 'Chỉnh sửa thông tin sách' : 'Thêm sách mới vào kho'}
              </h2>
              <button 
                onClick={() => setIsBookModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSaveBook} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Tiêu đề sách *</label>
                  <input
                    type="text"
                    required
                    value={bookFormData.title || ''}
                    onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                    placeholder="Vd: Đắc Nhân Tâm"
                  />
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Tác giả *</label>
                  <select
                    required
                    value={bookFormData.authorId || ''}
                    onChange={(e) => setBookFormData({...bookFormData, authorId: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold outline-none cursor-pointer"
                  >
                    <option value="">Chọn tác giả từ danh sách</option>
                    {authors.map(author => (
                      <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Thể loại / Danh mục *</label>
                  <select
                    required
                    value={bookFormData.category || ''}
                    onChange={(e) => setBookFormData({...bookFormData, category: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold outline-none cursor-pointer"
                  >
                    <option value="">Chọn một danh mục</option>
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={bookFormData.price || ''}
                    onChange={(e) => setBookFormData({...bookFormData, price: Number(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold text-indigo-600"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Giá gốc nếu có (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookFormData.originalPrice || ''}
                    onChange={(e) => setBookFormData({...bookFormData, originalPrice: Number(e.target.value) || undefined})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium text-slate-400"
                    placeholder="Để trống nếu không giảm giá"
                  />
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={bookFormData.stockQuantity || ''}
                    onChange={(e) => setBookFormData({...bookFormData, stockQuantity: Number(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Mã định danh ISBN</label>
                  <input
                    type="text"
                    value={bookFormData.isbn || ''}
                    onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                    placeholder="ISBN-13 hoặc ISBN-10"
                  />
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Số trang</label>
                  <input
                    type="number"
                    min="1"
                    value={bookFormData.pages || ''}
                    onChange={(e) => setBookFormData({...bookFormData, pages: Number(e.target.value) || 0})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Nhà xuất bản</label>
                  <input
                    type="text"
                    value={bookFormData.publisher || ''}
                    onChange={(e) => setBookFormData({...bookFormData, publisher: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                    placeholder="Vd: NXB Trẻ"
                  />
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Năm xuất bản</label>
                  <input
                    type="number"
                    min="1000"
                    max={new Date().getFullYear()}
                    value={bookFormData.publishYear || ''}
                    onChange={(e) => setBookFormData({...bookFormData, publishYear: Number(e.target.value) || new Date().getFullYear()})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                    placeholder={new Date().getFullYear().toString()}
                  />
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Ngôn ngữ chính</label>
                  <select
                    value={bookFormData.language || 'Tiếng Việt'}
                    onChange={(e) => setBookFormData({...bookFormData, language: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold outline-none cursor-pointer"
                  >
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="English">English</option>
                    <option value="Français">Français</option>
                    <option value="Deutsch">Deutsch</option>
                    <option value="Español">Español</option>
                    <option value="日本語">日本語</option>
                    <option value="中文">中文</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Nhãn dán (Badge)</label>
                  <select
                    value={bookFormData.badge || ''}
                    onChange={(e) => setBookFormData({...bookFormData, badge: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold outline-none cursor-pointer"
                  >
                    <option value="">Mặc định</option>
                    <option value="Bán chạy">Bán chạy</option>
                    <option value="Kinh điển">Kinh điển</option>
                    <option value="Mới">Sách mới</option>
                    <option value="Giảm giá">Đang giảm giá</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Đường dẫn ảnh bìa (URL)</label>
                <input
                  type="url"
                  value={bookFormData.cover || ''}
                  onChange={(e) => setBookFormData({...bookFormData, cover: e.target.value})}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                  placeholder="https://link-anh.com/bia-sach.jpg"
                />
              </div>
              
              <div>
                <label className="block text-micro font-bold text-slate-400 uppercase tracking-premium mb-2">Mô tả chi tiết nội dung</label>
                <textarea
                  value={bookFormData.description || ''}
                  onChange={(e) => setBookFormData({...bookFormData, description: e.target.value})}
                  rows={4}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium resize-none shadow-inner"
                  placeholder="Viết mô tả hấp dẫn về cuốn sách..."
                />
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="flex-1 bg-slate-50 text-slate-500 py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-slate-100 transition-all"
                >
                  Hủy thao tác
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {editingBook ? 'Cập nhật sách' : 'Xác nhận thêm sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBooks;
