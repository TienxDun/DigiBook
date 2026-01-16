
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, Order, OrderItem, SystemLog } from '../services/db';
import { Book, CategoryInfo, Author } from '../types';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'orders' | 'categories' | 'authors' | 'logs'>('overview');
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  
  const [logStatusFilter, setLogStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');
  const [logActionFilter, setLogActionFilter] = useState<string>('ALL');
  const [currentLogPage, setCurrentLogPage] = useState(1);
  const logsPerPage = 20;
  const [isLoadingMoreLogs, setIsLoadingMoreLogs] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookFormData, setBookFormData] = useState<Partial<Book>>({});

  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [authorFormData, setAuthorFormData] = useState<Partial<Author>>({});

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<CategoryInfo & {id?: string}>>({});

  const availableIcons = [
    'fa-book', 'fa-lightbulb', 'fa-graduation-cap', 'fa-heart', 'fa-palette', 
    'fa-utensils', 'fa-laptop-code', 'fa-globe', 'fa-star', 'fa-rocket',
    'fa-music', 'fa-camera', 'fa-gamepad', 'fa-baseball', 'fa-tree',
    'fa-shopping-cart', 'fa-briefcase', 'fa-plane', 'fa-home', 'fa-users'
  ];

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  const orderStatusOptions = [
    { step: 0, label: 'Đang xử lý', color: 'amber' },
    { step: 1, label: 'Đã xác nhận', color: 'blue' },
    { step: 2, label: 'Đang giao', color: 'indigo' },
    { step: 3, label: 'Đã giao', color: 'emerald' }
  ];

  const refreshData = async () => {
    try {
      const [booksData, catsData, authorsData] = await Promise.all([
        db.getBooks(),
        db.getCategories(),
        db.getAuthors()
      ]);
      setBooks(booksData);
      setCategories(catsData);
      setAuthors(authorsData);
      
      const allOrders = await db.getOrdersByUserId('admin');
      setOrders(allOrders);

      if (activeTab === 'logs') {
        const logsData = await db.getSystemLogs(0, 50);
        setLogs(logsData);
        setHasMoreLogs(logsData.length === 50);
      }
    } catch (err) {
      console.error("Data refresh failed:", err);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.payment.total, 0);
    const lowStock = books.filter(b => b.stock_quantity > 0 && b.stock_quantity < 10).length;
    const outOfStock = books.filter(b => b.stock_quantity <= 0).length;
    const pendingOrders = orders.filter(o => o.statusStep < 3).length;
    return { totalRevenue, lowStock, outOfStock, pendingOrders, totalOrders: orders.length };
  }, [orders, books]);

  const handleSeedData = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn đẩy dữ liệu mẫu lên Firestore?")) return;
    setIsSeeding(true);
    setSeedStatus({ msg: "Đang đẩy dữ liệu lên Cloud Firestore...", type: 'info' });
    try {
      const result = await db.seedDatabase();
      if (result.success) {
        setSeedStatus({ msg: `Thành công! Đã nhập ${result.count} cuốn sách.`, type: 'success' });
        setTimeout(() => { refreshData(); setIsSeeding(false); }, 1500);
      } else {
        setIsSeeding(false);
        setSeedStatus({ msg: `Lỗi: ${result.error}`, type: 'error' });
      }
    } catch (err: any) {
      setIsSeeding(false);
      setSeedStatus({ msg: `Lỗi hệ thống: ${err.message}`, type: 'error' });
    }
    setTimeout(() => setSeedStatus(null), 8000);
  };

  const filteredBooks = useMemo(() => {
    let result = books.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filterStock === 'low') result = result.filter(b => b.stock_quantity > 0 && b.stock_quantity < 10);
    else if (filterStock === 'out') result = result.filter(b => b.stock_quantity <= 0);
    return result;
  }, [books, searchQuery, filterStock]);

  // Lấy danh sách các loại hành động duy nhất từ logs để làm bộ lọc
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(l => l.action.split('_')[0])); // Lấy phần đầu của action (ví dụ ORDER từ ORDER_CREATED)
    return Array.from(actions).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.action.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                          l.detail.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                          l.user.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesStatus = logStatusFilter === 'ALL' || l.status === logStatusFilter;
      const matchesAction = logActionFilter === 'ALL' || l.action.startsWith(logActionFilter);

      return matchesSearch && matchesStatus && matchesAction;
    });
  }, [logs, debouncedSearchQuery, logStatusFilter, logActionFilter]);

  // Pagination logic
  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentLogPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, currentLogPage, logsPerPage]);

  const loadMoreLogs = useCallback(async () => {
    if (isLoadingMoreLogs || !hasMoreLogs) return;
    
    setIsLoadingMoreLogs(true);
    try {
      // Load thêm 50 logs cũ hơn
      const additionalLogs = await db.getSystemLogs(logs.length, 50);
      if (additionalLogs.length === 0) {
        setHasMoreLogs(false);
      } else {
        setLogs(prev => [...prev, ...additionalLogs]);
      }
    } catch (error) {
      console.error('Error loading more logs:', error);
    } finally {
      setIsLoadingMoreLogs(false);
    }
  }, [logs.length, isLoadingMoreLogs, hasMoreLogs]);

  const handleOpenAddBook = () => {
    setEditingBook(null);
    setBookFormData({
      title: '',
      authorId: authors[0]?.id || '',
      category: categories[0]?.name || '',
      price: 0,
      original_price: undefined,
      stock_quantity: 10,
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

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAuthor = authors.find(a => a.id === bookFormData.authorId);
    const finalBook = {
      ...bookFormData,
      id: editingBook ? editingBook.id : Date.now().toString(),
      author: selectedAuthor?.name || 'Vô danh',
      rating: editingBook?.rating || 5.0
    } as Book;
    await db.saveBook(finalBook);
    setIsBookModalOpen(false);
    refreshData();
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      authorId: book.authorId || authors.find(a => a.name === book.author)?.id || '',
      category: book.category,
      price: book.price,
      original_price: book.original_price,
      stock_quantity: book.stock_quantity,
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
      refreshData();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Có lỗi xảy ra khi xóa sách');
    }
  };

  const handleOpenAddAuthor = () => {
    setEditingAuthor(null);
    setAuthorFormData({
      name: '',
      bio: '',
      avatar: ''
    });
    setIsAuthorModalOpen(true);
  };

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAuthor = {
      ...authorFormData,
      id: editingAuthor ? editingAuthor.id : Date.now().toString()
    } as Author;
    await db.saveAuthor(finalAuthor);
    setIsAuthorModalOpen(false);
    refreshData();
  };

  const handleEditAuthor = (author: Author) => {
    setEditingAuthor(author);
    setAuthorFormData({
      name: author.name,
      bio: author.bio,
      avatar: author.avatar
    });
    setIsAuthorModalOpen(true);
  };

  const handleDeleteAuthor = async (author: Author) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tác giả "${author.name}"?`)) return;
    try {
      await db.deleteAuthor(author.id);
      refreshData();
    } catch (error) {
      console.error('Error deleting author:', error);
      alert('Có lỗi xảy ra khi xóa tác giả');
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      icon: 'fa-book',
      description: ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Check for duplicate name when creating new
    if (!editingCategory) {
      const exists = categories.find(c => c.name.toLowerCase() === categoryFormData.name?.toLowerCase());
      if (exists) {
        alert('Danh mục với tên này đã tồn tại!');
        return;
      }
    }
    
    const finalCategory = {
      name: categoryFormData.name || '',
      icon: categoryFormData.icon || 'fa-book',
      description: categoryFormData.description || ''
    } as CategoryInfo;
    
    await db.saveCategory(finalCategory);
    setIsCategoryModalOpen(false);
    refreshData();
  };

  const handleEditCategory = (category: CategoryInfo & {id?: string}) => {
    setEditingCategory(category);
    setCategoryFormData({
      id: (category as any).id || category.name,
      name: category.name,
      icon: category.icon,
      description: category.description
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (category: CategoryInfo) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) return;
    try {
      await db.deleteCategory(category.name);
      refreshData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Có lỗi xảy ra khi xóa danh mục');
    }
  };

  const handleViewOrderDetails = async (order: Order) => {
    try {
      const orderWithItems = await db.getOrderWithItems(order.id);
      if (orderWithItems) {
        setSelectedOrder(orderWithItems);
        setIsOrderModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Có lỗi xảy ra khi tải chi tiết đơn hàng');
    }
  };

  const handleUpdateOrderStatus = async (newStatusStep: number) => {
    if (!selectedOrder) return;
    
    const newStatusLabel = orderStatusOptions.find(opt => opt.step === newStatusStep)?.label || 'Đang xử lý';
    
    if (!window.confirm(`Cập nhật trạng thái đơn hàng thành "${newStatusLabel}"?`)) return;
    
    setUpdatingOrderStatus(true);
    try {
      await db.updateOrderStatus(selectedOrder.id, newStatusLabel, newStatusStep);
      setSelectedOrder({ ...selectedOrder, status: newStatusLabel, statusStep: newStatusStep });
      refreshData();
      alert('Cập nhật trạng thái thành công!');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex relative z-[200]">
      <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen z-50 shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <h1 className="text-xl font-black tracking-tighter text-white">Digi<span className="text-indigo-400">Admin</span></h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Hệ thống quản trị</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: 'overview', icon: 'fa-chart-pie', label: 'Tổng quan' },
            { id: 'books', icon: 'fa-box', label: 'Kho sách' },
            { id: 'authors', icon: 'fa-feather-pointed', label: 'Tác giả' },
            { id: 'categories', icon: 'fa-tags', label: 'Danh mục' },
            { id: 'orders', icon: 'fa-receipt', label: 'Đơn hàng' },
            { id: 'logs', icon: 'fa-terminal', label: 'Nhật ký' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`fa-solid ${tab.icon} w-5 text-center`}></i>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <Link to="/" className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-indigo-400 hover:bg-white/5 transition-all group">
            <i className="fa-solid fa-arrow-left-long group-hover:-translate-x-1 transition-transform"></i>
            <span>Xem cửa hàng</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50">
        <header className="flex justify-between items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-slate-900">
              {activeTab === 'overview' ? 'Báo cáo tổng quan' : 
               activeTab === 'books' ? 'Quản lý kho hàng' : 
               activeTab === 'logs' ? 'Nhật ký hệ thống' : 'Quản lý Đơn hàng'}
            </h2>
          </div>
          <div className="relative group">
            <input 
              type="text" placeholder="Tìm kiếm nhanh..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 px-4 py-3 pl-10 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-indigo-50 font-bold shadow-sm transition-all"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>
        </header>

        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Log Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái:</span>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  {(['ALL', 'SUCCESS', 'ERROR'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setLogStatusFilter(status)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        logStatusFilter === status 
                        ? (status === 'ERROR' ? 'bg-rose-500 text-white' : status === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white')
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {status === 'ALL' ? 'Tất cả' : status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân loại:</span>
                <select 
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-none focus:ring-2 ring-indigo-100"
                >
                  <option value="ALL">Tất cả hành động</option>
                  {uniqueActions.map(act => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={refreshData}
                className="ml-auto w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                title="Làm mới nhật ký"
              >
                <i className="fa-solid fa-rotate"></i>
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Thời gian</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Hành động</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết bản ghi</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Tác nhân</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedLogs.length > 0 ? paginatedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-8 py-5 text-[11px] text-slate-500 font-bold">
                        {log.createdAt?.toDate().toLocaleString('vi-VN', { 
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter bg-slate-100 px-2 py-1 rounded-md">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[11px] text-slate-600 font-medium max-w-md truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-slate-50 transition-all">
                        {log.detail}
                      </td>
                      <td className="px-8 py-5 text-[11px] text-slate-400 font-bold italic">
                        {log.user.split('@')[0]}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="opacity-20 mb-4">
                          <i className="fa-solid fa-terminal text-5xl"></i>
                        </div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Không tìm thấy bản ghi nào khớp với bộ lọc</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalLogPages > 1 && (
                <div className="flex items-center justify-between px-8 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="text-sm text-slate-500">
                    Hiển thị {((currentLogPage - 1) * logsPerPage) + 1} - {Math.min(currentLogPage * logsPerPage, filteredLogs.length)} của {filteredLogs.length} bản ghi
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentLogPage(prev => Math.max(1, prev - 1))}
                      disabled={currentLogPage === 1}
                      className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fa-solid fa-chevron-left mr-1"></i>Trước
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalLogPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalLogPages - 4, currentLogPage - 2)) + i;
                        if (pageNum > totalLogPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentLogPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded-md ${
                              currentLogPage === pageNum 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-white border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }).filter(Boolean)}
                    </div>

                    <button
                      onClick={() => setCurrentLogPage(prev => Math.min(totalLogPages, prev + 1))}
                      disabled={currentLogPage === totalLogPages}
                      className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau<i className="fa-solid fa-chevron-right ml-1"></i>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Load More Button */}
              {hasMoreLogs && (
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={loadMoreLogs}
                    disabled={isLoadingMoreLogs}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoadingMoreLogs ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-plus mr-2"></i>
                        Tải thêm logs cũ hơn
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ... (Overview, Books và các tab khác được giữ nguyên cấu trúc) ... */}
        {activeTab === 'overview' && (
           <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Doanh thu', value: formatPrice(stats.totalRevenue), color: 'bg-emerald-500', icon: 'fa-dollar-sign' },
                { label: 'Đơn hàng', value: stats.totalOrders, color: 'bg-indigo-500', icon: 'fa-shopping-cart' },
                { label: 'Sách trong kho', value: books.length, color: 'bg-amber-500', icon: 'fa-book' },
                { label: 'Hết hàng', value: stats.outOfStock, color: 'bg-rose-500', icon: 'fa-box-open' }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-current/20`}>
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-2xl font-black text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cấu trúc các tab khác như books, orders vẫn được duy trì */}
        {activeTab === 'books' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lọc kho:</span>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'low', label: 'Sắp hết' },
                    { id: 'out', label: 'Hết hàng' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterStock(filter.id as any)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        filterStock === filter.id 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleOpenAddBook}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
              >
                <i className="fa-solid fa-plus mr-2"></i>Thêm sách mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map(book => (
                <div key={book.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex gap-4">
                    <img src={book.cover || '/placeholder-book.jpg'} alt={book.title} className="w-16 h-20 object-cover rounded-xl" />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-slate-500 mb-2">{book.author}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-indigo-600">{formatPrice(book.price)}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                          book.stock_quantity > 10 ? 'bg-emerald-50 text-emerald-600' :
                          book.stock_quantity > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {book.stock_quantity > 0 ? `${book.stock_quantity} quyển` : 'Hết hàng'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleEditBook(book)}
                      className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      <i className="fa-solid fa-edit mr-1"></i>Sửa
                    </button>
                    <button 
                      onClick={() => handleDeleteBook(book)}
                      className="flex-1 bg-rose-100 text-rose-600 py-2 rounded-xl text-xs font-bold hover:bg-rose-200 transition-all"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'authors' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-lg font-black text-slate-900">Quản lý tác giả</h3>
                <p className="text-xs text-slate-500 mt-1">Tổng cộng {authors.length} tác giả</p>
              </div>
              <button 
                onClick={handleOpenAddAuthor}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
              >
                <i className="fa-solid fa-plus mr-2"></i>Thêm tác giả mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {authors.map(author => (
                <div key={author.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex gap-4">
                    <img 
                      src={author.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author.name) + '&background=6366f1&color=fff'} 
                      alt={author.name} 
                      className="w-16 h-16 object-cover rounded-full"
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author.name) + '&background=6366f1&color=fff'; }}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{author.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{author.bio || 'Chưa có tiểu sử'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleEditAuthor(author)}
                      className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      <i className="fa-solid fa-edit mr-1"></i>Sửa
                    </button>
                    <button 
                      onClick={() => handleDeleteAuthor(author)}
                      className="flex-1 bg-rose-100 text-rose-600 py-2 rounded-xl text-xs font-bold hover:bg-rose-200 transition-all"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-lg font-black text-slate-900">Quản lý danh mục</h3>
                <p className="text-xs text-slate-500 mt-1">Tổng cộng {categories.length} danh mục</p>
              </div>
              <button 
                onClick={handleOpenAddCategory}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
              >
                <i className="fa-solid fa-plus mr-2"></i>Thêm danh mục mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map(category => (
                <div key={(category as any).id || category.name} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mb-4">
                      <i className={`fa-solid ${category.icon}`}></i>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-2">{category.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{category.description || 'Chưa có mô tả'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditCategory(category)}
                      className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      <i className="fa-solid fa-edit mr-1"></i>Sửa
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category)}
                      className="flex-1 bg-rose-100 text-rose-600 py-2 rounded-xl text-xs font-bold hover:bg-rose-200 transition-all"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã đơn</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tiền</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày đặt</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.length > 0 ? orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-5 text-sm font-bold text-slate-900">#{order.id.slice(-8)}</td>
                      <td className="px-8 py-5 text-sm text-slate-600">{order.customer?.name || 'N/A'}</td>
                      <td className="px-8 py-5 text-sm font-bold text-indigo-600">{formatPrice(order.payment.total)}</td>
                      <td className="px-8 py-5">
                        <select
                          value={order.statusStep}
                          onChange={(e) => {
                            const newStep = Number(e.target.value);
                            const newStatusLabel = orderStatusOptions.find(opt => opt.step === newStep)?.label || 'Đang xử lý';
                            if (window.confirm(`Cập nhật trạng thái đơn hàng thành "${newStatusLabel}"?`)) {
                              db.updateOrderStatus(order.id, newStatusLabel, newStep).then(() => {
                                refreshData();
                              }).catch(err => {
                                console.error('Error updating status:', err);
                                alert('Có lỗi xảy ra khi cập nhật trạng thái');
                              });
                            } else {
                              e.target.value = String(order.statusStep);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer transition-all ${
                            order.statusStep === 3 ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' :
                            order.statusStep === 2 ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' :
                            order.statusStep === 1 ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' :
                            'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          }`}
                        >
                          {orderStatusOptions.map(status => (
                            <option key={status.step} value={status.step}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-500">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('vi-VN') : order.date}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                        >
                          <i className="fa-solid fa-eye mr-1"></i>Chi tiết
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="opacity-20 mb-4">
                          <i className="fa-solid fa-receipt text-5xl"></i>
                        </div>
                        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Chưa có đơn hàng nào</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <div className="p-8 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Chi tiết đơn hàng</h2>
                  <p className="text-sm text-slate-500 mt-1">Mã: #{selectedOrder.id.slice(-8)}</p>
                </div>
                <button
                  onClick={() => setIsOrderModalOpen(false)}
                  className="w-10 h-10 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Progress Indicator */}
              <div className="bg-slate-50 p-6 rounded-2xl">
                <h3 className="text-sm font-black text-slate-700 mb-4">Trạng thái đơn hàng</h3>
                <div className="flex items-center justify-between mb-4">
                  {orderStatusOptions.map((status, index) => (
                    <React.Fragment key={status.step}>
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          selectedOrder.statusStep >= status.step
                            ? `bg-${status.color}-500 text-white`
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {selectedOrder.statusStep > status.step ? <i className="fa-solid fa-check"></i> : status.step + 1}
                        </div>
                        <p className={`text-xs font-bold mt-2 ${
                          selectedOrder.statusStep >= status.step ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {status.label}
                        </p>
                      </div>
                      {index < orderStatusOptions.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 rounded ${
                          selectedOrder.statusStep > status.step ? `bg-${status.color}-500` : 'bg-slate-200'
                        }`}></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                
                {/* Status Update Buttons */}
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500 mr-2">Cập nhật:</span>
                  {orderStatusOptions.map(status => (
                    <button
                      key={status.step}
                      onClick={() => handleUpdateOrderStatus(status.step)}
                      disabled={updatingOrderStatus || selectedOrder.statusStep === status.step}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedOrder.statusStep === status.step
                          ? `bg-${status.color}-500 text-white cursor-default`
                          : `bg-slate-100 text-slate-600 hover:bg-${status.color}-50 hover:text-${status.color}-600 disabled:opacity-50`
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6">
                <h3 className="text-sm font-black text-slate-700 mb-4">Thông tin khách hàng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Họ tên</p>
                    <p className="text-sm font-bold text-slate-900">{selectedOrder.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Số điện thoại</p>
                    <p className="text-sm font-bold text-slate-900">{selectedOrder.customer?.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="text-sm font-bold text-slate-900">{selectedOrder.customer?.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Địa chỉ giao hàng</p>
                    <p className="text-sm font-bold text-slate-900">{selectedOrder.customer?.address}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6">
                <h3 className="text-sm font-black text-slate-700 mb-4">Sản phẩm ({selectedOrder.items?.length || 0})</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center p-3 bg-slate-50 rounded-xl">
                      <img src={item.cover} alt={item.title} className="w-12 h-16 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">{formatPrice(item.priceAtPurchase)}</p>
                        <p className="text-xs text-slate-500">× {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6">
                <h3 className="text-sm font-black text-slate-700 mb-4">Thanh toán</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Phương thức:</span>
                    <span className="font-bold text-slate-900">{selectedOrder.payment?.method || 'COD'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tạm tính:</span>
                    <span className="font-bold text-slate-900">{formatPrice(selectedOrder.payment?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Phí vận chuyển:</span>
                    <span className="font-bold text-slate-900">{formatPrice(selectedOrder.payment?.shipping || 0)}</span>
                  </div>
                  {selectedOrder.payment?.couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Giảm giá:</span>
                      <span className="font-bold text-emerald-600">-{formatPrice(selectedOrder.payment.couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg pt-3 border-t border-slate-200">
                    <span className="font-black text-slate-900">Tổng cộng:</span>
                    <span className="font-black text-indigo-600">{formatPrice(selectedOrder.payment?.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tên danh mục *
                  {editingCategory && <span className="text-xs text-amber-600 ml-2">(không thể sửa sau khi tạo)</span>}
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory}
                  value={categoryFormData.name || ''}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    editingCategory ? 'bg-slate-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Nhập tên danh mục"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Icon *</label>
                <div className="grid grid-cols-5 gap-3">
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryFormData({...categoryFormData, icon})}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-110 ${
                        categoryFormData.icon === icon
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 text-slate-400 hover:border-indigo-300'
                      }`}
                    >
                      <i className={`fa-solid ${icon} text-2xl`}></i>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả</label>
                <textarea
                  value={categoryFormData.description || ''}
                  onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Mô tả về danh mục..."
                />
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  {editingCategory ? 'Cập nhật' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Author Modal */}
      {isAuthorModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">
                {editingAuthor ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
              </h2>
            </div>
            
            <form onSubmit={handleSaveAuthor} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tên tác giả *</label>
                <input
                  type="text"
                  required
                  value={authorFormData.name || ''}
                  onChange={(e) => setAuthorFormData({...authorFormData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập tên tác giả"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tiểu sử</label>
                <textarea
                  value={authorFormData.bio || ''}
                  onChange={(e) => setAuthorFormData({...authorFormData, bio: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Thông tin về tác giả..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={authorFormData.avatar || ''}
                  onChange={(e) => setAuthorFormData({...authorFormData, avatar: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/avatar.jpg (để trống sẽ dùng avatar mặc định)"
                />
                {authorFormData.avatar && (
                  <div className="mt-3">
                    <img 
                      src={authorFormData.avatar} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-full border-2 border-slate-200"
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Preview&background=6366f1&color=fff'; }}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAuthorModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  {editingAuthor ? 'Cập nhật' : 'Thêm tác giả'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">
                {editingBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
              </h2>
            </div>
            
            <form onSubmit={handleSaveBook} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề *</label>
                  <input
                    type="text"
                    required
                    value={bookFormData.title || ''}
                    onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nhập tiêu đề sách"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tác giả *</label>
                  <select
                    required
                    value={bookFormData.authorId || ''}
                    onChange={(e) => setBookFormData({...bookFormData, authorId: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Chọn tác giả</option>
                    {authors.map(author => (
                      <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Danh mục *</label>
                  <select
                    required
                    value={bookFormData.category || ''}
                    onChange={(e) => setBookFormData({...bookFormData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Giá (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={bookFormData.price || ''}
                    onChange={(e) => setBookFormData({...bookFormData, price: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Giá gốc (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookFormData.original_price || ''}
                    onChange={(e) => setBookFormData({...bookFormData, original_price: Number(e.target.value) || undefined})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Để trống nếu không có"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={bookFormData.stock_quantity || ''}
                    onChange={(e) => setBookFormData({...bookFormData, stock_quantity: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ISBN</label>
                  <input
                    type="text"
                    value={bookFormData.isbn || ''}
                    onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ISBN-13 hoặc ISBN-10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số trang</label>
                  <input
                    type="number"
                    min="1"
                    value={bookFormData.pages || ''}
                    onChange={(e) => setBookFormData({...bookFormData, pages: Number(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nhà xuất bản</label>
                  <input
                    type="text"
                    value={bookFormData.publisher || ''}
                    onChange={(e) => setBookFormData({...bookFormData, publisher: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nhà xuất bản"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Năm xuất bản</label>
                  <input
                    type="number"
                    min="1000"
                    max={new Date().getFullYear()}
                    value={bookFormData.publishYear || ''}
                    onChange={(e) => setBookFormData({...bookFormData, publishYear: Number(e.target.value) || new Date().getFullYear()})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={new Date().getFullYear().toString()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ngôn ngữ</label>
                  <select
                    value={bookFormData.language || 'Tiếng Việt'}
                    onChange={(e) => setBookFormData({...bookFormData, language: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">Badge</label>
                  <select
                    value={bookFormData.badge || ''}
                    onChange={(e) => setBookFormData({...bookFormData, badge: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Không có</option>
                    <option value="Bán chạy">Bán chạy</option>
                    <option value="Kinh điển">Kinh điển</option>
                    <option value="Mới">Mới</option>
                    <option value="Giảm giá">Giảm giá</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">URL ảnh bìa</label>
                <input
                  type="url"
                  value={bookFormData.cover || ''}
                  onChange={(e) => setBookFormData({...bookFormData, cover: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/book-cover.jpg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả</label>
                <textarea
                  value={bookFormData.description || ''}
                  onChange={(e) => setBookFormData({...bookFormData, description: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Mô tả về cuốn sách..."
                />
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  {editingBook ? 'Cập nhật' : 'Thêm sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
