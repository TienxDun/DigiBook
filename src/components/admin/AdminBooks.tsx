
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { db } from '@/services/db';
import { Book, CategoryInfo, Author } from '@/types';
import { ErrorHandler } from '@/services/errorHandler';
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
  const [seedStatus, setSeedStatus] = useState<{ msg: string, type: 'success' | 'error' | 'info' } | null>(null);
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

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeImportTab, setActiveImportTab] = useState<'search' | 'auto'>('search');

  // Search State
  const [importSearchTerm, setImportSearchTerm] = useState('');
  const [importResults, setImportResults] = useState<Book[]>([]);
  const [isSearchingImport, setIsSearchingImport] = useState(false);
  const [selectedImportBooks, setSelectedImportBooks] = useState<string[]>([]);

  // Auto Scan State
  const [autoScanCategory, setAutoScanCategory] = useState('');
  const [autoScanLimit, setAutoScanLimit] = useState(20);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, status: '' });

  const handleOpenImport = () => {
    setIsImportModalOpen(true);
    setImportResults([]);
    setImportSearchTerm('');
    setSelectedImportBooks([]);
    setActiveImportTab('search');
    setScanProgress({ current: 0, total: 0, status: '' });
  };

  const handleSearchImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!importSearchTerm.trim()) return;

    setIsSearchingImport(true);
    setSelectedImportBooks([]);
    try {
      const results = await db.searchBooksFromTiki(importSearchTerm);
      if (results.length === 0) {
        toast('Không tìm thấy sách nào phù hợp', { icon: '🔍' });
      }
      setImportResults(results);
    } catch (error) {
      toast.error('Lỗi tìm kiếm sách');
    } finally {
      setIsSearchingImport(false);
    }
  };

  const importSingleBook = async (book: Book): Promise<boolean> => {
    try {
      const details = await db.getBookDetailsFromTiki(book.id);
      const fullBook = { ...book, ...details };

      const matchedAuthor = authors.find(a => a.name.toLowerCase() === fullBook.author.toLowerCase());
      if (matchedAuthor) {
        fullBook.authorId = matchedAuthor.id;
      }

      await db.saveBook(fullBook);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleImportBook = async (book: Book) => {
    toast.loading('Đang nhập sách...', { id: 'import-loading' });
    const success = await importSingleBook(book);
    if (success) {
      toast.success(`Đã nhập sách "${book.title}"`, { id: 'import-loading' });
      await refreshData();
    } else {
      toast.error('Lỗi khi nhập sách', { id: 'import-loading' });
    }
  };

  const handleBulkImport = async () => {
    if (selectedImportBooks.length === 0) return;

    setIsAutoScanning(true); // Re-use loading state
    setScanProgress({ current: 0, total: selectedImportBooks.length, status: 'Đang nhập...' });

    let successCount = 0;
    const booksToImport = importResults.filter(b => selectedImportBooks.includes(b.id));

    for (let i = 0; i < booksToImport.length; i++) {
      const book = booksToImport[i];
      setScanProgress({ current: i + 1, total: booksToImport.length, status: `Đang nhập: ${book.title}...` });
      const success = await importSingleBook(book);
      if (success) successCount++;
      // Small delay to be nice to API
      await new Promise(r => setTimeout(r, 500));
    }

    setIsAutoScanning(false);
    toast.success(`Đã nhập thành công ${successCount}/${selectedImportBooks.length} sách`);
    setSelectedImportBooks([]);
    await refreshData();
  };

  const handleStartAutoScan = async () => {
    if (!autoScanCategory) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    setIsAutoScanning(true);
    setScanProgress({ current: 0, total: autoScanLimit, status: 'Đang tìm kiếm...' });

    try {
      // Determine keywords based on Category
      let keywords = autoScanCategory.toLowerCase();
      if (keywords === 'kinh tế') keywords = 'sách kinh tế bán chạy';
      else if (keywords === 'văn học') keywords = 'tiểu thuyết văn học';
      else if (keywords === 'thiếu nhi') keywords = 'truyện thiếu nhi';

      let importedCount = 0;
      let page = 1;

      while (importedCount < autoScanLimit && page <= 5) {
        setScanProgress(prev => ({ ...prev, status: `Đang quét trang ${page}...` }));

        const results = await db.searchBooksFromTiki(keywords, page);
        if (results.length === 0) break; // End of results

        // Filter duplicates
        const newBooks = results.filter(b => !books.some(ex => ex.title.toLowerCase() === b.title.toLowerCase())); // Simple Title check locally + checking existing DB in search

        for (const book of newBooks) {
          if (importedCount >= autoScanLimit) break;

          setScanProgress({ current: importedCount + 1, total: autoScanLimit, status: `Đang nhập: ${book.title}...` });
          const success = await importSingleBook(book);
          if (success) importedCount++;

          await new Promise(r => setTimeout(r, 800)); // Delay
        }
        page++;
      }

      toast.success(`Đã tự động nhập ${importedCount} sách mới!`);
      await refreshData();

    } catch (err) {
      toast.error("Lỗi trong quá trình quét tự động");
    } finally {
      setIsAutoScanning(false);
    }
  };

  const toggleImportSelect = (id: string) => {
    setSelectedImportBooks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const _old_handleImportBook = async (book: Book) => {
    try {
      // Check duplicate by title + author loosely if id check passes (Tiki ID is unique enough though)
      // ID check is handled in searchBooksFromTiki somewhat (filtering existing ISBNs) but let's double check

      // Fetch full details
      toast.loading('Đang lấy thông tin chi tiết...', { id: 'import-loading' });
      const details = await db.getBookDetailsFromTiki(book.id);

      const fullBook = { ...book, ...details };
      // Override author to map to system author if possible or create new?
      // For now we just save the string. If we want relational, we need more logic.
      // But AdminBooks save logic usually just handles Book object.
      // Let's create a new author generic if needed? 
      // Actually the Book type has 'author' string and optional 'authorId'. 
      // We will leave authorId blank for imported books or try to match by name.
      const matchedAuthor = authors.find(a => a.name.toLowerCase() === fullBook.author.toLowerCase());
      if (matchedAuthor) {
        fullBook.authorId = matchedAuthor.id;
      }

      await db.saveBook(fullBook);
      toast.success(`Đã nhập sách "${fullBook.title}"`, { id: 'import-loading' });

      // Update result list to show imported status visually?
      // For now just refresh data
      await refreshData();
    } catch (error) {
      toast.error('Lỗi khi nhập sách', { id: 'import-loading' });
      ErrorHandler.handle(error, 'nhập sách');
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
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-slideIn border ${seedStatus.type === 'success' ? 'bg-chart-1/10 text-chart-1 border-chart-1/20' :
          seedStatus.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' :
            'bg-primary/10 text-primary border-primary/20'
          }`}>
          <i className={`fa-solid ${seedStatus.type === 'success' ? 'fa-check-circle' :
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
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMidnight ? 'bg-slate-700 text-slate-400' : 'bg-muted text-muted-foreground'
              } group-focus-within:bg-primary group-focus-within:text-primary-foreground group-focus-within:shadow-lg group-focus-within:shadow-primary/20`}>
              <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm sách, tác giả, ISBN..."
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

          {/* Lọc kho */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Lọc:</span>
            <div className={`flex gap-1.5 p-1.5 rounded-2xl border ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/80 border-border/50'
              }`}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'low', label: 'Sắp hết' },
                { id: 'out', label: 'Hết hàng' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStock(filter.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${filterStock === filter.id
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
            className={`h-12 px-6 rounded-2xl font-bold transition-all flex items-center gap-2 group border shadow-sm ${isMidnight
              ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
              : 'bg-card border-border text-foreground hover:bg-muted hover:border-border'
              }`}
          >
            <i className="fa-solid fa-file-export text-xs opacity-50 group-hover:opacity-100 group-hover:text-primary"></i>
            <span className="text-xs uppercase tracking-wider">Xuất</span>
          </button>

          <button
            onClick={handleOpenImport}
            className={`h-12 px-6 rounded-2xl font-bold transition-all shadow-sm border flex items-center gap-2 group ${isMidnight ? 'bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border-chart-1/20' : 'bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border-chart-1/20'
              }`}
          >
            <i className="fa-solid fa-cloud-arrow-down text-xs"></i>
            <span className="text-xs uppercase tracking-wider">Nhập từ Internet</span>
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

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedBooks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`bg-card/40 backdrop-blur-md border-primary/20 shadow-xl flex items-center justify-between p-4 rounded-[2rem] border ${isMidnight ? 'bg-[#1e293b]/40' : ''}`}
          >
            <div className="flex items-center gap-4 ml-2">
              <span className="text-micro font-black text-primary uppercase tracking-premium">Đã chọn {selectedBooks.length} sách</span>
              <div className="h-4 w-px bg-border/60"></div>
              <button
                onClick={toggleSelectAllBooks}
                className="text-micro font-bold uppercase tracking-premium transition-colors text-muted-foreground hover:text-primary"
              >
                Bỏ chọn
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDeleteBooks}
                disabled={isDeletingBulk}
                className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-5 py-2.5 rounded-xl text-micro font-bold uppercase tracking-premium transition-all shadow-sm flex items-center gap-2"
              >
                <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
                <span>Xóa ({selectedBooks.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${isMidnight ? 'bg-[#1e293b] border-white/5' : 'bg-card backdrop-blur-xl border-border shadow-2xl'} rounded-[2.5rem] border overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className={`border-b ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/30 border-border'}`}>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide w-14 text-center">
                  <div
                    onClick={toggleSelectAllBooks}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : (isMidnight ? 'border-white/10 bg-slate-800' : 'border-border bg-card shadow-inner')
                      }`}
                  >
                    {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-xs"></i>}
                  </div>
                </th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide min-w-[300px]">Thông tin sách</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden xl:table-cell w-40">Nhãn hiệu</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell w-32">Giá bán</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide hidden lg:table-cell w-32">Tồn kho</th>
                <th className="px-4 py-5 text-xs font-bold text-muted-foreground uppercase tracking-wide text-right w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isMidnight ? 'divide-white/5' : 'divide-border'}`}>
              {paginatedBooks.map(book => (
                <tr key={book.id} className={`group transition-all ${selectedBooks.includes(book.id)
                  ? 'bg-primary/5'
                  : (isMidnight ? 'hover:bg-slate-700/30' : 'hover:bg-muted/30')
                  }`}>
                  <td className="px-4 py-4 text-center">
                    <div
                      onClick={() => toggleSelectBook(book.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedBooks.includes(book.id)
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
                        <h3 className="font-bold text-base mb-1 truncate text-foreground">{book.title}</h3>
                        <p className="text-xs font-medium uppercase tracking-wide truncate text-muted-foreground">{book.author}</p>
                        <p className="text-xs mt-1 md:hidden font-bold whitespace-nowrap text-muted-foreground">{formatPrice(book.price)} • {book.stockQuantity > 0 ? `${book.stockQuantity} cuốn` : 'Hết hàng'}</p>
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
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMidnight
                          ? 'bg-slate-700 text-slate-400 hover:bg-destructive/10 hover:text-destructive'
                          : 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                          }`}
                      >
                        <i className="fa-solid fa-minus text-[10px]"></i>
                      </button>

                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-micro font-bold uppercase tracking-premium min-w-[100px] justify-center ${book.stockQuantity > 10
                        ? 'bg-chart-1/10 text-chart-1' :
                        book.stockQuantity > 0
                          ? 'bg-chart-3/10 text-chart-3' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                        {book.stockQuantity > 0 ? `${book.stockQuantity} quyển` : 'Hết hàng'}
                      </span>

                      <button
                        onClick={() => handleUpdateStock(book.id, book.stockQuantity, 1)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMidnight
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
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${isMidnight
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
                  <div className={`px-10 py-8 border-b flex items-center justify-between shrink-0 ${isMidnight ? 'bg-slate-800/50 border-white/10' : 'bg-muted/20 border-border'
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
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all ${isMidnight ? 'bg-slate-700' : 'bg-muted'
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
                                onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
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
                                  onChange={(e) => setBookFormData({ ...bookFormData, authorId: e.target.value })}
                                  className={`w-full h-14 px-6 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none appearance-none cursor-pointer focus:border-primary focus:ring-4 focus:ring-primary/10 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                    }`}
                                >
                                  <option value="">-- Chọn tác giả --</option>
                                  {authors.sort((a, b) => a.name.localeCompare(b.name)).map(author => (
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
                                  onChange={(e) => setBookFormData({ ...bookFormData, category: e.target.value })}
                                  className={`w-full h-14 px-6 rounded-2xl border transition-all text-sm font-bold text-foreground outline-none appearance-none cursor-pointer focus:border-primary focus:ring-4 focus:ring-primary/10 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                    }`}
                                >
                                  <option value="">-- Chọn danh mục --</option>
                                  {categories.sort((a, b) => a.name.localeCompare(b.name)).map(category => (
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
                                  onChange={(e) => setBookFormData({ ...bookFormData, price: Number(e.target.value) })}
                                  className={`w-full h-14 pl-6 pr-12 rounded-2xl border transition-all font-black text-foreground text-sm outline-none focus:border-chart-1 focus:ring-4 focus:ring-chart-1/10 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
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
                                onChange={(e) => setBookFormData({ ...bookFormData, stockQuantity: Number(e.target.value) })}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all font-black text-foreground text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                  }`}
                                placeholder="0"
                              />
                            </div>

                            <div className="col-span-12">
                              <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Nhãn quảng bá (Badge)</label>
                              <div className="relative">
                                <select
                                  value={bookFormData.badge || ''}
                                  onChange={(e) => setBookFormData({ ...bookFormData, badge: e.target.value })}
                                  className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none appearance-none cursor-pointer focus:border-primary focus:ring-4 focus:ring-primary/10 ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
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
                                onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none focus:border-primary focus:bg-card ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                  }`}
                                placeholder="ISBN..."
                              />
                            </div>

                            <div className="col-span-12 md:col-span-3">
                              <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Số trang</label>
                              <input
                                type="number"
                                value={bookFormData.pages || ''}
                                onChange={(e) => setBookFormData({ ...bookFormData, pages: Number(e.target.value) })}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none focus:border-primary focus:bg-card ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                  }`}
                                placeholder="0"
                              />
                            </div>

                            <div className="col-span-12 md:col-span-3">
                              <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Năm tái bản</label>
                              <input
                                type="number"
                                value={bookFormData.publishYear || ''}
                                onChange={(e) => setBookFormData({ ...bookFormData, publishYear: Number(e.target.value) })}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none focus:border-primary focus:bg-card ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
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
                                onChange={(e) => setBookFormData({ ...bookFormData, cover: e.target.value })}
                                className={`w-full h-14 px-6 rounded-2xl border transition-all font-bold text-foreground text-sm outline-none focus:border-primary focus:bg-card ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                  }`}
                                placeholder="https://..."
                              />
                            </div>

                            <div className="col-span-12">
                              <label className="text-micro font-black uppercase tracking-premium mb-2.5 block text-muted-foreground ml-1">Mô tả tóm tắt</label>
                              <textarea
                                value={bookFormData.description || ''}
                                onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                                rows={4}
                                className={`w-full px-6 py-4 rounded-3xl border transition-all font-medium text-foreground text-sm outline-none focus:border-primary focus:bg-card resize-none leading-relaxed ${isMidnight ? 'bg-slate-800/50 border-white/5' : 'bg-muted/30 border-border'
                                  }`}
                                placeholder="Nhập giới thiệu ngắn về sách..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Visual Preview */}
                    <div className={`w-[350px] border-l p-10 flex flex-col items-center overflow-y-auto custom-scrollbar shrink-0 ${isMidnight ? 'border-white/10 bg-slate-800/30' : 'border-border bg-muted/10'
                      }`}>
                      <h3 className="text-micro font-black uppercase tracking-premium text-muted-foreground mb-10 self-start flex items-center gap-3">
                        <i className="fa-solid fa-eye text-xs"></i>
                        Xem trước hiển thị
                      </h3>

                      <div className="w-full group">
                        <div className={`relative aspect-[3/4.2] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-primary/20 group-hover:-translate-y-2 ring-1 ${isMidnight ? 'bg-slate-800 ring-white/10' : 'bg-card ring-border'
                          }`}>
                          {bookFormData.cover ? (
                            <img
                              src={bookFormData.cover}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Lỗi+Ảnh' }}
                            />
                          ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-4 border-2 border-dashed rounded-[2.5rem] ${isMidnight ? 'border-white/10 bg-slate-700/30' : 'border-border/60 bg-muted/20'
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
                          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-micro font-black uppercase tracking-premium ${(bookFormData.stockQuantity || 0) > 0
                            ? 'bg-chart-1/10 text-chart-1 border border-chart-1/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${(bookFormData.stockQuantity || 0) > 0 ? 'bg-chart-1' : 'bg-destructive'}`}></span>
                            {(bookFormData.stockQuantity || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-10 w-full">
                        <div className={`p-6 rounded-3xl border shadow-sm ${isMidnight ? 'bg-slate-700/50 border-white/10' : 'bg-card border-border'
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
                  <div className={`px-10 py-8 border-t flex items-center justify-between shrink-0 ${isMidnight ? 'bg-slate-800/80 border-white/10' : 'bg-card border-border'
                    }`}>
                    <p className="text-micro font-bold text-muted-foreground italic">
                      * Bấm bên ngoài để hủy bỏ thay đổi.
                    </p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setIsBookModalOpen(false)}
                        className={`px-8 h-12 rounded-2xl text-micro font-black uppercase tracking-premium transition-all border ${isMidnight ? 'bg-slate-700 text-slate-300 border-white/10 hover:bg-slate-600' : 'bg-muted text-foreground border-border hover:bg-muted/80'
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

      {/* Import Book Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {isImportModalOpen && (
            <motion.div
              key="import-book-portal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
            >
              <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={() => !isAutoScanning && setIsImportModalOpen(false)} />

              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`${isMidnight ? 'bg-[#1e293b] border-white/5' : 'bg-card border-border'} w-full max-w-6xl h-full max-h-[90vh] rounded-[3rem] shadow-3xl overflow-hidden border relative z-10 flex`}
              >
                {/* Sidebar Navigation */}
                <div className={`w-64 flex-shrink-0 border-r flex flex-col p-6 ${isMidnight ? 'bg-slate-900/50 border-white/5' : 'bg-muted/30 border-border'}`}>
                  <h3 className="font-black text-lg mb-8 px-2 flex items-center gap-3">
                    <i className="fa-solid fa-cloud-arrow-down text-primary"></i>
                    Nhập Sách
                  </h3>

                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveImportTab('search')}
                      disabled={isAutoScanning}
                      className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${activeImportTab === 'search'
                        ? (isMidnight ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20')
                        : (isMidnight ? 'text-slate-400 hover:bg-slate-800' : 'text-muted-foreground hover:bg-muted')}`}
                    >
                      <i className="fa-solid fa-magnifying-glass"></i>
                      Tìm kiếm thủ công
                    </button>
                    <button
                      onClick={() => setActiveImportTab('auto')}
                      disabled={isAutoScanning}
                      className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 ${activeImportTab === 'auto'
                        ? (isMidnight ? 'bg-chart-1 text-white shadow-lg shadow-chart-1/30' : 'bg-chart-1 text-white shadow-lg shadow-chart-1/30')
                        : (isMidnight ? 'text-slate-400 hover:bg-slate-800' : 'text-muted-foreground hover:bg-muted')}`}
                    >
                      <i className="fa-solid fa-robot"></i>
                      Quét tự động
                    </button>
                  </div>

                  <div className="mt-auto px-4 py-6 rounded-3xl bg-background/50 border text-center">
                    <h4 className="font-bold text-xs uppercase tracking-wide text-muted-foreground mb-2">TIPS</h4>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                      Sử dụng <strong>Quét tự động</strong> để nhanh chóng làm đầy kho sách theo danh mục.
                    </p>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative">

                  {/* Header Action Bar */}
                  <div className={`h-20 border-b flex items-center justify-between px-8 shrink-0 ${isMidnight ? 'border-white/5' : 'border-border'}`}>
                    <div className="flex items-center gap-4">
                      {activeImportTab === 'search' ? (
                        <h2 className="font-bold text-lg">Tìm kiếm trên Tiki</h2>
                      ) : (
                        <h2 className="font-bold text-lg flex items-center gap-2">
                          <i className="fa-solid fa-wand-magic-sparkles text-chart-1"></i>
                          Auto Scanner
                        </h2>
                      )}

                      {isAutoScanning && (
                        <div className="bg-chart-1/10 text-chart-1 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide animate-pulse">
                          Running...
                        </div>
                      )}
                    </div>
                    <button onClick={() => !isAutoScanning && setIsImportModalOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 overflow-hidden relative">
                    {/* Tab: SEARCH */}
                    {activeImportTab === 'search' && (
                      <div className="flex flex-col h-full">
                        <div className="p-6 border-b shrink-0 flex gap-4">
                          <form onSubmit={handleSearchImport} className="flex-1 relative group">
                            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                            <input
                              type="text"
                              autoFocus
                              placeholder="Nhập tên sách..."
                              value={importSearchTerm}
                              onChange={(e) => setImportSearchTerm(e.target.value)}
                              className={`w-full h-14 pl-14 pr-4 rounded-2xl border font-bold outline-none transition-all ${isMidnight ? 'bg-slate-800/50 border-white/5 focus:bg-slate-800' : 'bg-muted/20 border-border focus:border-primary'}`}
                            />
                          </form>
                          <button
                            onClick={() => handleSearchImport()}
                            disabled={isSearchingImport}
                            className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                          >
                            Tìm
                          </button>
                        </div>

                        {/* Toolbar */}
                        {importResults.length > 0 && (
                          <div className="px-6 py-3 flex items-center justify-between bg-muted/20 shrink-0">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={selectedImportBooks.length === importResults.length && importResults.length > 0}
                                onChange={() => {
                                  if (selectedImportBooks.length === importResults.length) setSelectedImportBooks([]);
                                  else setSelectedImportBooks(importResults.map(b => b.id));
                                }}
                              />
                              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Chọn tất cả</span>
                            </div>

                            {selectedImportBooks.length > 0 && (
                              <button
                                onClick={handleBulkImport}
                                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide shadow-md hover:bg-primary/90 transition-all animate-slideIn"
                              >
                                Nhập {selectedImportBooks.length} sách đã chọn
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {importResults.map(book => {
                              const isExist = books.some(b => b.title.toLowerCase() === book.title.toLowerCase());
                              const isSelected = selectedImportBooks.includes(book.id);
                              return (
                                <div key={book.id} onClick={() => !isExist && toggleImportSelect(book.id)} className={`relative flex gap-4 p-4 rounded-3xl border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : (isMidnight ? 'bg-slate-800/40 border-white/5 hover:border-white/10' : 'bg-card border-border hover:shadow-md')}`}>
                                  <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border bg-muted">
                                    <img src={book.cover} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm leading-tight line-clamp-2 mb-1">{book.title}</h4>
                                    <div className="text-xs text-muted-foreground mb-2">{book.author}</div>
                                    <div className="font-black text-chart-1">{formatPrice(book.price)}</div>
                                  </div>

                                  {isExist ? (
                                    <div className="absolute top-4 right-4 text-green-500 bg-green-500/10 px-2 py-1 rounded-lg text-[10px] font-black uppercase">Đã có</div>
                                  ) : (
                                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                                      {isSelected && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {importResults.length === 0 && !isSearchingImport && (
                              <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <i className="fa-solid fa-magnifying-glass text-4xl mb-4"></i>
                                <p>Nhập từ khóa để tìm sách...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab: AUTO SCAN */}
                    {activeImportTab === 'auto' && (
                      <div className="flex flex-col h-full p-10 items-center justify-center">
                        <div className="max-w-xl w-full">
                          <div className="text-center mb-10">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-chart-1/10 text-chart-1 flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-chart-1/20 animate-bounce">
                              <i className="fa-solid fa-robot"></i>
                            </div>
                            <h2 className="text-3xl font-black mb-2">Auto Scanner</h2>
                            <p className="text-muted-foreground">Hệ thống sẽ tự động quét và nhập sách theo danh mục bạn chọn.</p>
                          </div>

                          <div className={`p-8 rounded-[2.5rem] border space-y-8 ${isMidnight ? 'bg-slate-800/30 border-white/5' : 'bg-card border-border shadow-xl'}`}>
                            {isAutoScanning ? (
                              <div className="text-center py-6">
                                <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                  <span>Tiến độ</span>
                                  <span>{Math.round((scanProgress.current / scanProgress.total) * 100)}%</span>
                                </div>
                                <div className="h-4 bg-muted/30 rounded-full overflow-hidden mb-6 relative">
                                  <motion.div
                                    className="absolute top-0 left-0 bottom-0 bg-chart-1 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                                <p className="font-bold text-chart-1 animate-pulse">{scanProgress.status}</p>
                                <p className="text-xs text-muted-foreground mt-2">{scanProgress.current} / {scanProgress.total} sách</p>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <label className="block text-xs font-black uppercase tracking-wide text-muted-foreground mb-3">Chọn danh mục</label>
                                  <div className="grid grid-cols-2 gap-4">
                                    {['Kinh tế', 'Văn học', 'Thiếu nhi', 'Tâm lý', 'Lịch sử', 'Kỹ năng'].map(cat => (
                                      <button
                                        key={cat}
                                        onClick={() => setAutoScanCategory(cat)}
                                        className={`h-14 rounded-2xl font-bold transition-all border ${autoScanCategory === cat
                                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                          : 'hover:bg-muted bg-background'}`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-black uppercase tracking-wide text-muted-foreground mb-3">Số lượng cần nhập</label>
                                  <div className="flex items-center gap-4">
                                    {[10, 20, 50, 100].map(num => (
                                      <button
                                        key={num}
                                        onClick={() => setAutoScanLimit(num)}
                                        className={`flex-1 h-12 rounded-xl font-bold border transition-all ${autoScanLimit === num
                                          ? 'bg-chart-1 text-white border-chart-1 ring-2 ring-chart-1/20'
                                          : 'hover:bg-muted bg-background'}`}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  onClick={handleStartAutoScan}
                                  className="w-full h-16 bg-chart-1 text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-chart-1/90 transition-all shadow-xl shadow-chart-1/30 active:scale-95"
                                >
                                  Bắt đầu quét
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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


