
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
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingISBN, setIsFetchingISBN] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [isFormProcessing, setIsFormProcessing] = useState(false);

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

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStock]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.isbn && book.isbn.includes(searchTerm));

      if (!matchesSearch) return false;

      if (filterStock === 'low') return book.stockQuantity > 0 && book.stockQuantity <= 10;
      if (filterStock === 'out') return book.stockQuantity === 0;
      return true;
    });
  }, [books, filterStock, searchTerm]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Inventory Stats
  const stats = useMemo(() => {
    return {
      total: books.length,
      low: books.filter(b => b.stockQuantity > 0 && b.stockQuantity <= 10).length,
      out: books.filter(b => b.stockQuantity === 0).length,
      value: books.reduce((acc, b) => acc + (b.price * (b.stockQuantity || 0)), 0)
    };
  }, [books]);

  const handleUpdateStock = async (bookId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await db.updateBook(bookId, { stockQuantity: newStock });
      toast.success('Cập nhật tồn kho thành công');
      refreshData();
    } catch (error) {
      ErrorHandler.handle(error, 'cập nhật tồn kho');
    }
  };

  const handleExportInventory = () => {
    const data = books.map(b => ({
      'Tên sách': b.title,
      'ISBN': b.isbn || 'N/A',
      'Giá bán': b.price,
      'Tồn kho': b.stockQuantity,
      'Trạng thái': b.stockQuantity === 0 ? 'Hết hàng' : b.stockQuantity <= 10 ? 'Sắp hết' : 'Sẵn sàng'
    }));
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digital-book-inventory-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Đã xuất báo cáo tồn kho');
  };

  // Render Badge Helper
  const renderBadge = (badgeText: string, stockQuantity?: number, isTable: boolean = false) => {
    let colorClass = "bg-muted text-muted-foreground border-border";
    let icon = "fa-tag";

    const text = badgeText?.toLowerCase() || "";
    if (text.includes("mới")) {
      colorClass = "bg-chart-1/10 text-chart-1 border-chart-1/20";
      icon = "fa-wand-magic-sparkles";
    } else if (text.includes("giảm") || text.includes("sale") || text.includes("bán chạy")) {
      colorClass = "bg-destructive/10 text-destructive border-destructive/20";
      icon = "fa-fire-flame-curved";
      if (!badgeText && text.includes("bán chạy")) badgeText = "Bán chạy";
    } else if (text.includes("kinh điển")) {
      colorClass = "bg-primary/10 text-primary border-primary/20";
      icon = "fa-book-bookmark";
    } else if (stockQuantity === 0) {
      colorClass = "bg-foreground text-background border-foreground";
      icon = "fa-box-open";
      badgeText = "Hết hàng";
    } else if (stockQuantity !== undefined && stockQuantity < 5 && !badgeText) {
      colorClass = "bg-chart-3/10 text-chart-3 border-chart-3/20";
      icon = "fa-triangle-exclamation";
      badgeText = "Sắp hết";
    }

    if (!badgeText && (stockQuantity === undefined || stockQuantity >= 5)) return isTable ? <span className="text-slate-400 text-micro font-bold uppercase tracking-widest">—</span> : null;

    const baseClass = isTable 
      ? `inline-flex items-center gap-1.5 px-2.5 py-1 ${colorClass} text-[9px] font-black uppercase tracking-wider rounded-lg border shadow-sm transition-all hover:scale-105`
      : `absolute -top-1.5 -right-1.5 px-2 py-0.5 ${colorClass} text-white text-[8px] font-black uppercase tracking-wider rounded-md shadow-lg border z-10 flex items-center gap-1 animate-fadeIn`;

    return (
      <div className={baseClass}>
        <i className={`fa-solid ${icon} ${isTable ? "text-[8px]" : "text-[7px]"} opacity-80`}></i>
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
    setIsFormProcessing(true);
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
    } finally {
      setIsFormProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Inventory Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng sản phẩm', value: stats.total, icon: 'fa-book', color: 'primary' },
          { label: 'Sắp hết hàng', value: stats.low, icon: 'fa-triangle-exclamation', color: 'chart-3' },
          { label: 'Đã hết hàng', value: stats.out, icon: 'fa-box-open', color: 'destructive' },
          { label: 'Giá trị kho', value: formatPrice(stats.value), icon: 'fa-wallet', color: 'chart-1' }
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

      {seedStatus && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-slideIn border ${
          seedStatus.type === 'success' ? 'bg-chart-1/10 text-chart-1 border-chart-1/20' :
          seedStatus.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' :
          'bg-primary/10 text-primary border-primary/20'
        }`}>
          <i className={`fa-solid ${
            seedStatus.type === 'success' ? 'fa-check-circle' :
            seedStatus.type === 'error' ? 'fa-exclamation-circle' :
            'fa-info-circle'
          }`}></i>
          <p className="text-sm font-bold">{seedStatus.msg}</p>
        </div>
      )}

      <div className={`${isMidnight ? 'bg-[#1e293b]/40 border-white/5' : 'bg-card/40 backdrop-blur-xl border-border shadow-xl shadow-slate-200/30'} flex flex-wrap items-center justify-between gap-6 p-5 rounded-[2.5rem] border transition-all hover:border-primary/20 sticky top-0 z-30`}>
        
        {/* Nhóm Tìm kiếm & Lọc */}
        <div className="flex flex-wrap items-center gap-5 flex-1 min-w-[300px]">
          {/* Thanh tìm kiếm Premium */}
          <div className="relative group flex-1 max-w-md">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isMidnight ? 'bg-slate-700 text-slate-400' : 'bg-muted text-muted-foreground'
            } group-focus-within:bg-primary group-focus-within:text-primary-foreground group-focus-within:shadow-lg group-focus-within:shadow-primary/20`}>
              <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm sách, tác giả, ISBN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full h-12 pl-16 pr-5 rounded-2xl text-xs font-bold outline-none border transition-all ${
                isMidnight 
                ? 'bg-slate-800/50 border-white/5 text-slate-200 focus:bg-slate-800' 
                : 'bg-card border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/5'
              }`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full transition-all flex items-center justify-center ${
                  isMidnight ? 'bg-slate-700 text-slate-400 hover:bg-destructive' : 'bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground'
                }`}
              >
                <i className="fa-solid fa-xmark text-[10px]"></i>
              </button>
            )}
          </div>

          <div className={`h-8 w-px hidden xl:block ${isMidnight ? 'bg-white/5' : 'bg-border'}`}></div>

          {/* Lọc kho */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Lọc:</span>
            <div className={`flex gap-1.5 p-1.5 rounded-2xl border ${
              isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/80 border-border/50'
            }`}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'low', label: 'Sắp hết' },
                { id: 'out', label: 'Hết hàng' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStock(filter.id as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    filterStock === filter.id 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nhóm Hành động */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportInventory}
            className={`h-12 px-6 rounded-2xl font-bold transition-all flex items-center gap-2 group border shadow-sm ${
              isMidnight 
              ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20' 
              : 'bg-card border-border text-foreground hover:bg-muted hover:border-border'
            }`}
          >
            <i className="fa-solid fa-file-export text-xs opacity-50 group-hover:opacity-100 group-hover:text-primary"></i>
            <span className="text-xs uppercase tracking-wider">Xuất</span>
          </button>
          
          <button 
            onClick={handleAutoSync}
            disabled={isSyncing}
            className={`h-12 px-6 rounded-2xl font-bold transition-all shadow-sm border flex items-center gap-2 group ${
              isSyncing 
              ? (isMidnight ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed' : 'bg-muted text-muted-foreground border-border cursor-not-allowed')
              : (isMidnight ? 'bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border-chart-1/20' : 'bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border-chart-1/20')
            }`}
          >
            <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'} text-xs'}`}></i>
            <span className="text-xs uppercase tracking-wider">{isSyncing ? 'Đang sync...' : 'Auto Sync'}</span>
          </button>

          <button 
            onClick={handleOpenAddBook}
            className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-3 group active:scale-95"
          >
            <i className="fa-solid fa-plus text-xs group-hover:rotate-90 transition-transform duration-300"></i>
             Thêm sách mới
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredBooks.length > 0 && (
        <div className={`${isMidnight ? 'bg-[#1e293b]/30 border-white/5' : 'bg-card/30 backdrop-blur-md border-border shadow-xl'} flex items-center justify-between p-4 rounded-2xl border`}>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={toggleSelectAllBooks}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-border/60 group-hover:border-primary/50'
                }`}
              >
                {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
              </div>
              <span className="text-xs font-bold text-muted-foreground">Chọn tất cả ({filteredBooks.length})</span>
            </label>
            {selectedBooks.length > 0 && (
              <div className="h-4 w-px bg-border"></div>
            )}
            {selectedBooks.length > 0 && (
              <span className="text-xs font-bold text-primary">Đã chọn {selectedBooks.length} sản phẩm</span>
            )}
          </div>
          {selectedBooks.length > 0 && (
            <button 
              onClick={handleBulkDeleteBooks}
              disabled={isDeletingBulk}
              className="bg-destructive/10 text-destructive hover:bg-destructive/20 px-4 py-2 rounded-xl text-micro font-bold uppercase tracking-premium transition-all flex items-center gap-2"
            >
              <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
              <span>Xóa hàng loạt</span>
            </button>
          )}
        </div>
      )}

      <div className={`${isMidnight ? 'bg-[#1e293b] border-white/5' : 'bg-card backdrop-blur-xl border-border shadow-2xl'} rounded-[2.5rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className={`border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/30 border-border'}`}>
              <th className="px-4 py-5 text-micro font-bold text-muted-foreground uppercase tracking-premium w-14 text-center">
                <div 
                  onClick={toggleSelectAllBooks}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                    selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-card shadow-inner')
                  }`}
                >
                  {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
                </div>
              </th>
              <th className="px-4 py-5 text-micro font-bold text-muted-foreground uppercase tracking-premium min-w-[300px]">Thông tin sách</th>
              <th className="px-4 py-5 text-micro font-bold text-muted-foreground uppercase tracking-premium hidden xl:table-cell w-40">Nhãn hiệu</th>
              <th className="px-4 py-5 text-micro font-bold text-muted-foreground uppercase tracking-premium hidden md:table-cell w-32">Giá bán</th>
              <th className="px-4 py-5 text-micro font-bold text-muted-foreground uppercase tracking-premium hidden lg:table-cell w-32">Tồn kho</th>
              <th className="px-4 py-5 text-micro font-bold text-muted-foreground uppercase tracking-premium text-right w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
            {paginatedBooks.map(book => (
              <tr key={book.id} className={`group transition-all ${
                selectedBooks.includes(book.id) 
                ? 'bg-primary/5' 
                : (isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-muted/30')
              }`}>
                <td className="px-4 py-4 text-center">
                  <div 
                    onClick={() => toggleSelectBook(book.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                      selectedBooks.includes(book.id)
                      ? 'bg-primary border-primary text-primary-foreground'
                      : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-card') + ' group-hover:border-primary/40'
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
                      <h3 className="font-extrabold text-sm mb-0.5 truncate text-foreground">{book.title}</h3>
                      <p className="text-micro font-bold uppercase tracking-premium truncate text-muted-foreground">{book.author}</p>
                      <p className="text-micro mt-1 md:hidden font-extrabold whitespace-nowrap text-muted-foreground">{formatPrice(book.price)} • {book.stockQuantity > 0 ? `${book.stockQuantity} cuốn` : 'Hết hàng'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 hidden xl:table-cell whitespace-nowrap">
                  {renderBadge(book.badge || '', book.stockQuantity, true)}
                </td>
                <td className="px-4 py-4 hidden md:table-cell whitespace-nowrap">
                  <span className="text-sm font-extrabold tracking-tight text-primary">{formatPrice(book.price)}</span>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell whitespace-nowrap">
                  <div className="flex items-center gap-3 group/stock">
                    <button 
                      onClick={() => handleUpdateStock(book.id, book.stockQuantity, -1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isMidnight 
                        ? 'bg-slate-700 text-slate-400 hover:bg-destructive/10 hover:text-destructive' 
                        : 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                      }`}
                    >
                      <i className="fa-solid fa-minus text-[10px]"></i>
                    </button>
                    
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-micro font-bold uppercase tracking-premium min-w-[100px] justify-center ${
                      book.stockQuantity > 10 
                      ? 'bg-chart-1/10 text-chart-1' :
                      book.stockQuantity > 0 
                      ? 'bg-chart-3/10 text-chart-3' : 
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {book.stockQuantity > 0 ? `${book.stockQuantity} quyển` : 'Hết hàng'}
                    </span>

                    <button 
                      onClick={() => handleUpdateStock(book.id, book.stockQuantity, 1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isMidnight 
                        ? 'bg-slate-700 text-slate-400 hover:bg-chart-1/10 hover:text-chart-1' 
                        : 'bg-muted text-muted-foreground hover:bg-chart-1/10 hover:text-chart-1'
                      }`}
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEditBook(book)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                        isMidnight 
                        ? 'bg-slate-700 text-slate-300 hover:bg-primary/10 hover:text-primary' 
                        : 'bg-muted text-foreground hover:bg-primary/10 hover:text-primary'
                      }`}
                      title="Chỉnh sửa"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDeleteBook(book)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm bg-destructive/10 text-destructive hover:bg-destructive/20"
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
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-muted/50">
              <i className="fa-solid fa-box-open text-3xl text-muted-foreground/30"></i>
            </div>
            <h3 className="font-bold uppercase tracking-premium text-micro text-muted-foreground">Không có dữ liệu phù hợp</h3>
          </div>
        )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`p-6 border-t ${isMidnight ? 'border-white/5 bg-slate-900/20' : 'border-border bg-muted/20'}`}>
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

      {/* Add/Edit Book Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {isBookModalOpen && (
          <motion.div 
            key="admin-book-modal-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={() => !isFormProcessing && setIsBookModalOpen(false)} />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`${isMidnight ? 'bg-[#1e293b] border-white/5' : 'bg-card border-border'} w-full max-w-6xl h-full max-h-[85vh] rounded-[3.5rem] shadow-3xl overflow-hidden border relative z-10 flex flex-col`}
            >
              <form onSubmit={handleSaveBook} className="flex flex-col h-full">
                {/* Header */}
                <div className={`px-10 py-8 border-b flex items-center justify-between shrink-0 ${
                  isMidnight ? 'bg-slate-800/50 border-white/10' : 'bg-muted/20 border-border'
                }`}>
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                        <i className={`fa-solid ${editingBook ? 'fa-edit' : 'fa-plus'}`}></i>
                      </div>
                      {editingBook ? 'Chỉnh sửa sản phẩm' : 'Thêm sách mới'}
                    </h2>
                    <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1 ml-[60px]">
                      {editingBook ? `Mã: ${editingBook.id}` : 'Điền đầy đủ các thông tin để tạo sản phẩm'}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all ${
                      isMidnight ? 'bg-slate-700' : 'bg-muted'
                    }`}
                  >
                    <i className="fa-solid fa-xmark text-lg"></i>
                  </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Left Column - Form Inputs */}
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    <div className="max-w-4xl space-y-12">
                      
                      {/* Section: Basic Info */}
                      <div>
                        <h3 className="text-micro font-black uppercase tracking-premium text-primary mb-6 flex items-center gap-3">
                          <span className="w-2 h-6 bg-primary rounded-full"></span>
                          Thông tin cơ bản
                        </h3>
                        <div className="grid grid-cols-12 gap-8">
                          <div className="col-span-12">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Tiêu đề sách *</label>
                            <input
                              type="text"
                              required
                              value={bookFormData.title || ''}
                              onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                              className={`w-full h-14 px-6 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                                isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                              }`}
                              placeholder="VD: Nhà Giả Kim..."
                            />
                          </div>
                          
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Tác giả *</label>
                            <div className="relative">
                              <select
                                required
                                value={bookFormData.authorId || ''}
                                onChange={(e) => setBookFormData({...bookFormData, authorId: e.target.value})}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none appearance-none cursor-pointer focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                                  isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                }`}
                              >
                                <option value="">-- Chọn tác giả --</option>
                                {authors.sort((a,b) => a.name.localeCompare(b.name)).map(author => (
                                  <option key={author.id} value={author.id}>{author.name}</option>
                                ))}
                              </select>
                              <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none"></i>
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-6">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Danh mục *</label>
                            <div className="relative">
                              <select
                                required
                                value={bookFormData.category || ''}
                                onChange={(e) => setBookFormData({...bookFormData, category: e.target.value})}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none appearance-none cursor-pointer focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                                  isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                }`}
                              >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.sort((a,b) => a.name.localeCompare(b.name)).map(category => (
                                  <option key={category.name} value={category.name}>{category.name}</option>
                                ))}
                              </select>
                              <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section: Pricing & Stock */}
                      <div>
                        <h3 className="text-micro font-black uppercase tracking-premium text-chart-1 mb-6 flex items-center gap-3">
                          <span className="w-2 h-6 bg-chart-1 rounded-full"></span>
                          Giá & Kho hàng
                        </h3>
                        <div className="grid grid-cols-12 gap-8">
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Giá bán hiện tại (VNĐ) *</label>
                            <div className="relative">
                              <input
                                type="number"
                                required
                                min="0"
                                value={bookFormData.price || ''}
                                onChange={(e) => setBookFormData({...bookFormData, price: Number(e.target.value)})}
                                className={`w-full h-14 pl-6 pr-12 rounded-2xl border transition-all font-black text-foreground text-sm outline-none focus:border-chart-1 focus:ring-4 focus:ring-chart-1/10 ${
                                  isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                }`}
                                placeholder="0"
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-xs text-muted-foreground">₫</span>
                            </div>
                          </div>
                          
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Số lượng tồn kho *</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={bookFormData.stockQuantity || ''}
                              onChange={(e) => setBookFormData({...bookFormData, stockQuantity: Number(e.target.value)})}
                              className={`w-full h-14 px-6 rounded-2xl border transition-all font-black text-foreground text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                                isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                              }`}
                              placeholder="0"
                            />
                          </div>

                          <div className="col-span-12">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Nhãn quảng bá (Badge)</label>
                            <div className="relative">
                              <select
                                value={bookFormData.badge || ''}
                                onChange={(e) => setBookFormData({...bookFormData, badge: e.target.value})}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none appearance-none cursor-pointer focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                                  isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                }`}
                              >
                                <option value="">Không có nhãn</option>
                                <option value="Bán chạy">🔥 Bán chạy</option>
                                <option value="Kinh điển">💎 Kinh điển</option>
                                <option value="Mới">✨ Mới về</option>
                                <option value="Giảm giá">🏷️ Khuyến mãi</option>
                                <option value="Limited">🌟 Limited</option>
                              </select>
                              <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section: Additional Details */}
                      <div>
                        <h3 className="text-micro font-black uppercase tracking-premium text-chart-3 mb-6 flex items-center gap-3">
                          <span className="w-2 h-6 bg-chart-3 rounded-full"></span>
                          Thông tin bổ sung
                        </h3>
                        <div className="grid grid-cols-12 gap-8">
                          <div className="col-span-12 md:col-span-6">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1 flex items-center justify-between">
                              Mã ISBN
                              <button 
                                type="button"
                                onClick={handleFetchBookByISBN}
                                disabled={isFetchingISBN}
                                className="text-[10px] text-primary hover:text-primary/70 font-black flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full transition-all"
                              >
                                {isFetchingISBN ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                Tự động điền
                              </button>
                            </label>
                            <input
                              type="text"
                              value={bookFormData.isbn || ''}
                              onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})}
                              className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none focus:border-primary focus:bg-card ${
                                isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                              }`}
                              placeholder="ISBN..."
                            />
                          </div>
                          
                          <div className="col-span-12 md:col-span-3">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Số trang</label>
                            <input
                              type="number"
                              value={bookFormData.pages || ''}
                              onChange={(e) => setBookFormData({...bookFormData, pages: Number(e.target.value)})}
                              className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none focus:border-primary focus:bg-card ${
                                isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                              }`}
                              placeholder="0"
                            />
                          </div>

                          <div className="col-span-12 md:col-span-3">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Năm tái bản</label>
                            <input
                              type="number"
                              value={bookFormData.publishYear || ''}
                              onChange={(e) => setBookFormData({...bookFormData, publishYear: Number(e.target.value)})}
                              className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none focus:border-primary focus:bg-card ${
                                isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                              }`}
                              placeholder="2024"
                            />
                          </div>

                          <div className="col-span-12">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Đường dẫn ảnh bìa *</label>
                            <input
                              type="url"
                              required
                              value={bookFormData.cover || ''}
                              onChange={(e) => setBookFormData({...bookFormData, cover: e.target.value})}
                              className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none focus:border-primary focus:bg-card ${
                                isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                              }`}
                              placeholder="https://..."
                            />
                          </div>

                          <div className="col-span-12">
                            <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Mô tả tóm tắt</label>
                            <textarea
                              value={bookFormData.description || ''}
                              onChange={(e) => setBookFormData({...bookFormData, description: e.target.value})}
                              rows={4}
                              className={`w-full px-6 py-4 rounded-3xl border transition-all font-medium text-foreground text-sm outline-none focus:border-primary focus:bg-card resize-none leading-relaxed ${
                                isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                              }`}
                              placeholder="Nhập giới thiệu ngắn về sách..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Visual Preview */}
                  <div className={`w-[350px] border-l p-10 flex flex-col items-center overflow-y-auto custom-scrollbar shrink-0 ${
                    isMidnight ? 'border-white/10 bg-slate-800/30' : 'border-border bg-muted/10'
                  }`}>
                    <h3 className="text-micro font-black uppercase tracking-premium text-muted-foreground mb-10 self-start flex items-center gap-3">
                       <i className="fa-solid fa-eye text-xs"></i>
                       Xem trước hiển thị
                    </h3>
                    
                    <div className="w-full group">
                      <div className={`relative aspect-[3/4.2] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-primary/20 group-hover:-translate-y-2 ring-1 ${
                        isMidnight ? 'bg-slate-800 ring-white/10' : 'bg-card ring-border'
                      }`}>
                        {bookFormData.cover ? (
                          <img 
                            src={bookFormData.cover} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {(e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Lỗi+Ảnh'}}
                          />
                        ) : (
                          <div className={`w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-4 border-2 border-dashed rounded-[2.5rem] ${
                            isMidnight ? 'border-white/10 bg-slate-700/30' : 'border-border/60 bg-muted/20'
                          }`}>
                            <i className="fa-solid fa-image text-4xl"></i>
                            <span className="text-micro font-black uppercase tracking-premium">Chưa có ảnh bìa</span>
                          </div>
                        )}
                        
                        {/* Preview Badge */}
                        <div className="absolute top-5 right-5 scale-90 origin-top-right">
                          {renderBadge(bookFormData.badge || '', bookFormData.stockQuantity)}
                        </div>
                      </div>

                      <div className="mt-10 text-center space-y-3">
                        <h4 className="text-lg font-black text-foreground line-clamp-2 leading-tight px-4">
                          {bookFormData.title || 'Tiêu đề sản phẩm'}
                        </h4>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl font-black text-primary">
                            {bookFormData.price ? formatPrice(bookFormData.price) : '0 ₫'}
                          </span>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-micro font-black uppercase tracking-premium ${
                          (bookFormData.stockQuantity || 0) > 0 
                            ? 'bg-chart-1/10 text-chart-1 border border-chart-1/20' 
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${(bookFormData.stockQuantity || 0) > 0 ? 'bg-chart-1' : 'bg-destructive'}`}></span>
                          {(bookFormData.stockQuantity || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-10 w-full">
                       <div className={`p-6 rounded-3xl border shadow-sm ${
                         isMidnight ? 'bg-slate-700/50 border-white/10' : 'bg-card border-border'
                       }`}>
                          <div className="flex items-center gap-3 mb-3 text-primary uppercase tracking-premium text-micro font-black">
                            <i className="fa-solid fa-circle-info text-xs"></i>
                            <span>Thông tin lưu ý</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                            Vui lòng kiểm tra kỹ giá bán và số lượng tồn kho trước khi cập nhật dữ liệu lên hệ thống.
                          </p>
                       </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer Actions */}
                <div className={`px-10 py-8 border-t flex items-center justify-between shrink-0 ${
                  isMidnight ? 'bg-slate-800/80 border-white/10' : 'bg-card border-border'
                }`}>
                  <p className="text-micro font-bold text-muted-foreground italic">
                    * Nhấn Esc hoặc bấm bên ngoài để hủy bỏ thay đổi.
                   </p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsBookModalOpen(false)}
                      className={`px-8 h-12 rounded-2xl text-micro font-black uppercase tracking-premium transition-all border ${
                        isMidnight ? 'bg-slate-700 text-slate-300 border-white/10 hover:bg-slate-600' : 'bg-muted text-foreground border-border hover:bg-muted/80'
                      }`}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isFormProcessing}
                      className="px-12 h-14 bg-primary text-primary-foreground rounded-2xl text-micro font-black uppercase tracking-premium hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {isFormProcessing ? (
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                      ) : (
                        <i className={`fa-solid ${editingBook ? 'fa-check-circle' : 'fa-plus-circle'}`}></i>
                      )}
                      <span>{editingBook ? 'Cập nhật ngay' : 'Tạo sản phẩm'}</span>
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


