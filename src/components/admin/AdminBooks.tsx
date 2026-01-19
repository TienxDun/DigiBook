
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { db } from '../../services/db';
import { Book, CategoryInfo, Author } from '../../types';
import { ErrorHandler } from '../../services/errorHandler';
import Pagination from '../Pagination';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Lock scroll when modal is open
  React.useEffect(() => {
    if (isBookModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isBookModalOpen]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (filterStock === 'low') return book.stockQuantity > 0 && book.stockQuantity <= 10;
      if (filterStock === 'out') return book.stockQuantity === 0;
      return true;
    });
  }, [books, filterStock]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Render Badge Helper
  const renderBadge = (badgeText: string, stockQuantity?: number, isTable: boolean = false) => {
    let style = "from-rose-500 to-pink-600 shadow-rose-500/20";
    let icon = "fa-crown";

    const text = badgeText?.toLowerCase() || "";
    if (text.includes("mới")) {
      style = "from-emerald-500 to-teal-600 shadow-emerald-500/20";
      icon = "fa-sparkles";
    } else if (text.includes("giảm") || text.includes("sale")) {
      style = "from-amber-500 to-orange-600 shadow-amber-500/20";
      icon = "fa-percent";
    } else if (text.includes("kinh điển")) {
      style = "from-indigo-500 to-purple-600 shadow-indigo-500/20";
      icon = "fa-book-bookmark";
    } else if (stockQuantity === 0) {
      style = "from-slate-700 to-slate-900 shadow-slate-900/20";
      icon = "fa-box-open";
      badgeText = "Hết hàng";
    } else if (stockQuantity !== undefined && stockQuantity < 5 && !badgeText) {
      style = "from-orange-500 to-rose-600 shadow-orange-500/20";
      icon = "fa-triangle-exclamation";
      badgeText = "Sắp hết";
    } else if (stockQuantity !== undefined && stockQuantity > 100 && !badgeText) {
      style = "from-rose-500 to-pink-600 shadow-rose-500/20";
      icon = "fa-fire-flame-curved";
      badgeText = "Bán chạy";
    }

    if (!badgeText && (stockQuantity === undefined || stockQuantity >= 5)) return isTable ? <span className="text-slate-400 text-micro font-bold uppercase tracking-widest">—</span> : null;

    const baseClass = isTable 
      ? `inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-tr ${style} text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md border border-white/10`
      : `absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-gradient-to-tr ${style} text-white text-[8px] font-black uppercase tracking-wider rounded-md shadow-lg border border-white/20 z-10 flex items-center gap-1 animate-fadeIn`;

    return (
      <div className={baseClass}>
        <i className={`fa-solid ${icon} ${isTable ? "text-[9px]" : "text-[7px]"} ${text.includes("mới") ? "text-white" : "text-yellow-300"}`}></i>
        {badgeText}
      </div>
    );
  };

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
                {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
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
              <th className="px-4 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium w-14 text-center">
                <div 
                  onClick={toggleSelectAllBooks}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : `${isMidnight ? 'border-slate-700 bg-slate-900 shadow-inner' : 'border-slate-300 bg-white shadow-inner'}`
                  }`}
                >
                  {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
                </div>
              </th>
              <th className="px-4 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium min-w-[300px]">Thông tin sách</th>
              <th className="px-4 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium hidden xl:table-cell w-40">Nhãn hiệu</th>
              <th className="px-4 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium hidden md:table-cell w-32">Giá bán</th>
              <th className="px-4 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium hidden lg:table-cell w-32">Tồn kho</th>
              <th className="px-4 py-5 text-micro font-bold text-slate-400 uppercase tracking-premium text-right w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-slate-100'}`}>
            {paginatedBooks.map(book => (
              <tr key={book.id} className={`group transition-all ${
                selectedBooks.includes(book.id) 
                ? (isMidnight ? 'bg-indigo-500/10' : 'bg-indigo-50/30') 
                : (isMidnight ? 'hover:bg-white/5' : 'hover:bg-slate-50/50')
              }`}>
                <td className="px-4 py-4 text-center">
                  <div 
                    onClick={() => toggleSelectBook(book.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedBooks.includes(book.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : `${isMidnight ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`
                    }`}
                  >
                    {selectedBooks.includes(book.id) && <i className="fa-solid fa-check text-xs"></i>}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group/cover flex-shrink-0">
                      <img src={book.cover || '/placeholder-book.jpg'} alt={book.title} className="w-10 h-14 object-cover rounded-lg shadow-md transition-transform group-hover/cover:scale-110" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-extrabold text-sm mb-0.5 truncate ${isMidnight ? 'text-slate-200' : 'text-slate-900'}`}>{book.title}</h3>
                      <p className={`text-micro font-bold uppercase tracking-premium truncate ${isMidnight ? 'text-slate-500' : 'text-slate-500'}`}>{book.author}</p>
                      <p className={`text-micro mt-1 md:hidden font-extrabold whitespace-nowrap ${isMidnight ? 'text-slate-400' : 'text-slate-400'}`}>{formatPrice(book.price)} • {book.stockQuantity > 0 ? `${book.stockQuantity} cuốn` : 'Hết hàng'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 hidden xl:table-cell whitespace-nowrap">
                  {renderBadge(book.badge || '', book.stockQuantity, true)}
                </td>
                <td className="px-4 py-4 hidden md:table-cell whitespace-nowrap">
                  <span className={`text-sm font-extrabold tracking-tight ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`}>{formatPrice(book.price)}</span>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell whitespace-nowrap">
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
                <td className="px-4 py-4 text-right whitespace-nowrap">
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
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {isBookModalOpen && (
            <motion.div 
              key="admin-book-modal-portal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 font-sans"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={() => setIsBookModalOpen(false)}
              />

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`${
                  isMidnight 
                    ? 'bg-[#1e293b] border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)]' 
                    : 'bg-white border-slate-200 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)]'
                } w-full max-w-[1000px] max-h-[95vh] overflow-hidden flex flex-col border relative z-10 rounded-[2rem]`}
              >
              <div className={`px-8 py-5 border-b flex items-center justify-between ${isMidnight ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/30'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-inner ${editingBook ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <i className={`fa-solid ${editingBook ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
                  </div>
                  <div>
                    <h2 className={`text-base font-black uppercase tracking-tight ${isMidnight ? 'text-slate-100' : 'text-slate-900'}`}>
                      {editingBook ? 'Cấu hình sách' : 'Khởi tạo sách mới'}
                    </h2>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">Hệ thống quản lý dữ liệu DigiBook</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBookModalOpen(false)} 
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                    isMidnight ? 'text-slate-500 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Tabs */}
              <div className={`px-4 flex border-b overflow-x-auto no-scrollbar ${isMidnight ? 'border-white/5 bg-slate-900/40' : 'border-slate-100 bg-white'}`}>
                {[
                  { id: 'general', label: 'Cơ bản', icon: 'fa-layer-group' },
                  { id: 'commerce', label: 'Giá & Kho', icon: 'fa-wallet' },
                  { id: 'details', label: 'Thông số', icon: 'fa-barcode' },
                  { id: 'media', label: 'Truyền thông', icon: 'fa-panorama' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} text-xs`}></i>
                    <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              <form onSubmit={handleSaveBook} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {/* GENERAL TAB */}
                  {activeTab === 'general' && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
                      <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Tiêu đề sách hiển thị *</label>
                          <input
                            type="text"
                            required
                            value={bookFormData.title || ''}
                            onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                            className={`w-full h-[54px] px-6 rounded-xl border transition-all font-black text-sm outline-none shadow-sm ${
                              isMidnight 
                              ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                              : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'
                            }`}
                            placeholder="Vd: Đắc Nhân Tâm..."
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Tác giả chính *</label>
                          <div className="relative">
                            <div className="flex gap-2">
                              <select
                                required
                                value={bookFormData.authorId || ''}
                                onChange={(e) => setBookFormData({...bookFormData, authorId: e.target.value})}
                                className={`flex-1 h-[54px] px-5 rounded-xl border transition-all font-black outline-none cursor-pointer text-xs appearance-none ${
                                  isMidnight 
                                  ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                                  : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500 shadow-sm'
                                }`}
                              >
                                <option value="">-- Chọn tác giả --</option>
                                {authors.sort((a,b) => a.name.localeCompare(b.name)).map(author => (
                                  <option key={author.id} value={author.id}>{author.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setIsQuickAuthorOpen(!isQuickAuthorOpen)}
                                className={`h-[54px] aspect-square flex items-center justify-center rounded-xl transition-all shadow-sm ${
                                  isQuickAuthorOpen 
                                    ? 'bg-rose-500 text-white rotate-45' 
                                    : 'bg-indigo-600 text-white hover:bg-black'
                                }`}
                              >
                                <i className="fa-solid fa-plus text-sm"></i>
                              </button>
                            </div>
                            {isQuickAuthorOpen && (
                              <div className={`absolute top-full left-0 right-0 mt-3 p-4 rounded-2xl shadow-xl z-50 border ${isMidnight ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200'}`}>
                                <h4 className="text-xs font-black uppercase text-indigo-500 tracking-widest mb-3">Tạo tác giả mới</h4>
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={quickAuthorName}
                                    onChange={(e) => setQuickAuthorName(e.target.value)}
                                    className="flex-1 px-4 py-2 text-xs bg-slate-50 border rounded-xl font-bold"
                                    placeholder="Họ tên tác giả..."
                                  />
                                  <button
                                    type="button"
                                    onClick={handleQuickAddAuthor}
                                    disabled={isSavingQuickAuthor}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase"
                                  >
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Phân loại nhãn (Badge)</label>
                          <div className="relative">
                            <select
                              value={bookFormData.badge || ''}
                              onChange={(e) => setBookFormData({...bookFormData, badge: e.target.value})}
                              className={`w-full h-[54px] px-5 rounded-xl border transition-all font-black outline-none cursor-pointer text-xs appearance-none ${
                                isMidnight 
                                ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                                : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500 shadow-sm'
                              }`}
                            >
                              <option value="">Không có nhãn</option>
                              <option value="Bán chạy">🔥 Bán chạy</option>
                              <option value="Kinh điển">💎 Kinh điển</option>
                              <option value="Mới">✨ Mới về</option>
                              <option value="Giảm giá">🏷️ Khuyến mãi</option>
                              <option value="Limited">🌟 Limited</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                          </div>
                        </div>

                        <div className="col-span-12">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Danh mục phân loại *</label>
                          <div className="relative">
                            <select
                              required
                              value={bookFormData.category || ''}
                              onChange={(e) => setBookFormData({...bookFormData, category: e.target.value})}
                              className={`w-full h-[54px] px-5 rounded-xl border transition-all font-black outline-none cursor-pointer text-xs appearance-none ${
                                isMidnight 
                                ? 'bg-white/5 border-white/5 text-white focus:border-indigo-500' 
                                : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500 shadow-sm'
                              }`}
                            >
                              <option value="">-- Chọn danh mục --</option>
                              {categories.sort((a,b) => a.name.localeCompare(b.name)).map(category => (
                                <option key={category.name} value={category.name}>{category.name}</option>
                              ))}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                          </div>
                        </div>

                        <div className="col-span-12">
                          <label className={`text-xs font-black uppercase tracking-[0.2em] mb-3 block ${isMidnight ? 'text-slate-500' : 'text-slate-400'}`}>Mô tả tóm tắt nội dung</label>
                          <textarea
                            required
                            value={bookFormData.description || ''}
                            onChange={(e) => setBookFormData({...bookFormData, description: e.target.value})}
                            rows={4}
                            className={`w-full p-6 rounded-2xl border transition-all font-medium text-xs resize-none shadow-sm leading-relaxed ${
                              isMidnight 
                              ? 'bg-white/5 border-white/5 text-slate-300 focus:border-indigo-500' 
                              : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500'
                            }`}
                            placeholder="Tóm tắt về nội dung cuốn sách..."
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
                        <label className="flex items-center gap-2 text-xs font-black text-indigo-500 uppercase tracking-widest mb-4 relative z-10">
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
                          <p className="text-xs font-bold text-slate-400 italic">Đây là giá cuối cùng khách hàng sẽ thanh toán.</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">
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
                          <p className="text-xs font-bold text-slate-300 italic">Chỉ hiển thị gạch ngang nếu lớn hơn giá bán.</p>
                        </div>
                      </div>

                      <div className="col-span-12 px-2">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-px flex-1 bg-slate-100"></div>
                          <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">Quản Lý Vận Hành</span>
                          <div className="h-px flex-1 bg-slate-100"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="col-span-2">
                              <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
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
                                <span className="text-xs font-black uppercase tracking-widest truncate">
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
                            className="bg-white text-indigo-600 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 font-black text-xs uppercase shadow-lg shadow-black/10 disabled:opacity-50"
                          >
                            {isFetchingISBN ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                            Quét Dữ Liệu
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12 md:col-span-4">
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
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
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">Trang</span>
                        </div>
                      </div>
                      
                      <div className="col-span-12 md:col-span-8">
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
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
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
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
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
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
                          <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs pointer-events-none"></i>
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
                          <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
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
                                <i className="fa-solid fa-circle-check mt-0.5 text-xs"></i>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="w-full lg:w-80">
                         <div className="sticky top-0">
                           <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
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
                                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-xs font-black text-white uppercase tracking-widest">
                                      Real-time Preview
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-10">
                                  <div className="w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-image text-4xl text-slate-300"></i>
                                  </div>
                                  <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Waiting for link...</span>
                                </div>
                              )}

                              {/* Live Badge Preview */}
                              <div className="absolute -top-2 -right-2 z-10 scale-125 origin-top-right">
                                {renderBadge(bookFormData.badge || '', bookFormData.stockQuantity)}
                              </div>
                           </div>
                           {bookFormData.title && (
                             <div className="mt-4 px-4 text-center">
                                <p className="text-xs font-black text-slate-800 line-clamp-1 truncate">{bookFormData.title}</p>
                                <p className="text-xs font-bold text-indigo-500 mt-1 uppercase">
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
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Data ready to sync</span>
                   </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-12 py-4 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group active:scale-95"
                  >
                    <i className={`fa-solid ${editingBook ? 'fa-cloud-upload-alt' : 'fa-plus-circle'} group-hover:translate-y-[-2px] transition-transform`}></i>
                    <span>{editingBook ? 'Cập Nhật Hệ Thống' : 'Phát Hành Sách Mới'}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default AdminBooks;

