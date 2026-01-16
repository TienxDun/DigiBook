
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, Order, SystemLog } from '../services/db';
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
      title: '', authorId: authors[0]?.id || '', category: categories[0]?.name || '',
      price: 0, stock_quantity: 10, description: '', isbn: '', cover: '',
      publishYear: new Date().getFullYear(), pages: 0, language: 'Tiếng Việt'
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
                    <button className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                      <i className="fa-solid fa-edit mr-1"></i>Sửa
                    </button>
                    <button className="flex-1 bg-rose-100 text-rose-600 py-2 rounded-xl text-xs font-bold hover:bg-rose-200 transition-all">
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
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Danh sách tác giả</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {authors.map(author => (
                  <div key={author.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
                    <h4 className="font-bold text-slate-900">{author.name}</h4>
                    <p className="text-sm text-slate-500">{author.bio || 'Chưa có tiểu sử'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Danh sách danh mục</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
                    <h4 className="font-bold text-slate-900">{category.name}</h4>
                    <p className="text-sm text-slate-500">{category.description || 'Chưa có mô tả'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã đơn</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách hàng</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng tiền</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày đặt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-all">
                      <td className="px-8 py-5 text-sm font-bold text-slate-900">#{order.id.slice(-8)}</td>
                      <td className="px-8 py-5 text-sm text-slate-600">{order.customer?.name || 'N/A'}</td>
                      <td className="px-8 py-5 text-sm font-bold text-indigo-600">{formatPrice(order.payment.total)}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600">
                          {order.statusStep === 1 ? 'Đã đặt' : order.statusStep === 2 ? 'Đang xử lý' : 'Hoàn thành'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-500">
                        {order.createdAt?.toDate().toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
