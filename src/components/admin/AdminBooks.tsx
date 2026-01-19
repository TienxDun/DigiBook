
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
                className="bg-white border-slate-200 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] w-full max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col border relative z-10 rounded-[2.5rem]"
              >
              <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm border ${editingBook ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    <i className={`fa-solid ${editingBook ? 'fa-pen-to-square' : 'fa-plus'}`}></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {editingBook ? 'Cấu hình sách' : 'Khởi tạo sách mới'}
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Thông tin chi tiết sản phẩm DigiBook</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBookModalOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSaveBook} className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
                <div className="flex-1 overflow-hidden flex">
                  {/* Left Column - Form Inputs */}
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="space-y-10">
                      {/* Section: Basic Info */}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                          Thông tin cơ bản
                        </h3>
                        <div className="grid grid-cols-12 gap-6">
                          <div className="col-span-12">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Tiêu đề sách *</label>
                            <input
                              type="text"
                              required
                              value={bookFormData.title || ''}
                              onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                              className="w-full h-14 px-6 rounded-2xl border border-slate-200 transition-all font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 bg-white shadow-sm placeholder:text-slate-300"
                              placeholder="Nhập tiêu đề sách..."
                            />
                          </div>
                          
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Tác giả *</label>
                            <div className="relative">
                              <select
                                required
                                value={bookFormData.authorId || ''}
                                onChange={(e) => setBookFormData({...bookFormData, authorId: e.target.value})}
                                className="w-full h-14 px-5 rounded-2xl border border-slate-200 transition-all font-bold text-slate-900 outline-none appearance-none cursor-pointer bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                              >
                                <option value="">-- Chọn tác giả --</option>
                                {authors.sort((a,b) => a.name.localeCompare(b.name)).map(author => (
                                  <option key={author.id} value={author.id}>{author.name}</option>
                                ))}
                              </select>
                              <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Danh mục *</label>
                            <div className="relative">
                              <select
                                required
                                value={bookFormData.category || ''}
                                onChange={(e) => setBookFormData({...bookFormData, category: e.target.value})}
                                className="w-full h-14 px-5 rounded-2xl border border-slate-200 transition-all font-bold text-slate-900 outline-none appearance-none cursor-pointer bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                              >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.sort((a,b) => a.name.localeCompare(b.name)).map(category => (
                                  <option key={category.name} value={category.name}>{category.name}</option>
                                ))}
                              </select>
                              <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section: Pricing & Stock */}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600 mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Giá & Kho hàng
                        </h3>
                        <div className="grid grid-cols-12 gap-6">
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Giá bán hiện tại (VNĐ) *</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={bookFormData.price || ''}
                              onChange={(e) => setBookFormData({...bookFormData, price: Number(e.target.value)})}
                              className="w-full h-14 px-6 rounded-2xl border border-slate-200 transition-all font-black text-emerald-600 text-lg outline-none bg-white shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5"
                              placeholder="0"
                            />
                          </div>
                          
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Số lượng tồn kho *</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={bookFormData.stockQuantity || ''}
                              onChange={(e) => setBookFormData({...bookFormData, stockQuantity: Number(e.target.value)})}
                              className="w-full h-14 px-6 rounded-2xl border border-slate-200 transition-all font-bold text-slate-900 outline-none bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                              placeholder="0"
                            />
                          </div>

                          <div className="col-span-12">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Phân loại nhãn hiệu (Badge)</label>
                            <div className="relative">
                              <select
                                value={bookFormData.badge || ''}
                                onChange={(e) => setBookFormData({...bookFormData, badge: e.target.value})}
                                className="w-full h-14 px-5 rounded-2xl border border-slate-200 transition-all font-bold text-slate-900 outline-none appearance-none cursor-pointer bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
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
                        </div>
                      </div>

                      {/* Section: Additional Details */}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-600 mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          Thông tin bổ sung
                        </h3>
                        <div className="grid grid-cols-12 gap-6">
                          <div className="col-span-12 md:col-span-4">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Mã ISBN</label>
                            <input
                              type="text"
                              value={bookFormData.isbn || ''}
                              onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})}
                              className="w-full h-12 px-5 rounded-xl border border-slate-200 transition-all font-bold text-slate-900 outline-none bg-white shadow-sm focus:border-indigo-500"
                              placeholder="ISBN..."
                            />
                          </div>
                          <div className="col-span-12 md:col-span-4">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Số trang</label>
                            <input
                              type="number"
                              value={bookFormData.pages || ''}
                              onChange={(e) => setBookFormData({...bookFormData, pages: Number(e.target.value)})}
                              className="w-full h-12 px-5 rounded-xl border border-slate-200 transition-all font-bold text-slate-900 outline-none bg-white shadow-sm focus:border-indigo-500"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-12 md:col-span-4">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Năm tái bản</label>
                            <input
                              type="number"
                              value={bookFormData.publishYear || ''}
                              onChange={(e) => setBookFormData({...bookFormData, publishYear: Number(e.target.value)})}
                              className="w-full h-12 px-5 rounded-xl border border-slate-200 transition-all font-bold text-slate-900 outline-none bg-white shadow-sm focus:border-indigo-500"
                            />
                          </div>
                          <div className="col-span-12">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Đường dẫn ảnh bìa *</label>
                            <input
                              type="url"
                              required
                              value={bookFormData.cover || ''}
                              onChange={(e) => setBookFormData({...bookFormData, cover: e.target.value})}
                              className="w-full h-12 px-5 rounded-xl border border-slate-200 transition-all font-bold text-slate-900 outline-none bg-white shadow-sm focus:border-indigo-500 placeholder:text-slate-300"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="col-span-12">
                            <label className="text-xs font-black uppercase tracking-widest mb-3 block text-slate-900">Mô tả tóm tắt</label>
                            <textarea
                              value={bookFormData.description || ''}
                              onChange={(e) => setBookFormData({...bookFormData, description: e.target.value})}
                              rows={4}
                              className="w-full p-5 rounded-2xl border border-slate-200 transition-all font-medium text-slate-700 outline-none bg-white shadow-sm focus:border-indigo-500 resize-none leading-relaxed"
                              placeholder="Nhập giới thiệu ngắn về sách..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Visual Preview */}
                  <div className="w-[320px] border-l border-slate-100 bg-white p-8 flex flex-col items-center overflow-y-auto custom-scrollbar">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 self-start">Xem trước trực quan</h3>
                    
                    <div className="w-full group">
                      <div className="relative aspect-[3/4] bg-slate-100 rounded-[1.5rem] overflow-hidden shadow-xl ring-1 ring-slate-200 border-2 border-white transition-all duration-500 group-hover:translate-y-[-4px]">
                        {bookFormData.cover ? (
                          <img 
                            src={bookFormData.cover} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {(e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Lỗi+Ảnh'}}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                            <i className="fa-solid fa-image text-4xl"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest">Chưa có ảnh bìa</span>
                          </div>
                        )}
                        
                        {/* Preview Badge */}
                        <div className="absolute top-3 right-3 scale-110 origin-top-right">
                          {renderBadge(bookFormData.badge || '', bookFormData.stockQuantity)}
                        </div>
                      </div>

                      <div className="mt-5 text-center space-y-2">
                        <h4 className="text-base font-black text-slate-900 line-clamp-2 leading-tight px-2">
                          {bookFormData.title || 'Tiêu đề sách'}
                        </h4>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg font-black text-indigo-600">
                            {bookFormData.price ? formatPrice(bookFormData.price) : '0 ₫'}
                          </span>
                          {bookFormData.originalPrice && bookFormData.originalPrice > (bookFormData.price || 0) && (
                            <span className="text-xs font-bold text-slate-300 line-through">
                              {formatPrice(bookFormData.originalPrice)}
                            </span>
                          )}
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          (bookFormData.stockQuantity || 0) > 0 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${(bookFormData.stockQuantity || 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {(bookFormData.stockQuantity || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 w-full p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-2 text-indigo-600">
                        <i className="fa-solid fa-circle-info text-xs"></i>
                        <span className="text-[9px] font-black uppercase tracking-widest">Ghi chú vận hành</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        Thông tin xem trước này phản ánh trung thực cách sản phẩm sẽ hiển thị.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Simplified Footer Actions */}
                <div className="px-10 py-8 border-t border-slate-100 bg-white flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400 italic">
                    * Các trường có dấu sao là bắt buộc phải nhập liệu.
                  </p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsBookModalOpen(false)}
                      className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group active:scale-95"
                    >
                      <i className={`fa-solid ${editingBook ? 'fa-check-circle' : 'fa-plus-circle'} text-sm`}></i>
                      <span>{editingBook ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</span>
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

