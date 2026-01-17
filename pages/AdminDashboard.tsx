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
    const lowStock = books.filter(b => b.stock_quantity > 0 && b.stock_quantity < 10).length;
    const outOfStock = books.filter(b => b.stock_quantity <= 0).length;
    const pendingOrders = orders.filter(o => o.statusStep < 3).length;
    const completedOrders = orders.filter(o => o.statusStep === 3).length;
    const totalBooks = books.reduce((sum, b) => sum + b.stock_quantity, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const todayOrdersCount = orders.filter(o => {
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
      todayOrders: todayOrdersCount,
      totalCategories: categories.length,
      totalAuthors: authors.length,
      totalCoupons: coupons.length
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

      {/* Sidebar - Cố định bên trái - Nâng cấp màu Midnight Premium */}
      <aside className={`w-80 flex flex-col fixed inset-y-0 z-[100] shadow-2xl transition-all duration-500 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${adminTheme === 'midnight' ? 'bg-[#0f172a]' : 'bg-white border-r border-slate-100'}`}>
        <div className={`p-6 border-b flex items-center justify-between gap-4 h-24 ${adminTheme === 'midnight' ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <Link to="/" className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white hover:scale-110 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group">
              <i className="fa-solid fa-house-chimney group-hover:rotate-12 transition-transform"></i>
            </Link>
            <div>
              <h1 className={`text-sm font-black tracking-tight uppercase ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>DigiBook</h1>
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-0.5">Admin Dashboard</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-2">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-5 space-y-2 mt-4 custom-scrollbar">
          {[
            { id: "overview", label: "Tổng quan", icon: "fa-chart-pie" },
            { id: "books", label: "Kho sách", icon: "fa-book-bookmark" },
            { id: "orders", label: "Đơn hàng", icon: "fa-truck-fast" },
            { id: "authors", label: "Tác giả", icon: "fa-user-pen" },
            { id: "categories", label: "Danh mục", icon: "fa-shapes" },
            { id: "coupons", label: "Khuyến mãi", icon: "fa-tags" },
            { id: "users", label: "Tài khoản", icon: "fa-user-group" },
            { id: "logs", label: "Nhật ký", icon: "fa-terminal" },
            { id: "ai", label: "Trợ lý AI", icon: "fa-wand-magic-sparkles" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 group
                ${activeTab === tab.id 
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/20" 
                  : `${adminTheme === 'midnight' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'} hover:translate-x-1`
                }`}
            >
              <i className={`fa-solid ${tab.icon} w-5 text-center text-sm ${activeTab === tab.id ? 'text-white' : `${adminTheme === 'midnight' ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}`}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Sidebar - Dark Style */}
        <div className={`p-6 border-t mx-4 mb-4 rounded-3xl transition-colors ${adminTheme === 'midnight' ? 'bg-[#1e293b]/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${adminTheme === 'midnight' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white border-slate-200'}`}>
              <i className="fa-solid fa-crown text-indigo-400"></i>
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase block tracking-wider ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>Super Admin</span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                Vận hành tốt
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 lg:ml-80 min-h-screen flex flex-col transition-all duration-500 ${adminTheme === 'midnight' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        <header className={`backdrop-blur-xl border-b sticky top-0 z-40 h-24 flex items-center justify-between px-6 lg:px-10 transition-colors ${adminTheme === 'midnight' ? 'bg-[#0f172a]/80 border-white/5' : 'bg-white/80 border-slate-100'}`}>
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
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center border shadow-inner ${adminTheme === 'midnight' ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
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
                  <div key={i} className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border shadow-2xl transition-all group relative overflow-hidden ${adminTheme === 'midnight' ? 'bg-[#0f172a]/50 border-white/5 hover:bg-[#0f172a]/80' : 'bg-white border-slate-100 hover:shadow-indigo-500/10'}`}>
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className={`w-16 h-16 ${stat.bgColor} ${stat.iconColor} rounded-3xl flex items-center justify-center text-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]`}>
                        <i className={`fa-solid ${stat.icon}`}></i>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase ${adminTheme === 'midnight' ? 'bg-white/5 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>Live</span>
                      </div>
                    </div>
                    <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mb-1.5 relative z-10">{stat.label}</p>
                    <h3 className={`text-2xl lg:text-3xl font-black tracking-tight relative z-10 ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
                    <p className="text-[10px] lg:text-micro font-bold text-slate-500 mt-4 flex items-center gap-2 relative z-10">
                      <span className={`w-1.5 h-1.5 rounded-full ${stat.iconColor} animate-pulse`}></span>
                      {stat.sub}
                    </p>
                    {/* Background Accent */}
                    <div className={`absolute -right-8 -bottom-8 w-24 lg:w-32 h-24 lg:h-32 ${stat.bgColor.replace('/10', '/5')} opacity-0 circle group-hover:opacity-100 transition-opacity duration-700 blur-3xl`}></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className={`lg:col-span-2 p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border shadow-2xl relative overflow-hidden transition-all ${adminTheme === 'midnight' ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-100'}`}>
                  <div className={`absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>
                    <i className="fa-solid fa-database text-[80px] lg:text-[120px]"></i>
                  </div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className={`text-lg lg:text-xl font-black uppercase tracking-tight ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>Hệ thống dữ liệu</h3>
                      <p className="text-[10px] lg:text-micro font-bold text-indigo-400/60 uppercase tracking-premium mt-1">Khởi tạo và đồng bộ dữ liệu Firestore</p>
                    </div>
                  </div>
                  
                  <div className={`rounded-2xl lg:rounded-3xl p-6 lg:p-8 border ${adminTheme === 'midnight' ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                      <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl shadow-inner border flex items-center justify-center text-2xl lg:text-3xl ${adminTheme === 'midnight' ? 'bg-white/5 border-white/10 text-indigo-400' : 'bg-white border-slate-200 text-indigo-500'}`}>
                        <i className="fa-solid fa-server"></i>
                      </div>
                      <div>
                        <h4 className={`text-xs lg:text-sm font-black uppercase ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>Cloud Firestore Seed Tool</h4>
                        <p className="text-[10px] lg:text-xs text-slate-400 mt-1 leading-relaxed max-w-md">Thiết lập môi trường làm việc nhanh chóng bằng cách đẩy dữ liệu mẫu lên Cloud.</p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      <button
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="px-6 lg:px-8 py-3.5 bg-indigo-600 text-white rounded-xl lg:rounded-2xl text-[10px] lg:text-micro font-bold uppercase tracking-premium hover:bg-indigo-500 disabled:bg-slate-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95"
                      >
                        {isSeeding ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                        {isSeeding ? "Đang đẩy dữ liệu..." : "Seed Dữ liệu"}
                      </button>
                      <button className={`px-6 lg:px-8 py-3.5 border rounded-xl lg:rounded-2xl text-[10px] lg:text-micro font-bold uppercase tracking-premium transition-all flex items-center justify-center gap-3 ${adminTheme === 'midnight' ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}>
                        <i className="fa-solid fa-file-export"></i>
                        Xuất JSON
                      </button>
                    </div>

                    {seedStatus && (
                      <div className={`mt-6 p-4 rounded-xl lg:rounded-2xl flex items-center gap-4 animate-scaleIn ${
                        seedStatus.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                        seedStatus.type === "info" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        <i className={`fa-solid ${seedStatus.type === "success" ? "fa-circle-check" : seedStatus.type === "info" ? "fa-circle-info" : "fa-triangle-exclamation"}`}></i>
                        <span className="text-[9px] lg:text-micro font-bold uppercase tracking-premium">{seedStatus.msg}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  <div className={`p-6 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border transition-all ${adminTheme === 'midnight' ? 'bg-[#0f172a]/50 border-white/5' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-xs lg:text-label font-bold uppercase tracking-premium ${adminTheme === 'midnight' ? 'text-white' : 'text-slate-900'}`}>Nội dung</h3>
                      <i className="fa-solid fa-database text-indigo-400/40"></i>
                    </div>
                    <div className="space-y-3 lg:space-y-4">
                      {[
                        { label: "Tác giả", value: stats.totalAuthors, color: "purple" },
                        { label: "Danh mục", value: stats.totalCategories, color: "blue" },
                        { label: "Mã KM", value: stats.totalCoupons, color: "emerald" }
                      ].map((item, id) => (
                        <div key={id} className={`flex items-center justify-between p-3 rounded-xl lg:rounded-2xl border ${adminTheme === 'midnight' ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                          <span className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase">{item.label}</span>
                          <span className={`px-2 lg:px-3 py-1 rounded-lg text-micro font-bold border ${adminTheme === 'midnight' ? `bg-${item.color}-500/10 text-${item.color}-400 border-${item.color}-500/20` : `bg-${item.color}-50 text-${item.color}-600 border-${item.color}-100`}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-500">
                      <i className="fa-solid fa-bolt text-3xl lg:text-4xl text-white/50"></i>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xs lg:text-label font-bold uppercase tracking-premium mb-4 lg:mb-6">Thao tác nhanh</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3">
                        <button
                          onClick={() => setActiveTab("books")}
                          className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-[10px] lg:text-micro font-bold transition-all text-left flex items-center gap-3 uppercase tracking-premium border border-white/10"
                        >
                          <i className="fa-solid fa-book"></i>
                          <span>Kho sách</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-[10px] lg:text-micro font-bold transition-all text-left flex items-center gap-3 uppercase tracking-premium border border-white/10"
                        >
                          <i className="fa-solid fa-shopping-cart"></i>
                          <span>Đơn hàng</span>
                        </button>
                      </div>
                    </div>
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
