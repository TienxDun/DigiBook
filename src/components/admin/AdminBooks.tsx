
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
  theme?: 'light' | 'midnight';
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const AdminBooks: React.FC<AdminBooksProps> = ({ books, authors, categories, refreshData, theme = 'light' }) => {
  const isMidnight = theme === 'midnight';
  
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingISBN, setIsFetchingISBN] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'commerce' | 'details' | 'media'>('general');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookFormData, setBookFormData] = useState<Partial<Book>>({});

  // Quick Author State
  const [isQuickAuthorOpen, setIsQuickAuthorOpen] = useState(false);
  const [quickAuthorName, setQuickAuthorName] = useState('');
  const [isSavingQuickAuthor, setIsSavingQuickAuthor] = useState(false);

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

  const handleFetchBookByISBN = async () => {
    if (!bookFormData.isbn || bookFormData.isbn.trim().length < 10) {
      toast.error("Vui lòng nhập mã ISBN hợp lệ (10 hoặc 13 số)");
      return;
    }

    setIsFetchingISBN(true);
    try {
      const fetchedBook = await db.fetchBookByISBN(bookFormData.isbn);
      if (fetchedBook) {
        setBookFormData(prev => ({
          ...prev,
          title: fetchedBook.title,
          author: fetchedBook.author,
          authorBio: fetchedBook.authorBio,
          cover: fetchedBook.cover,
          category: fetchedBook.category,
          description: fetchedBook.description,
          pages: fetchedBook.pages,
          publisher: fetchedBook.publisher,
          publishYear: fetchedBook.publishYear,
          language: fetchedBook.language,
          rating: fetchedBook.rating
        }));
        toast.success("Đã tìm thấy thông tin sách từ Internet!");
      } else {
        toast.error("Không tìm thấy thông tin cho mã ISBN này.");
      }
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm dữ liệu.");
    } finally {
      setIsFetchingISBN(false);
    }
  };

  const handleOpenAddBook = () => {
    setEditingBook(null);
    setActiveTab('general');
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
    setActiveTab('general');
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

  const handleQuickAddAuthor = async () => {
    if (!quickAuthorName.trim()) {
      toast.error("Vui lòng nhập tên tác giả");
      return;
    }

    setIsSavingQuickAuthor(true);
    try {
      const newAuthor = {
        name: quickAuthorName.trim(),
        bio: `Tác giả ${quickAuthorName}.`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(quickAuthorName)}&background=random`
      };
      const authorId = await db.saveAuthor(newAuthor as Author);
      await refreshData();
      setBookFormData(prev => ({ ...prev, authorId: authorId }));
      setQuickAuthorName('');
      setIsQuickAuthorOpen(false);
      toast.success("Đã thêm tác giả mới!");
    } catch (err) {
      ErrorHandler.handle(err, 'thêm nhanh tác giả');
    } finally {
      setIsSavingQuickAuthor(false);
    }
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
        id: editingBook ? editingBook.id : (bookFormData.id || Date.now().toString()),
        author: selectedAuthor?.name || bookFormData.author || 'Vô danh',
        rating: bookFormData.rating || (editingBook?.rating || 5.0)
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
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-slideIn border ${
          seedStatus.type === 'success' ? (isMidnight ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100') :
          seedStatus.type === 'error' ? (isMidnight ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-100') :
          (isMidnight ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100')
        }`}>
          <i className={`fa-solid ${
            seedStatus.type === 'success' ? 'fa-check-circle' :
            seedStatus.type === 'error' ? 'fa-exclamation-circle' :
            'fa-info-circle'
          }`}></i>
          <p className="text-sm font-bold">{seedStatus.msg}</p>
        </div>
      )}

      <div className={`${
        isMidnight 
        ? 'bg-[#1e293b]/50 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/20' 
        : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/40'
        } flex flex-wrap items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all hover:border-indigo-500/30`}>
        <div className="flex items-center gap-4">
          <span className="text-micro font-bold text-slate-400 uppercase tracking-premium">Lọc kho:</span>
          <div className={`flex gap-2 p-1 rounded-xl ${isMidnight ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
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
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : `${isMidnight ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-900'}`
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
              ? (isMidnight ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400') + ' cursor-not-allowed' 
              : (isMidnight ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100')
            }`}
          >
            <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'}`}></i>
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Auto Sync'}</span>
          </button>
          <button 
            onClick={handleOpenAddBook}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Thêm sách mới</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredBooks.length > 0 && (
        <div className={`${
          isMidnight 
          ? 'bg-[#1e293b]/30 backdrop-blur-md border-white/5 shadow-xl' 
          : 'bg-white border-slate-200/60 shadow-sm shadow-slate-200/30'
          } flex items-center justify-between p-4 rounded-2xl border`}>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={toggleSelectAllBooks}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : `${isMidnight ? 'border-slate-700 group-hover:border-indigo-500/50' : 'border-slate-300 group-hover:border-indigo-400'}`
                }`}
              >
                {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
              </div>
              <span className={`text-xs font-bold ${isMidnight ? 'text-slate-400' : 'text-slate-600'}`}>Chọn tất cả ({filteredBooks.length})</span>
            </label>
            {selectedBooks.length > 0 && (
              <div className={`h-4 w-px ${isMidnight ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            )}
            {selectedBooks.length > 0 && (
              <span className="text-xs font-bold text-indigo-500">Đã chọn {selectedBooks.length} sản phẩm</span>
            )}
          </div>
          {selectedBooks.length > 0 && (
            <button 
              onClick={handleBulkDeleteBooks}
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
        } rounded-[2.5rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className={`${isMidnight ? 'bg-slate-800/30' : 'bg-slate-50/50'} border-b ${isMidnight ? 'border-white/5' : 'border-slate-100'}`}>
              <th className="p-6 text-micro font-bold text-slate-400 uppercase tracking-premium w-12 text-center">
                <div 
                  onClick={toggleSelectAllBooks}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : `${isMidnight ? 'border-slate-700 bg-slate-900 shadow-inner' : 'border-slate-300 bg-white shadow-inner'}`
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
          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-100'}`}>
            {paginatedBooks.map(book => (
              <tr key={book.id} className={`group transition-all ${
                selectedBooks.includes(book.id) 
                ? (isMidnight ? 'bg-indigo-500/10' : 'bg-indigo-50/30') 
                : (isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50')
              }`}>
                <td className="p-6 text-center">
                  <div 
                    onClick={() => toggleSelectBook(book.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedBooks.includes(book.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : `${isMidnight ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`
                    }`}
                  >
                    {selectedBooks.includes(book.id) && <i className="fa-solid fa-check text-[10px]"></i>}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative group/cover">
                      <img src={book.cover || '/placeholder-book.jpg'} alt={book.title} className="w-12 h-16 object-cover rounded-lg shadow-md transition-transform group-hover/cover:scale-110" />
                      {book.badge && (
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
                          {book.badge}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-extrabold text-sm mb-0.5 line-clamp-1 ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{book.title}</h3>
                      <p className={`text-micro font-bold uppercase tracking-premium ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>{book.author}</p>
                      <p className={`text-micro mt-1 md:hidden font-extrabold ${isMidnight ? 'text-slate-400' : 'text-slate-400'}`}>{formatPrice(book.price)} • {book.stockQuantity > 0 ? `${book.stockQuantity} cuốn` : 'Hết hàng'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 hidden md:table-cell">
                  <span className={`text-sm font-extrabold tracking-tight ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>{formatPrice(book.price)}</span>
                </td>
                <td className="p-6 hidden lg:table-cell">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-micro font-bold uppercase tracking-premium ${
                    book.stockQuantity > 10 
                    ? (isMidnight ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
                    book.stockQuantity > 0 
                    ? (isMidnight ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600') : 
                    (isMidnight ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                       book.stockQuantity > 10 ? 'bg-emerald-500' :
                       book.stockQuantity > 0 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}></div>
                    {book.stockQuantity > 0 ? `${book.stockQuantity} quyển` : 'Hết hàng'}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEditBook(book)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isMidnight ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Chỉnh sửa"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteBook(book)}
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
        {filteredBooks.length === 0 && (
          <div className="p-16 text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isMidnight ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <i className={`fa-solid fa-box-open text-3xl ${isMidnight ? 'text-slate-700' : 'text-slate-200'}`}></i>
            </div>
            <h3 className={`font-bold uppercase tracking-premium text-micro ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Không có dữ liệu phù hợp</h3>
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

      {/* Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[300] p-4 md:p-6 animate-fadeIn">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${editingBook ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <i className={`fa-solid ${editingBook ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                    {editingBook ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sách Mới'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${editingBook ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {editingBook ? 'Production Mode' : 'New Entry'}
                    </span>
                    {editingBook && (
                      <span className="text-[10px] font-bold text-slate-400">ID: {editingBook.id}</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsBookModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 group"
              >
                <i className="fa-solid fa-times group-hover:rotate-90 transition-transform"></i>
              </button>
            </div>

            {/* Premium Tab Navigation */}
            <div className="px-8 bg-white border-b border-slate-100 flex overflow-x-auto no-scrollbar">
              {[
                { id: 'general', label: 'Thông Tin Cơ Bản', icon: 'fa-layer-group', color: 'indigo' },
                { id: 'commerce', label: 'Giá & Tồn Kho', icon: 'fa-wallet', color: 'emerald' },
                { id: 'details', label: 'Thông Số Kỹ Thuật', icon: 'fa-barcode', color: 'amber' },
                { id: 'media', label: 'Hình Ảnh Đồ Họa', icon: 'fa-panorama', color: 'rose' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-6 py-5 border-b-2 transition-all duration-300 relative whitespace-nowrap ${
                      isActive 
                        ? `border-indigo-600 text-indigo-600 bg-indigo-50/30` 
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} text-sm ${isActive ? 'scale-110' : 'opacity-50'}`}></i>
                    <span className="text-xs font-black uppercase tracking-wider">{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 animate-scaleX"></span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <form onSubmit={handleSaveBook} className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                  <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
                          <i className="fa-solid fa-heading text-indigo-400"></i>
                          Tiêu đề sách hiển thị *
                        </label>
                        <input
                          type="text"
                          required
                          value={bookFormData.title || ''}
                          onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg shadow-sm placeholder:font-medium"
                          placeholder="Vd: Đắc Nhân Tâm (Bản đặc biệt)..."
                        />
                      </div>
                      
                      <div className="col-span-12 md:col-span-6">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
                          <i className="fa-solid fa-user-pen text-indigo-400"></i>
                          Tác giả chính *
                        </label>
                        <div className="relative">
                          <div className="flex gap-2">
                            <select
                              required
                              value={bookFormData.authorId || ''}
                              onChange={(e) => setBookFormData({...bookFormData, authorId: e.target.value})}
                              className="flex-1 h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold outline-none cursor-pointer text-sm shadow-sm appearance-none"
                            >
                              <option value="">-- Chọn tác giả từ danh sách --</option>
                              {authors.sort((a,b) => a.name.localeCompare(b.name)).map(author => (
                                <option key={author.id} value={author.id}>{author.name}</option>
                              ))}
                            </select>
                            <div className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <i className="fa-solid fa-chevron-down text-[10px]"></i>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsQuickAuthorOpen(!isQuickAuthorOpen)}
                              className={`h-14 aspect-square flex items-center justify-center rounded-2xl transition-all shadow-md ${
                                isQuickAuthorOpen 
                                  ? 'bg-rose-500 text-white rotate-45' 
                                  : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border-2 border-indigo-100 hover:border-indigo-600'
                              }`}
                              title="Thêm tác giả nhanh"
                            >
                              <i className="fa-solid fa-plus text-lg"></i>
                            </button>
                          </div>

                          {isQuickAuthorOpen && (
                            <div className="absolute top-full left-0 right-0 mt-3 p-5 bg-white border border-slate-100 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)] z-50 animate-slideDown overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">Tạo Tác Giả Mới</h4>
                                <i className="fa-solid fa-feather text-indigo-200"></i>
                              </div>
                              <div className="flex gap-3">
                                <input 
                                  type="text"
                                  value={quickAuthorName}
                                  onChange={(e) => setQuickAuthorName(e.target.value)}
                                  className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                                  placeholder="Nhập họ tên tác giả..."
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleQuickAddAuthor}
                                  disabled={isSavingQuickAuthor}
                                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50 shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                                >
                                  {isSavingQuickAuthor ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Xác nhận'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
                          <i className="fa-solid fa-tags text-indigo-400"></i>
                          Danh mục phân loại *
                        </label>
                        <div className="relative">
                          <select
                            required
                            value={bookFormData.category || ''}
                            onChange={(e) => setBookFormData({...bookFormData, category: e.target.value})}
                            className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold outline-none cursor-pointer text-sm shadow-sm appearance-none"
                          >
                            <option value="">-- Chọn danh mục sách --</option>
                            {categories.map(category => (
                              <option key={category.name} value={category.name}>{category.name}</option>
                            ))}
                          </select>
                          <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
                        </div>
                      </div>

                      <div className="col-span-12">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                          <i className="fa-solid fa-certificate text-indigo-400"></i>
                          Nhãn thuộc tính (Badge)
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {[
                            { val: '', label: 'Không Nhãn', color: 'bg-slate-100 text-slate-500' },
                            { val: 'Bán chạy', label: 'Bán Chạy', color: 'bg-orange-100 text-orange-600 border-orange-200' },
                            { val: 'Kinh điển', label: 'Kinh Điển', color: 'bg-blue-100 text-blue-600 border-blue-200' },
                            { val: 'Mới', label: 'Mới Về', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
                            { val: 'Giảm giá', label: 'Khuyến Mãi', color: 'bg-rose-100 text-rose-600 border-rose-200' },
                            { val: 'Limited', label: 'Giới Hạn', color: 'bg-purple-100 text-purple-600 border-purple-200' }
                          ].map(badge => {
                            const isSel = (bookFormData.badge === badge.val || (!bookFormData.badge && badge.val === ''));
                            return (
                              <button
                                key={badge.val}
                                type="button"
                                onClick={() => setBookFormData({...bookFormData, badge: badge.val})}
                                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${
                                  isSel
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105'
                                    : `${badge.color} border-transparent hover:border-current opacity-70 hover:opacity-100`
                                }`}
                              >
                                {isSel && <i className="fa-solid fa-check-circle"></i>}
                                {badge.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="col-span-12">
                        <div className="flex items-center justify-between mb-2.5 ml-1">
                          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <i className="fa-solid fa-align-left text-indigo-400"></i>
                            Mô tả tóm tắt nội dung
                          </label>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Markdown support</span>
                        </div>
                        <textarea
                          required
                          value={bookFormData.description || ''}
                          onChange={(e) => setBookFormData({...bookFormData, description: e.target.value})}
                          rows={6}
                          className="w-full px-6 py-5 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium resize-none shadow-sm leading-relaxed text-slate-700"
                          placeholder="Chia sẻ về nội dung, giá trị của cuốn sách để thu hút người đọc..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* COMMERCE TAB */}
                {activeTab === 'commerce' && (
                  <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 relative z-10">
                          <i className="fa-solid fa-money-bill-wave"></i>
                          Giá bán hiện tại
                        </label>
                        <div className="relative z-10">
                          <div className="flex items-center">
                            <input
                              type="number"
                              required
                              min="0"
                              value={bookFormData.price || ''}
                              onChange={(e) => setBookFormData({...bookFormData, price: Number(e.target.value)})}
                              className="w-full text-4xl font-black text-indigo-600 bg-transparent border-none focus:ring-0 p-0 placeholder:text-indigo-100"
                              placeholder="0"
                            />
                            <span className="text-xl font-black text-indigo-300 ml-2">VNĐ</span>
                          </div>
                          <div className="h-px w-full bg-slate-100 my-4"></div>
                          <p className="text-[10px] font-bold text-slate-400 italic">Đây là giá cuối cùng khách hàng sẽ thanh toán.</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">
                          <i className="fa-solid fa-tag"></i>
                          Giá niêm yết (Gốc)
                        </label>
                        <div className="relative z-10">
                          <div className="flex items-center text-slate-400">
                            <input
                              type="number"
                              min="0"
                              value={bookFormData.originalPrice || ''}
                              onChange={(e) => setBookFormData({...bookFormData, originalPrice: Number(e.target.value) || undefined})}
                              className="w-full text-4xl font-black bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-100"
                              placeholder="Optional"
                            />
                            <span className="text-xl font-black opacity-30 ml-2">VNĐ</span>
                          </div>
                          <div className="h-px w-full bg-slate-100 my-4"></div>
                          <p className="text-[10px] font-bold text-slate-300 italic">Chỉ hiển thị gạch ngang nếu lớn hơn giá bán.</p>
                        </div>
                      </div>

                      <div className="col-span-12 px-2">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-px flex-1 bg-slate-100"></div>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Quản Lý Vận Hành</span>
                          <div className="h-px flex-1 bg-slate-100"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="col-span-2">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                                <i className="fa-solid fa-boxes-stacked text-amber-500"></i>
                                Số lượng tồn kho *
                              </label>
                              <div className="flex items-center gap-4">
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={bookFormData.stockQuantity || ''}
                                  onChange={(e) => setBookFormData({...bookFormData, stockQuantity: Number(e.target.value)})}
                                  className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-black text-xl text-slate-700 shadow-sm"
                                  placeholder="0"
                                />
                                <div className="flex gap-2">
                                  {[10, 50, 100].map(val => (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => setBookFormData({...bookFormData, stockQuantity: (bookFormData.stockQuantity || 0) + val})}
                                      className="w-12 h-14 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold active:bg-slate-800 active:text-white transition-colors flex items-center justify-center text-xs"
                                    >
                                      +{val}
                                    </button>
                                  ))}
                                </div>
                              </div>
                           </div>

                           <div className="flex flex-col justify-end">
                              <div className={`p-5 rounded-2xl border-2 flex items-center gap-3 transition-all h-14 ${
                                (bookFormData.stockQuantity || 0) > 0 
                                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' 
                                  : 'bg-rose-50/50 border-rose-100 text-rose-600'
                              }`}>
                                <div className={`w-3 h-3 rounded-full animate-pulse ${
                                  (bookFormData.stockQuantity || 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest truncate">
                                  {(bookFormData.stockQuantity || 0) > 0 ? 'Hệ thống: Còn hàng' : 'Hệ thống: Hết hàng'}
                                </span>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DETAILS TAB */}
                {activeTab === 'details' && (
                  <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 mb-10 relative overflow-hidden group">
                      <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-125 transition-transform">
                        <i className="fa-solid fa-robot text-[120px]"></i>
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <i className="fas fa-magic"></i> AI Auto-Fill System
                        </h4>
                        <p className="text-indigo-100 text-xs font-medium max-w-lg mb-6 leading-relaxed">
                          Nhập mã ISBN của sách và nhấn "Quét Dữ Liệu". AI sẽ tự động tìm kiếm thông tin chi tiết từ Google Books API để điền vào form này.
                        </p>
                        <div className="flex gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
                          <input
                            type="text"
                            value={bookFormData.isbn || ''}
                            onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-indigo-200 font-bold px-4"
                            placeholder="ISBN (Vd: 9786045688175)..."
                          />
                          <button
                            type="button"
                            onClick={handleFetchBookByISBN}
                            disabled={isFetchingISBN}
                            className="bg-white text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 font-black text-[10px] uppercase shadow-lg shadow-black/10 disabled:opacity-50"
                          >
                            {isFetchingISBN ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                            Quét Dữ Liệu
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12 md:col-span-4">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
                          <i className="fa-solid fa-file-lines text-slate-400"></i>
                          Số lượng trang
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={bookFormData.pages || ''}
                            onChange={(e) => setBookFormData({...bookFormData, pages: Number(e.target.value) || 0})}
                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 shadow-sm"
                            placeholder="Vd: 365"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Trang</span>
                        </div>
                      </div>
                      
                      <div className="col-span-12 md:col-span-8">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
                          <i className="fa-solid fa-building text-slate-400"></i>
                          Nhà xuất bản (Publisher)
                        </label>
                        <input
                          type="text"
                          value={bookFormData.publisher || ''}
                          onChange={(e) => setBookFormData({...bookFormData, publisher: e.target.value})}
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 shadow-sm"
                          placeholder="Vd: NXB Trẻ, Nhà sách Nhã Nam..."
                        />
                      </div>
                      
                      <div className="col-span-12 md:col-span-6">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
                          <i className="fa-solid fa-calendar-check text-slate-400"></i>
                          Năm phát hành
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1000"
                            max={new Date().getFullYear()}
                            value={bookFormData.publishYear || ''}
                            onChange={(e) => setBookFormData({...bookFormData, publishYear: Number(e.target.value) || new Date().getFullYear()})}
                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 shadow-sm"
                          />
                          <i className="fa-solid fa-calendar absolute right-5 top-1/2 -translate-y-1/2 text-slate-200"></i>
                        </div>
                      </div>
                      
                      <div className="col-span-12 md:col-span-6">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
                          <i className="fa-solid fa-language text-slate-400"></i>
                          Ngôn ngữ bản in
                        </label>
                        <div className="relative">
                          <select
                            value={bookFormData.language || 'Tiếng Việt'}
                            onChange={(e) => setBookFormData({...bookFormData, language: e.target.value})}
                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 shadow-sm appearance-none outline-none cursor-pointer"
                          >
                            <option value="Tiếng Việt">🇻🇳 Tiếng Việt</option>
                            <option value="English">🇺🇸 English</option>
                            <option value="Français">🇫🇷 Français</option>
                            <option value="Deutsch">🇩🇪 Deutsch</option>
                            <option value="Español">🇪🇸 Español</option>
                            <option value="日本語">🇯🇵 日本語</option>
                            <option value="中文">🇨🇳 中文</option>
                          </select>
                          <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] pointer-events-none"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MEDIA TAB */}
                {activeTab === 'media' && (
                  <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="flex flex-col lg:flex-row gap-10">
                      <div className="flex-1 space-y-8">
                        <div>
                          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                            <i className="fa-solid fa-link text-indigo-400"></i>
                            Đường dẫn ảnh bìa (Thumbnail URL) *
                          </label>
                          <div className="relative group/input">
                             <input
                              type="url"
                              required
                              value={bookFormData.cover || ''}
                              onChange={(e) => setBookFormData({...bookFormData, cover: e.target.value})}
                              className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-[2rem] focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold shadow-sm"
                              placeholder="Dán link ảnh tại đây (unsplash, imgur, firebase...)"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {bookFormData.cover && (
                                <button
                                  type="button"
                                  onClick={() => setBookFormData({...bookFormData, cover: ''})}
                                  className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                >
                                  <i className="fas fa-trash-alt text-xs"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <i className="fa-solid fa-image text-[80px]"></i>
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                             Tiêu Chuẩn Hình Ảnh
                          </h4>
                          <ul className="space-y-3">
                            {[
                              'Tỷ lệ khung hình đề xuất: 3:4 (Portrait)',
                              'Kích thước tối thiểu: 600 x 800 pixels',
                              'Hỗ trợ định dạng: JPG, PNG, WEBP',
                              'Nên sử dụng ảnh nền sạch để sản phẩm chuyên nghiệp'
                            ].map((tip, i) => (
                              <li key={i} className="flex items-start gap-3 text-xs font-medium text-indigo-50 opacity-90">
                                <i className="fa-solid fa-circle-check mt-0.5 text-[10px]"></i>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="w-full lg:w-80">
                         <div className="sticky top-0">
                           <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                             <i className="fa-solid fa-eye text-emerald-400"></i>
                             Xem trước bộ cục
                           </label>
                           <div className="aspect-[3/4] bg-slate-100 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center group relative ring-1 ring-slate-200">
                              {bookFormData.cover ? (
                                <>
                                  <img 
                                    src={bookFormData.cover} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Lỗi+Ảnh';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-[9px] font-black text-white uppercase tracking-widest">
                                      Real-time Preview
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-10">
                                  <div className="w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-image text-4xl text-slate-300"></i>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Waiting for link...</span>
                                </div>
                              )}

                              {/* Live Badge Preview */}
                              {bookFormData.badge && (
                                <div className="absolute top-6 left-6 z-10 animate-fadeIn">
                                  <span className="px-4 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-xl">
                                    {bookFormData.badge}
                                  </span>
                                </div>
                              )}
                           </div>
                           {bookFormData.title && (
                             <div className="mt-4 px-4 text-center">
                                <p className="text-xs font-black text-slate-800 line-clamp-1 truncate">{bookFormData.title}</p>
                                <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase">
                                  {bookFormData.price?.toLocaleString()} VNĐ
                                </p>
                             </div>
                           )}
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer Actions */}
              <div className="px-8 py-6 border-t border-slate-100 bg-white flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3">
                   <div className="px-4 py-2 bg-slate-50 rounded-xl flex items-center gap-2 border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data ready to sync</span>
                   </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-12 py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group active:scale-95"
                  >
                    <i className={`fa-solid ${editingBook ? 'fa-cloud-upload-alt' : 'fa-plus-circle'} group-hover:translate-y-[-2px] transition-transform`}></i>
                    <span>{editingBook ? 'Cập Nhật Hệ Thống' : 'Phát Hành Sách Mới'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBooks;
