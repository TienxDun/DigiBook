
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, Order, OrderItem, SystemLog, AVAILABLE_AI_MODELS } from '../services/db';
import { Book, CategoryInfo, Author, Coupon, AIModelConfig } from '../types';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'orders' | 'categories' | 'authors' | 'coupons' | 'logs' | 'ai'>('overview');
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [aiConfig, setAiConfig] = useState<{ activeModelId: string }>({ activeModelId: 'gemini-3-flash' });
  const [isUpdatingAI, setIsUpdatingAI] = useState(false);
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
  const [isSyncing, setIsSyncing] = useState(false);
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

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [couponFormData, setCouponFormData] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    expiryDate: '',
    isActive: true,
    usedCount: 0,
    usageLimit: 100
  });

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

  // Bulk Selection States
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedBooks([]);
    setSelectedAuthors([]);
    setSelectedCategories([]);
  }, [activeTab]);

  const refreshData = async () => {
    try {
      const [booksData, catsData, authorsData, couponsData, aiConfigData] = await Promise.all([
        db.getBooks(),
        db.getCategories(),
        db.getAuthors(),
        db.getCoupons(),
        db.getAIConfig()
      ]);
      setBooks(booksData);
      setCategories(catsData);
      setAuthors(authorsData);
      setCoupons(couponsData);
      setAiConfig(aiConfigData);
      
      const allOrders = await db.getOrdersByUserId('admin');
      setOrders(allOrders);

      if (activeTab === 'logs' || activeTab === 'ai') {
        const logsData = await db.getSystemLogs(0, 50);
        setLogs(logsData);
        setHasMoreLogs(logsData.length === 50);
      }
    } catch (err) {
      console.error("Data refresh failed:", err);
    }
  };

  // Auto load data khi component mount
  useEffect(() => {
    refreshData();
  }, []);

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
    const completedOrders = orders.filter(o => o.statusStep === 3).length;
    const totalBooks = books.reduce((sum, b) => sum + b.stock_quantity, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const todayOrders = orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.date);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length;
    return { 
      totalRevenue, 
      lowStock, 
      outOfStock, 
      pendingOrders, 
      completedOrders,
      totalOrders: orders.length,
      totalBooks,
      avgOrderValue,
      todayOrders,
      totalCategories: categories.length,
      totalAuthors: authors.length,
      totalCoupons: coupons.length
    };
  }, [orders, books, categories, authors, coupons]);

  const handleSeedData = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn đẩy dữ liệu mẫu lên Firestore?")) return;
    setIsSeeding(true);
    setSeedStatus({ msg: "Đang đẩy dữ liệu lên Cloud Firestore...", type: 'info' });
    try {
      const result = await db.seedDatabase();
      if (result.success) {
        setSeedStatus({ msg: `Thành công! Đã cập nhật ${result.count} danh mục hệ thống.`, type: 'success' });
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

  const handleAutoSync = async () => {
    setIsSyncing(true);
    setSeedStatus({ msg: "Đang quét dữ liệu từ Google Books & Open Library...", type: 'info' });
    try {
      const queries = [
        'sách kinh tế bán chạy', 
        'văn học kinh điển', 
        'tâm lý học hành vi', 
        'lịch sử thế giới',
        'triết học phương đông',
        'sách thiếu nhi hay',
        'phát triển bản thân',
        'startup khởi nghiệp'
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

  const handleBulkDeleteBooks = async () => {
    if (selectedBooks.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedBooks.length} cuốn sách đã chọn?`)) return;
    
    setIsDeletingBulk(true);
    try {
      await db.deleteBooksBulk(selectedBooks);
      setSelectedBooks([]);
      refreshData();
    } catch (err) {
      alert("Lỗi khi xóa hàng loạt sách");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleBulkDeleteAuthors = async () => {
    if (selectedAuthors.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedAuthors.length} tác giả đã chọn?`)) return;
    
    setIsDeletingBulk(true);
    try {
      await db.deleteAuthorsBulk(selectedAuthors);
      setSelectedAuthors([]);
      refreshData();
    } catch (err) {
      alert("Lỗi khi xóa hàng loạt tác giả");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCategories.length} danh mục đã chọn?`)) return;
    
    setIsDeletingBulk(true);
    try {
      await db.deleteCategoriesBulk(selectedCategories);
      setSelectedCategories([]);
      refreshData();
    } catch (err) {
      alert("Lỗi khi xóa hàng loạt danh mục");
    } finally {
      setIsDeletingBulk(false);
    }
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

  const toggleSelectAuthor = (id: string) => {
    setSelectedAuthors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAllAuthors = () => {
    if (selectedAuthors.length === authors.length && authors.length > 0) {
      setSelectedAuthors([]);
    } else {
      setSelectedAuthors(authors.map(a => a.id));
    }
  };

  const toggleSelectCategory = (name: string) => {
    setSelectedCategories(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };

  const toggleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length && categories.length > 0) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.name));
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponFormData.code || !couponFormData.discountValue || !couponFormData.expiryDate) {
      alert('Vui lòng nhập đầy đủ thông tin: Mã code, giá trị giảm, và ngày hết hạn');
      return;
    }
    try {
      const couponData: Coupon = {
        code: couponFormData.code!.toUpperCase(),
        discountType: couponFormData.discountType || 'percentage',
        discountValue: couponFormData.discountValue!,
        minOrderValue: couponFormData.minOrderValue || 0,
        expiryDate: couponFormData.expiryDate!,
        isActive: couponFormData.isActive ?? true,
        usedCount: couponFormData.usedCount || 0,
        usageLimit: couponFormData.usageLimit || 100
      };
      await db.saveCoupon(couponData);
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      setCouponFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderValue: 0,
        expiryDate: '',
        isActive: true,
        usedCount: 0,
        usageLimit: 100
      });
      await refreshData();
      alert(editingCoupon ? 'Cập nhật mã khuyến mãi thành công!' : 'Tạo mã khuyến mãi thành công!');
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Lỗi khi lưu mã khuyến mãi. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã khuyến mãi "${code}"?`)) return;
    try {
      await db.deleteCoupon(code);
      await refreshData();
      alert('Xóa mã khuyến mãi thành công!');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Lỗi khi xóa mã khuyến mãi. Vui lòng thử lại.');
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

  const handleUpdateAIModel = async (modelId: string) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển sang sử dụng model "${modelId}"?`)) return;
    setIsUpdatingAI(true);
    try {
      await db.updateAIConfig(modelId);
      setAiConfig({ activeModelId: modelId });
      alert(`Đã chuyển đổi sang model ${modelId} thành công!`);
    } catch (error) {
      console.error('Error updating AI model:', error);
      alert('Lỗi khi cập nhật cấu hình AI.');
    } finally {
      setIsUpdatingAI(false);
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
            { id: 'books', icon: 'fa-book-bookmark', label: 'Kho sách' },
            { id: 'authors', icon: 'fa-pen-nib', label: 'Tác giả' },
            { id: 'categories', icon: 'fa-folder-tree', label: 'Danh mục' },
            { id: 'orders', icon: 'fa-bag-shopping', label: 'Đơn hàng' },
            { id: 'coupons', icon: 'fa-ticket', label: 'Khuyến mãi' },
            { id: 'ai', icon: 'fa-robot', label: 'Cơ chế AI' },
            { id: 'logs', icon: 'fa-receipt', label: 'Nhật ký' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-black tracking-wide transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-white/10' : 'bg-transparent'}`}>
                <i className={`fa-solid ${tab.icon} text-sm`}></i>
              </div>
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

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto bg-slate-50 relative">
        {/* Toast Notification for Seeding/Syncing */}
        {seedStatus && (
          <div className="fixed top-8 right-8 z-[1000] animate-slideIn">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 transition-all duration-500 bg-white ${
              seedStatus.type === 'success' ? 'border-emerald-100' : 
              seedStatus.type === 'error' ? 'border-rose-100' : 'border-blue-100'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                seedStatus.type === 'success' ? 'bg-emerald-500 text-white' : 
                seedStatus.type === 'error' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                <i className={`fa-solid ${
                  seedStatus.type === 'success' ? 'fa-check' : 
                  seedStatus.type === 'error' ? 'fa-exclamation' : 'fa-spinner fa-spin'
                }`}></i>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-0.5">Thông báo hệ thống</p>
                <p className="text-sm font-bold text-slate-900">{seedStatus.msg}</p>
              </div>
            </div>
          </div>
        )}

        <header className="flex justify-between items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-slate-900">
              {activeTab === 'overview' ? 'Báo cáo tổng quan' : 
               activeTab === 'books' ? 'Quản lý kho hàng' : 
               activeTab === 'logs' ? 'Nhật ký hệ thống' : 
               activeTab === 'ai' ? 'Cấu hình Trí tuệ Nhân tạo' :
               activeTab === 'coupons' ? 'Quản lý Khuyến mãi' : 'Quản lý Đơn hàng'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'coupons' && (
              <button 
                onClick={() => {
                  setEditingCoupon(null);
                  setCouponFormData({
                    code: '',
                    discountType: 'percentage',
                    discountValue: 0,
                    minOrderValue: 0,
                    expiryDate: '',
                    isActive: true,
                    usedCount: 0,
                    usageLimit: 100
                  });
                  setIsCouponModalOpen(true);
                }}
                className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-100"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Tạo mã mới</span>
              </button>
            )}
            <div className="relative group">
              <input 
                type="text" placeholder="Tìm kiếm nhanh..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 px-4 py-3 pl-10 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-indigo-50 font-bold shadow-sm transition-all"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            </div>
          </div>
        </header>

        {activeTab === 'coupons' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã khuyến mãi</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Giảm giá</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Đơn tối thiểu</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ngày hết hạn</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Lượt dùng</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {coupons.length > 0 ? coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <i className="fa-solid fa-ticket"></i>
                          </div>
                          <span className="text-sm font-black text-slate-900 tracking-wider">
                            {coupon.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-black uppercase tracking-widest">
                          {coupon.discountType === 'percentage' 
                            ? `Giảm ${coupon.discountValue}%` 
                            : `Giảm ${coupon.discountValue.toLocaleString()}đ`}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center text-[13px] font-bold text-slate-600">
                        {coupon.minOrderValue.toLocaleString()}đ
                      </td>
                      <td className="px-8 py-6 text-center text-[11px] font-bold text-slate-500">
                        {new Date(coupon.expiryDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {coupon.usageCount || 0}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          coupon.isActive 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                          : 'bg-slate-200 text-slate-500'
                        }`}>
                          {coupon.isActive ? 'Đang chạy' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => {
                              setEditingCoupon(coupon.code);
                              setCouponFormData({
                                code: coupon.code,
                                discountType: coupon.discountType,
                                discountValue: coupon.discountValue,
                                minOrderValue: coupon.minOrderValue,
                                expiryDate: coupon.expiryDate,
                                isActive: coupon.isActive,
                                usedCount: coupon.usedCount || 0,
                                usageLimit: coupon.usageLimit || 100
                              });
                              setIsCouponModalOpen(true);
                            }}
                            className="w-10 h-10 bg-white shadow-sm border border-slate-100 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteCoupon(coupon.code)}
                            className="w-10 h-10 bg-white shadow-sm border border-slate-100 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <i className="fa-solid fa-ticket-simple text-6xl"></i>
                          <span className="text-lg font-bold">Chưa có mã khuyến mãi nào</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-8 animate-fadeIn">
            {/* AI Summary Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <i className="fa-solid fa-microchip text-xl"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Model Hiện tại</p>
                    <h3 className="text-xl font-black">{AVAILABLE_AI_MODELS.find(m => m.id === aiConfig.activeModelId)?.name || 'Gemini 3 Flash'}</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">Trạng thái:</span>
                    <span className="font-bold">Đang hoạt động</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">Phiên bản:</span>
                    <span className="font-bold">Latest Preview</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm col-span-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <i className="fa-solid fa-circle-info"></i>
                  </div>
                  <h3 className="font-black text-slate-900">Lưu ý về hạn mức (Rate Limits)</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Hệ thống sử dụng Gemini API. Các model có hạn mức khác nhau về RPM (Requests/Min) và TPM (Tokens/Min). 
                  Vui lòng chọn model phù hợp với lưu lượng truy cập của cửa hàng để tránh lỗi gián đoạn dịch vụ AI.
                </p>
              </div>
            </div>

            {/* Model Selection Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-lg">Danh sách Model khả dụng</h3>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {AVAILABLE_AI_MODELS.length} Model được hỗ trợ
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model ID</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phân loại</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">RPM</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">TPM</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">RPD</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {AVAILABLE_AI_MODELS.map(model => (
                      <tr key={model.id} className={`hover:bg-slate-50 transition-all group ${aiConfig.activeModelId === model.id ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${aiConfig.activeModelId === model.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <i className="fa-solid fa-microchip text-xs"></i>
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{model.name}</p>
                              <code className="text-[10px] text-slate-400">{model.id}</code>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {model.category}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center text-sm font-bold text-slate-600">{model.rpm}</td>
                        <td className="px-8 py-6 text-center text-sm font-bold text-slate-600">{model.tpm}</td>
                        <td className="px-8 py-6 text-center text-sm font-bold text-slate-600">{model.rpd}</td>
                        <td className="px-8 py-6 text-right">
                          {aiConfig.activeModelId === model.id ? (
                            <div className="flex items-center justify-end gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                              <i className="fa-solid fa-circle-check"></i>
                              <span>Đang sử dụng</span>
                            </div>
                          ) : (
                            <button
                              disabled={isUpdatingAI}
                              onClick={() => handleUpdateAIModel(model.id)}
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all disabled:opacity-50"
                            >
                              Sử dụng
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Tổng doanh thu', 
                  value: formatPrice(stats.totalRevenue), 
                  color: 'bg-gradient-to-br from-emerald-500 to-emerald-600', 
                  icon: 'fa-chart-line',
                  subtext: `Trung bình ${formatPrice(stats.avgOrderValue)}/đơn`
                },
                { 
                  label: 'Đơn hàng hôm nay', 
                  value: stats.todayOrders, 
                  color: 'bg-gradient-to-br from-blue-500 to-blue-600', 
                  icon: 'fa-calendar-day',
                  subtext: `Tổng ${stats.totalOrders} đơn`
                },
                { 
                  label: 'Đơn chờ xử lý', 
                  value: stats.pendingOrders, 
                  color: 'bg-gradient-to-br from-amber-500 to-amber-600', 
                  icon: 'fa-clock',
                  subtext: `${stats.completedOrders} đã hoàn thành`
                },
                { 
                  label: 'Sản phẩm', 
                  value: books.length, 
                  color: 'bg-gradient-to-br from-indigo-500 to-indigo-600', 
                  icon: 'fa-book',
                  subtext: `${stats.totalBooks} quyển trong kho`
                }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
                  <div className="relative">
                    <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl group-hover:scale-110 transition-transform`}>
                      <i className={`fa-solid ${item.icon} text-xl`}></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                    <p className="text-3xl font-black text-slate-900 mb-1">{item.value}</p>
                    <p className="text-xs text-slate-500 font-semibold">{item.subtext}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Trạng thái kho</h3>
                  <i className="fa-solid fa-warehouse text-slate-300"></i>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Sắp hết hàng</span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black">{stats.lowStock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Hết hàng</span>
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-black">{stats.outOfStock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Tổng số đầu sách</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">{books.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Nội dung</h3>
                  <i className="fa-solid fa-database text-slate-300"></i>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Tác giả</span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-black">{stats.totalAuthors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Danh mục</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">{stats.totalCategories}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Mã khuyến mãi</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">{stats.totalCoupons}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2rem] shadow-lg text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black uppercase tracking-wider">Thao tác nhanh</h3>
                  <i className="fa-solid fa-bolt text-white/50"></i>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('books')}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <i className="fa-solid fa-book"></i>
                    <span>Quản lý kho sách</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <i className="fa-solid fa-shopping-cart"></i>
                    <span>Xử lý đơn hàng</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('coupons')}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <i className="fa-solid fa-ticket"></i>
                    <span>Tạo khuyến mãi</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Revenue & Distribution Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Doanh thu hệ thống</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Phân tích 7 ngày gần nhất</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tăng trưởng</span>
                    </div>
                    <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-indigo-50">
                      <option>Tháng này</option>
                      <option>Tháng trước</option>
                    </select>
                  </div>
                </div>
                
                <div className="h-80 flex items-end justify-between gap-4 lg:gap-8 px-2 lg:px-4">
                  {[45, 62, 38, 85, 55, 92, 75].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                      <div className="relative w-full flex justify-center items-end h-full">
                         <div 
                           style={{ height: `${v}%` }} 
                           className="w-full max-w-[48px] bg-indigo-50 group-hover:bg-indigo-600 rounded-2xl transition-all duration-700 relative shadow-inner"
                         >
                           <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-2 shadow-xl whitespace-nowrap">
                             {(v * 1200000).toLocaleString()}đ
                           </div>
                         </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] transform -rotate-45 sm:rotate-0">
                        T{i + 2 === 8 ? 'CN' : i + 2}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 mb-8">Danh mục hot</h3>
                    <div className="space-y-8">
                      {[
                        { name: 'Kinh tế', percent: 42, color: 'bg-indigo-600', icon: 'fa-chart-line' },
                        { name: 'Văn học', percent: 28, color: 'bg-emerald-500', icon: 'fa-hat-wizard' },
                        { name: 'Kỹ năng', percent: 18, color: 'bg-amber-500', icon: 'fa-brain' },
                        { name: 'Thiếu nhi', percent: 12, color: 'bg-rose-500', icon: 'fa-child' }
                      ].map((cat, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 ${cat.color} rounded-lg flex items-center justify-center text-white text-[10px]`}>
                                <i className={`fa-solid ${cat.icon}`}></i>
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{cat.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900">{cat.percent}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div style={{ width: `${cat.percent}%` }} className={`h-full ${cat.color} rounded-full shadow-lg`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 lg:p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="relative z-10">
                      <h4 className="text-lg font-black mb-2 uppercase tracking-tight">Hệ thống AI</h4>
                      <p className="text-[11px] text-slate-400 font-bold mb-6 leading-relaxed uppercase tracking-widest">Tự động hóa quản lý kho & báo cáo thông minh</p>
                      <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                        Khởi chạy Agent
                      </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Đơn hàng gần đây</h3>
                  <p className="text-xs text-slate-500 mt-1">5 đơn hàng mới nhất</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        order.statusStep === 0 ? 'bg-amber-100 text-amber-600' :
                        order.statusStep === 1 ? 'bg-blue-100 text-blue-600' :
                        order.statusStep === 2 ? 'bg-indigo-100 text-indigo-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        <i className="fa-solid fa-shopping-bag text-sm"></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{order.customer.name}</p>
                        <p className="text-xs text-slate-500">{order.customer.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{formatPrice(order.payment.total)}</p>
                      <p className="text-xs text-slate-500">{order.status}</p>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <i className="fa-solid fa-inbox text-4xl mb-2"></i>
                    <p className="text-sm font-bold">Chưa có đơn hàng nào</p>
                  </div>
                )}
              </div>
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

            {/* Bulk Actions for Books */}
            {filteredBooks.length > 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
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
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                    <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
                    <span>Xóa hàng loạt</span>
                  </button>
                )}
              </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-bottom border-slate-100">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">
                      <div 
                        onClick={toggleSelectAllBooks}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                          selectedBooks.length === filteredBooks.length && filteredBooks.length > 0
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedBooks.length === filteredBooks.length && filteredBooks.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                      </div>
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin sách</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Giá bán</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Tồn kho</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBooks.map(book => (
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
                            <h3 className="font-bold text-slate-900 text-sm mb-0.5 line-clamp-1">{book.title}</h3>
                            <p className="text-xs text-slate-500 font-medium">{book.author}</p>
                            <p className="text-[10px] text-slate-400 mt-1 md:hidden font-bold">{formatPrice(book.price)} • {book.stock_quantity > 0 ? `${book.stock_quantity} cuốn` : 'Hết hàng'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 hidden md:table-cell">
                        <span className="text-sm font-black text-indigo-600">{formatPrice(book.price)}</span>
                      </td>
                      <td className="p-6 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          book.stock_quantity > 10 ? 'bg-emerald-50 text-emerald-600' :
                          book.stock_quantity > 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          <div className={`w-1 h-1 rounded-full mr-1.5 ${
                             book.stock_quantity > 10 ? 'bg-emerald-600' :
                             book.stock_quantity > 0 ? 'bg-amber-600' : 'bg-rose-600'
                          }`}></div>
                          {book.stock_quantity > 0 ? `${book.stock_quantity} quyển` : 'Hết hàng'}
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
                  <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Không có dữ liệu phù hợp</h3>
                </div>
              )}
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

            {/* Bulk Actions for Authors */}
            {authors.length > 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={toggleSelectAllAuthors}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        selectedAuthors.length === authors.length && authors.length > 0
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-300 group-hover:border-indigo-400'
                      }`}
                    >
                      {selectedAuthors.length === authors.length && authors.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                    </div>
                    <span className="text-xs font-bold text-slate-600">Chọn tất cả ({authors.length})</span>
                  </label>
                  {selectedAuthors.length > 0 && (
                    <div className="h-4 w-px bg-slate-200"></div>
                  )}
                  {selectedAuthors.length > 0 && (
                    <span className="text-xs font-bold text-indigo-600">Đã chọn {selectedAuthors.length} tác giả</span>
                  )}
                </div>
                {selectedAuthors.length > 0 && (
                  <button 
                    onClick={handleBulkDeleteAuthors}
                    disabled={isDeletingBulk}
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                    <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
                    <span>Xóa hàng loạt</span>
                  </button>
                )}
              </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-bottom border-slate-100">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">
                      <div 
                        onClick={toggleSelectAllAuthors}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                          selectedAuthors.length === authors.length && authors.length > 0
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedAuthors.length === authors.length && authors.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                      </div>
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tác giả</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Tiểu sử</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {authors.map(author => (
                    <tr key={author.id} className={`group hover:bg-slate-50/50 transition-all ${selectedAuthors.includes(author.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="p-6 text-center">
                        <div 
                          onClick={() => toggleSelectAuthor(author.id)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                            selectedAuthors.includes(author.id)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white group-hover:border-indigo-400'
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
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tác giả DigiBook</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 hidden md:table-cell max-w-xs xl:max-w-md">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{author.bio || 'Chưa có tiểu sử'}</p>
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
                  <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Chưa có tác giả nào</h3>
                </div>
              )}
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

            {/* Bulk Actions for Categories */}
            {categories.length > 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      onClick={toggleSelectAllCategories}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        selectedCategories.length === categories.length && categories.length > 0
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'border-slate-300 group-hover:border-indigo-400'
                      }`}
                    >
                      {selectedCategories.length === categories.length && categories.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                    </div>
                    <span className="text-xs font-bold text-slate-600">Chọn tất cả ({categories.length})</span>
                  </label>
                  {selectedCategories.length > 0 && (
                    <div className="h-4 w-px bg-slate-200"></div>
                  )}
                  {selectedCategories.length > 0 && (
                    <span className="text-xs font-bold text-indigo-600">Đã chọn {selectedCategories.length} danh mục</span>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <button 
                    onClick={handleBulkDeleteCategories}
                    disabled={isDeletingBulk}
                    className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100 transition-all flex items-center gap-2"
                  >
                    <i className={isDeletingBulk ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-trash-can"}></i>
                    <span>Xóa hàng loạt</span>
                  </button>
                )}
              </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-bottom border-slate-100">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 text-center">
                      <div 
                        onClick={toggleSelectAllCategories}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                          selectedCategories.length === categories.length && categories.length > 0
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedCategories.length === categories.length && categories.length > 0 && <i className="fa-solid fa-check text-[10px]"></i>}
                      </div>
                    </th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Mô tả</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map(category => (
                    <tr key={(category as any).id || category.name} className={`group hover:bg-slate-50/50 transition-all ${selectedCategories.includes(category.name) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="p-6 text-center">
                        <div 
                          onClick={() => toggleSelectCategory(category.name)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer mx-auto ${
                            selectedCategories.includes(category.name)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white group-hover:border-indigo-400'
                          }`}
                        >
                          {selectedCategories.includes(category.name) && <i className="fa-solid fa-check text-[10px]"></i>}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <i className={`fa-solid ${category.icon}`}></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-0.5">{category.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Danh mục sách</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 hidden md:table-cell max-w-xs lg:max-w-md">
                        <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">{category.description || 'Chưa có mô tả'}</p>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditCategory(category)}
                            className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
                            title="Chỉnh sửa"
                          >
                            <i className="fa-solid fa-edit text-xs"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(category)}
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
              {categories.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-tags text-slate-300 text-2xl"></i>
                  </div>
                  <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Chưa có danh mục nào</h3>
                </div>
              )}
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

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">
                {editingCoupon ? 'Chỉnh sửa mã' : 'Tạo mã khuyến mãi mới'}
              </h2>
            </div>
            
            <form onSubmit={handleSaveCoupon} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Mã code *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingCoupon}
                  value={couponFormData.code || ''}
                  onChange={(e) => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-black text-indigo-600 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Vd: SUMMER2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Loại giảm giá</label>
                  <select
                    value={couponFormData.discountType || 'percentage'}
                    onChange={(e) => setCouponFormData({...couponFormData, discountType: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-bold"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">
                    {couponFormData.discountType === 'percentage' ? 'Phần trăm giảm' : 'Số tiền giảm'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={couponFormData.discountValue || 0}
                    onChange={(e) => setCouponFormData({...couponFormData, discountValue: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Giá trị đơn tối thiểu (đ)</label>
                <input
                  type="number"
                  min="0"
                  value={couponFormData.minOrderValue || 0}
                  onChange={(e) => setCouponFormData({...couponFormData, minOrderValue: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Ngày hết hạn</label>
                <input
                  type="date"
                  required
                  value={couponFormData.expiryDate || ''}
                  onChange={(e) => setCouponFormData({...couponFormData, expiryDate: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-100 font-bold"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={couponFormData.isActive ?? true}
                  onChange={(e) => setCouponFormData({...couponFormData, isActive: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Kích hoạt mã khuyến mãi này</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 px-6 py-4 border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-100"
                >
                  {editingCoupon ? 'Cập nhật mã' : 'Tạo mã mới'}
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
