import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../services/db";
import { Book, CategoryInfo, Author, Coupon, UserProfile, Order, SystemLog } from "../types";
import AdminBooks from "../components/admin/AdminBooks";
import AdminOrders from "../components/admin/AdminOrders";
import AdminAuthors from "../components/admin/AdminAuthors";
import AdminCategories from "../components/admin/AdminCategories";
import AdminCoupons from "../components/admin/AdminCoupons";
import AdminUsers from "../components/admin/AdminUsers";
import AdminAI from "../components/admin/AdminAI";
import AdminLogs from "../components/admin/AdminLogs";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

interface AISettings {
  activeModelId: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "books" | "orders" | "categories" | "authors" | "coupons" | "users" | "logs" | "ai">("overview");
  const [adminTheme, setAdminTheme] = useState<"midnight" | "light">(localStorage.getItem("digibook_admin_theme") as any || "midnight");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [aiConfig, setAIConfig] = useState<AISettings>({ activeModelId: "gemini-1.5-flash" });

  const toggleTheme = () => {
    const newTheme = adminTheme === "midnight" ? "light" : "midnight";
    setAdminTheme(newTheme);
    localStorage.setItem("digibook_admin_theme", newTheme);
  };
  
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [isLoadingMoreLogs, setIsLoadingMoreLogs] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{msg: string, type: "success" | "error" | "info"} | null>(null);

  const refreshData = async () => {
    try {
      const [booksData, catsData, authorsData, couponsData, usersData, aiConfigData] = await Promise.all([
        db.getBooks(),
        db.getCategories(),
        db.getAuthors(),
        db.getCoupons(),
        db.getAllUsers(),
        db.getAIConfig()
      ]);
      setBooks(booksData);
      setCategories(catsData);
      setAuthors(authorsData);
      setCoupons(couponsData);
      setUsers(usersData);
      setAIConfig(aiConfigData);
      
      const allOrders = await db.getOrdersByUserId("admin");
      setOrders(allOrders);

      if (activeTab === "logs") {
        const logsData = await db.getSystemLogs(0, 50);
        setLogs(logsData);
        setHasMoreLogs(logsData.length === 50);
      }
    } catch (err) {
      console.error("Data refresh failed:", err);
    }
  };

  const onLoadMoreLogs = async () => {
    if (isLoadingMoreLogs || !hasMoreLogs) return;
    setIsLoadingMoreLogs(true);
    try {
      const nextLogs = await db.getSystemLogs(logs.length, 50);
      if (nextLogs.length < 50) {
        setHasMoreLogs(false);
      }
      setLogs(prev => [...prev, ...nextLogs]);
    } catch (error) {
      console.error("Error loading more logs:", error);
    } finally {
      setIsLoadingMoreLogs(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.payment?.total || 0), 0);
    const lowStock = books.filter(b => b.stockQuantity > 0 && b.stockQuantity < 10).length;
    const outOfStock = books.filter(b => b.stockQuantity === 0).length;
    const pendingOrders = orders.filter(o => o.statusStep < 3).length;
    const completedOrders = orders.filter(o => o.statusStep === 3).length;
    const totalBooks = books.reduce((sum, b) => sum + b.stockQuantity, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const todayOrdersCount = orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.date);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length;

    // Tính toán doanh thu 7 ngày gần nhất
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    const revenueByDay = last7Days.map(dateStr => {
      const dayTotal = orders
        .filter(o => {
          const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.date);
          return oDate.toDateString() === dateStr;
        })
        .reduce((sum, o) => sum + (o.payment?.total || 0), 0);
      
      return {
        date: new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        total: dayTotal
      };
    });

    const maxRevenue = Math.max(...revenueByDay.map(d => d.total), 1);

    // Lấy 5 đơn hàng mới nhất
    const recentOrdersList = [...orders]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.date).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.date).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    // Tính toán Top sách bán chạy (giả định từ các đơn hàng)
    const bookSalesMap = new Map();
    orders.forEach(order => {
      order.items?.forEach(item => {
        const count = bookSalesMap.get(item.bookId) || 0;
        bookSalesMap.set(item.bookId, count + item.quantity);
      });
    });

    const topSellingList = [...books]
      .map(book => ({
        ...book,
        salesCount: bookSalesMap.get(book.id) || 0
      }))
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    return { 
      totalRevenue, 
      lowStock, 
      outOfStock, 
      pendingOrders, 
      completedOrders,
      totalOrders: orders.length,
      totalBooks,
      avgOrderValue,
      todayOrders: todayOrdersCount,
      totalCategories: categories.length,
      totalAuthors: authors.length,
      totalCoupons: coupons.length,
      revenueByDay,
      maxRevenue,
      recentOrders: recentOrdersList,
      topSellingBooks: topSellingList
    };
  }, [orders, books, categories, authors, coupons]);

  const handleSeedData = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn đẩy dữ liệu mẫu lên Firestore?")) return;
    setIsSeeding(true);
    setSeedStatus({ msg: "Đang đẩy dữ liệu lên Cloud Firestore...", type: "info" });
    try {
      const result = await db.seedDatabase();
      if (result.success) {
        setSeedStatus({ msg: `Thành công! Đã cập nhật ${result.count} danh mục hệ thống.`, type: "success" });
        setTimeout(() => { refreshData(); setIsSeeding(false); }, 1500);
      } else {
        setIsSeeding(false);
        setSeedStatus({ msg: `Lỗi: ${result.error}`, type: "error" });
      }
    } catch (err: any) {
      setIsSeeding(false);
      setSeedStatus({ msg: `Lỗi hệ thống: ${err.message}`, type: "error" });
    }
    setTimeout(() => setSeedStatus(null), 8000);
  };

  return (
    <div className={`flex min-h-screen ${adminTheme === 'midnight' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Cố định bên trái - Nâng cấp màu Midnight Premium (Luôn luôn tối) */}
      <aside className={`w-80 flex flex-col fixed inset-y-0 z-[100] shadow-2xl transition-all duration-700 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} bg-[#0f172a]`}>
        <div className="p-8 border-b border-white/[0.03] flex items-center justify-between gap-4 h-24 bg-[#0f172a] relative z-20">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center text-white hover:scale-105 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 group">
              <i className="fa-solid fa-bolt-lightning group-hover:rotate-12 transition-transform"></i>
            </Link>
            <div>
              <h1 className="text-base font-black tracking-tighter uppercase text-white leading-none">DigiBook</h1>
              <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.3em] mt-1.5 shadow-indigo-500/10">Architecture</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-500 hover:text-white p-2 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-6 space-y-2.5 mt-2 custom-scrollbar relative z-10">
          {[
            { id: "overview", label: "Tổng quan", icon: "fa-grid-2" },
            { id: "books", label: "Kho sách", icon: "fa-book" },
            { id: "orders", label: "Giao dịch", icon: "fa-receipt" },
            { id: "authors", label: "Tác giả", icon: "fa-pen-nib" },
            { id: "categories", label: "Thể loại", icon: "fa-shapes" },
            { id: "coupons", label: "Ưu đãi", icon: "fa-percent" },
            { id: "users", label: "Nhân sự", icon: "fa-user-tie" },
            { id: "logs", label: "Audit Log", icon: "fa-fingerprint" },
            { id: "ai", label: "AI Core", icon: "fa-microchip" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 group relative
                ${activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] hover:translate-x-1"
                }`}
            >
              <i className={`fa-solid ${tab.icon} w-5 text-center text-sm ${activeTab === tab.id ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'}`}></i>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer Sidebar - Dark Style */}
        <div className="p-6 border-t border-white/[0.03] mx-4 mb-6 rounded-[2rem] transition-all bg-white/[0.02] hover:bg-white/[0.04]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 group">
              <i className="fa-solid fa-crown text-indigo-400 group-hover:scale-110 transition-transform"></i>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase block tracking-widest text-white truncate">Administrator</span>
              <div className="flex items-center gap-2 mt-1.5">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                 <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest">Hệ thống ổn định</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 lg:ml-80 min-h-screen flex flex-col transition-all duration-500 ${adminTheme === 'midnight' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        <header className={`backdrop-blur-xl border-b sticky top-0 z-40 h-24 flex items-center justify-between px-6 lg:px-10 transition-colors ${adminTheme === 'midnight' ? 'bg-[#0f172a]/80 border-white/5' : 'bg-white/80 border-slate-200/60'}`}>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className={`lg:hidden w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                  adminTheme === 'midnight' ? 'bg-white/5 text-white border border-white/10' : 'bg-white text-slate-900 border border-slate-200'
                }`}
              >
                <i className="fa-solid fa-bars-staggered"></i>
              </button>
              <div>
                <h2 className={`text-xl lg:text-2xl font-black uppercase tracking-tight ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>
                  {activeTab === 'overview' ? 'Báo cáo tổng quan' : 
                   activeTab === 'books' ? 'Quản lý kho sách' :
                   activeTab === 'orders' ? 'Đơn hàng & Vận chuyển' :
                   activeTab === 'authors' ? 'Tác giả & Nhà văn' :
                   activeTab === 'categories' ? 'Phân loại danh mục' :
                   activeTab === 'coupons' ? 'Mã giảm giá & KM' :
                   activeTab === 'users' ? 'Quản lý tài khoản' :
                   activeTab === 'logs' ? 'Lịch sử hệ thống' : 'Cấu hình AI Assistant'}
                </h2>
                <p className="text-[8px] lg:text-micro font-bold text-indigo-400/60 uppercase tracking-[0.2em] mt-1 hidden sm:block">Digibook Management System v2.0</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3 lg:gap-6">
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${
                  adminTheme === 'midnight' 
                    ? 'bg-indigo-600 text-white shadow-indigo-500/20' 
                    : 'bg-white text-slate-600 border border-slate-200 shadow-slate-200/50'
                }`}
              >
                <i className={`fa-solid ${adminTheme === 'midnight' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>

              <div className="hidden md:flex flex-col items-end">
                <span className="text-micro font-black text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
                <span className={`text-sm font-black ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center border shadow-inner ${adminTheme === 'midnight' ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-white text-slate-500 border-slate-200'}`}>
                 <i className="fa-solid fa-calendar-check text-indigo-400"></i>
              </div>
           </div>
        </header>

        <div className="p-4 lg:p-10 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {activeTab === "overview" && (
            <div className="space-y-6 lg:space-y-10 animate-fadeIn">
              {/* Stats Grid - Premium Glassmorphism */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                {[
                  { label: "Doanh thu", value: formatPrice(stats.totalRevenue), icon: "fa-sack-dollar", bgColor: "bg-emerald-500/10", iconColor: "text-emerald-400", sub: `Trung bình ${formatPrice(stats.avgOrderValue)}/đơn` },
                  { label: "Đơn hàng", value: stats.totalOrders, icon: "fa-cart-shopping", bgColor: "bg-indigo-500/10", iconColor: "text-indigo-400", sub: `${stats.todayOrders} đơn trong hôm nay` },
                  { label: "Sách tồn", value: stats.totalBooks, icon: "fa-book-open-reader", bgColor: "bg-violet-500/10", iconColor: "text-violet-400", sub: `${stats.outOfStock} đầu sách đã hết` },
                  { label: "Đang xử lý", value: stats.pendingOrders, icon: "fa-clock", bgColor: "bg-amber-500/10", iconColor: "text-amber-400", sub: `${stats.completedOrders} đơn đã hoàn thành` }
                ].map((stat, i) => (
                  <div key={i} className={`p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] border shadow-2xl transition-all duration-500 group relative overflow-hidden ${adminTheme === 'midnight' ? 'bg-[#0f172a]/40 border-white/[0.03] hover:bg-[#0f172a]/60' : 'bg-white border-slate-200/50 hover:shadow-indigo-500/5 hover:border-indigo-200'}`}>
                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className={`w-14 h-14 lg:w-16 lg:h-16 ${stat.bgColor} ${stat.iconColor} rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center text-xl lg:text-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]`}>
                        <i className={`fa-solid ${stat.icon}`}></i>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`w-2 h-2 rounded-full ${stat.iconColor} animate-pulse shadow-[0_0_10px_currentColor]`}></div>
                      </div>
                    </div>
                    <p className="text-[10px] lg:text-micro font-black text-slate-500 uppercase tracking-premium mb-2 relative z-10">{stat.label}</p>
                    <h3 className={`text-2xl lg:text-3xl font-black tracking-tighter relative z-10 ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
                    <div className={`h-1 w-12 rounded-full mt-4 mb-2 transition-all duration-500 group-hover:w-20 ${stat.bgColor.replace('/10', '/30')}`}></div>
                    <p className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2 relative z-10">
                      {stat.sub}
                    </p>
                    {/* Background Light Effect */}
                    <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${stat.bgColor.replace('/10', '/5')} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[80px]`}></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* Revenue Chart - chiếm 3 cột */}
                <div className={`lg:col-span-3 p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border shadow-2xl relative overflow-hidden transition-all ${adminTheme === 'midnight' ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-200/60 shadow-slate-200/50'}`}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className={`text-lg lg:text-xl font-black uppercase tracking-tight ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>Biểu đồ doanh thu</h3>
                      <p className="text-[10px] lg:text-micro font-bold text-indigo-400/60 uppercase tracking-premium mt-1">Phân tích hiệu suất bán hàng 7 ngày qua</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className={`flex items-center gap-2 text-micro font-bold uppercase ${stats.revenueByDay[stats.revenueByDay.length-1].total >= stats.revenueByDay[stats.revenueByDay.length-2].total ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <i className={`fa-solid ${stats.revenueByDay[stats.revenueByDay.length-1].total >= stats.revenueByDay[stats.revenueByDay.length-2].total ? 'fa-caret-up' : 'fa-caret-down'}`}></i> 
                          {Math.abs(stats.revenueByDay[stats.revenueByDay.length-1].total - stats.revenueByDay[stats.revenueByDay.length-2].total) > 0 ? 'Có biến động' : 'Ổn định'}
                       </span>
                    </div>
                  </div>
                  
                  {/* Revenue Chart Visualization */}
                  <div className="h-72 mt-10 flex items-end justify-between gap-2 lg:gap-6 px-4 relative z-10">
                    {stats.revenueByDay.map((day: any, i: number) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer h-full justify-end">
                        <div className="relative w-full flex justify-center items-end h-[85%]">
                           {/* Bar */}
                           <div 
                             className={`w-full max-w-[45px] rounded-t-2xl transition-all duration-700 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] relative ${
                               adminTheme === 'midnight' 
                               ? 'bg-gradient-to-t from-indigo-900 to-indigo-500' 
                               : 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                             }`}
                             style={{ height: `${(day.total / stats.maxRevenue) * 100}%`, minHeight: '6px' }}
                           >
                              {/* Tooltip */}
                              <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-2 whitespace-nowrap shadow-2xl z-20 flex flex-col items-center">
                                 <span className="text-slate-400 font-bold uppercase text-[8px] mb-1">{day.date}</span>
                                 {formatPrice(day.total)}
                              </div>

                              {/* Glowing Dot on top */}
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${adminTheme === 'midnight' ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                          {day.date.split('/')[0]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Horizontal Grid Lines */}
                  <div className="absolute inset-x-8 top-32 bottom-20 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className={`w-full h-px ${adminTheme === 'midnight' ? 'bg-white' : 'bg-slate-900'}`}></div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:gap-8">
                  <div className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border transition-all ${adminTheme === 'midnight' ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-200/60 shadow-slate-200/50'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-xs font-black uppercase tracking-premium ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>Nội dung</h3>
                      <i className="fa-solid fa-database text-indigo-400/40"></i>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Tác giả", value: stats.totalAuthors, color: "emerald", icon: "fa-pen-nib" },
                        { label: "Danh mục", value: stats.totalCategories, color: "indigo", icon: "fa-shapes" },
                        { label: "Mã KM", value: stats.totalCoupons, color: "amber", icon: "fa-ticket" }
                      ].map((item, id) => (
                        <div key={id} className={`flex items-center justify-between p-4 rounded-2xl border group transition-all ${adminTheme === 'midnight' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-100'}`}>
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${adminTheme === 'midnight' ? `bg-${item.color}-500/20 text-${item.color}-400` : `bg-${item.color}-50 text-${item.color}-600`}`}>
                                <i className={`fa-solid ${item.icon}`}></i>
                             </div>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.label}</span>
                          </div>
                          <span className={`text-sm font-black transition-transform group-hover:scale-110 ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1e293b] p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group flex flex-col justify-between border border-white/5">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-[60px] group-hover:bg-indigo-600/30 transition-all duration-700"></div>
                    <div className="relative z-10">
                      <h3 className="text-xs font-black uppercase tracking-premium mb-6 flex items-center gap-2">
                        <i className="fa-solid fa-bolt-lightning text-amber-400"></i>
                        Thao tác nhanh
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setActiveTab("books")}
                          className="w-full bg-white/5 hover:bg-indigo-600 backdrop-blur-md px-5 py-4 rounded-2xl text-[10px] font-black transition-all text-left flex items-center justify-between uppercase tracking-premium border border-white/5 shadow-inner group/btn"
                        >
                          <div className="flex items-center gap-3">
                            <i className="fa-solid fa-book-medical"></i>
                            <span>Thêm sách mới</span>
                          </div>
                          <i className="fa-solid fa-chevron-right text-[8px] opacity-0 group-hover/btn:opacity-100 transition-all"></i>
                        </button>
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="w-full bg-white/5 hover:bg-violet-600 backdrop-blur-md px-5 py-4 rounded-2xl text-[10px] font-black transition-all text-left flex items-center justify-between uppercase tracking-premium border border-white/5 shadow-inner group/btn"
                        >
                          <div className="flex items-center gap-3">
                            <i className="fa-solid fa-boxes-packing"></i>
                            <span>Xử lý đơn hàng</span>
                          </div>
                          <i className="fa-solid fa-chevron-right text-[8px] opacity-0 group-hover/btn:opacity-100 transition-all"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Section - NEW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Recent Orders */}
                <div className={`p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border shadow-2xl transition-all ${adminTheme === 'midnight' ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-200/60'}`}>
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className={`text-lg font-black uppercase tracking-tight ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>Đơn hàng mới nhất</h3>
                       <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Hoạt động mua hàng gần đây nhất</p>
                     </div>
                     <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black uppercase tracking-premium text-indigo-400 hover:text-indigo-300 transition-colors">Xem tất cả</button>
                   </div>
                   
                   <div className="space-y-4">
                     {stats.recentOrders.length > 0 ? stats.recentOrders.map((order: any) => (
                       <div key={order.id} className={`flex items-center justify-between p-5 rounded-3xl transition-all ${adminTheme === 'midnight' ? 'bg-white/5 border border-white/5 hover:bg-white/[0.08]' : 'bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100'}`}>
                         <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${
                             order.statusStep === 3 ? 'bg-emerald-500/10 text-emerald-400' : 
                             order.statusStep === 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                           }`}>
                             <i className={`fa-solid ${order.statusStep === 3 ? 'fa-check' : 'fa-clock'}`}></i>
                           </div>
                           <div>
                             <h4 className={`text-xs font-black uppercase tracking-tight ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>#{order.id.slice(-6)}</h4>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">{order.customer?.name || 'Ẩn danh'}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className={`text-xs font-black ${adminTheme === 'midnight' ? 'text-indigo-400' : 'text-indigo-600'}`}>{formatPrice(order.payment?.total || 0)}</p>
                           <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                             {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : 'Hôm nay'}
                           </p>
                         </div>
                       </div>
                     )) : (
                       <div className="py-20 text-center opacity-30">
                          <i className="fa-solid fa-inbox text-4xl mb-3"></i>
                          <p className="text-micro font-bold uppercase">Chưa có dữ liệu</p>
                       </div>
                     )}
                   </div>
                </div>

                {/* Top Selling Books */}
                <div className={`p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border shadow-2xl transition-all ${adminTheme === 'midnight' ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-200/60'}`}>
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className={`text-lg font-black uppercase tracking-tight ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>Sản phẩm bán chạy</h3>
                       <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Thống kê theo số lượng đã bán</p>
                     </div>
                     <button onClick={() => setActiveTab('books')} className="text-[10px] font-black uppercase tracking-premium text-indigo-400 hover:text-indigo-300 transition-colors">Quản lý kho</button>
                   </div>

                   <div className="space-y-4">
                     {stats.topSellingBooks.length > 0 ? stats.topSellingBooks.map((book: any, idx: number) => (
                       <div key={idx} className={`flex items-center justify-between p-4 rounded-3xl transition-all ${adminTheme === 'midnight' ? 'bg-white/5 border border-white/5 hover:bg-white/[0.08]' : 'bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-100'}`}>
                         <div className="flex items-center gap-4">
                           <div className="relative">
                             <img src={book.cover} alt={book.title} className="w-12 h-16 object-cover rounded-xl shadow-lg border border-white/10" />
                             <div className="absolute -top-2 -left-2 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                               {idx + 1}
                             </div>
                           </div>
                           <div className="max-w-[180px]">
                             <h4 className={`text-xs font-black uppercase tracking-tight line-clamp-1 ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>{book.title}</h4>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{book.category}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="flex flex-col items-end">
                              <span className={`px-2 py-1 rounded-lg text-micro font-black uppercase border ${adminTheme === 'midnight' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                Đã bán: {book.salesCount}
                              </span>
                              <p className={`text-[10px] font-bold uppercase mt-2 ${book.stockQuantity < 10 ? 'text-rose-400' : 'text-slate-500'}`}>
                                Tồn: {book.stockQuantity}
                              </p>
                           </div>
                         </div>
                       </div>
                     )) : (
                       <div className="py-20 text-center opacity-30">
                          <i className="fa-solid fa-chart-line text-4xl mb-3"></i>
                          <p className="text-micro font-bold uppercase">Chưa có dữ liệu giao dịch</p>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "books" && (
            <AdminBooks books={books} authors={authors} categories={categories} refreshData={refreshData} />
          )}
          {activeTab === "authors" && <AdminAuthors authors={authors} refreshData={refreshData} />}
          {activeTab === "categories" && <AdminCategories categories={categories} refreshData={refreshData} />}
          {activeTab === "coupons" && <AdminCoupons coupons={coupons} refreshData={refreshData} />}
          {activeTab === "orders" && <AdminOrders orders={orders} refreshData={refreshData} />}
          {activeTab === "users" && <AdminUsers users={users} refreshData={refreshData} />}
          {activeTab === "ai" && <AdminAI aiConfig={{ activeModelId: aiConfig.activeModelId }} refreshData={refreshData} />}
          {activeTab === "logs" && (
            <AdminLogs 
              logs={logs} 
              hasMoreLogs={hasMoreLogs} 
              onLoadMore={onLoadMoreLogs} 
              isLoadingMoreLogs={isLoadingMoreLogs} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
