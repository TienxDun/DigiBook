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
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [aiConfig, setAIConfig] = useState<AISettings>({ activeModelId: "gemini-1.5-flash" });
  
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Cố định bên trái - Nâng cấp màu Midnight Premium */}
      <aside className="w-80 bg-[#0f172a] flex flex-col fixed inset-y-0 z-[100] shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-4 h-24">
          <Link to="/" className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white hover:scale-110 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group">
            <i className="fa-solid fa-house-chimney group-hover:rotate-12 transition-transform"></i>
          </Link>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight uppercase">DigiBook</h1>
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-0.5">Admin Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-5 space-y-2 mt-4 custom-scrollbar">
          {[
            { id: "overview", label: "Tổng quan", icon: "fa-chart-pie" },
            { id: "books", label: "Kho sách", icon: "fa-book-bookmark" },
            { id: "orders", label: "Đơn hàng", icon: "fa-truck-fast" },
            { id: "authors", label: "Tác giả", icon: "fa-user-pen" },
            { id: "categories", label: "Danh mục", icon: "fa-shapes" },
            { id: "coupons", label: "Khuyến mãi", icon: "fa-tags" },
            { id: "users", label: "Thành viên", icon: "fa-user-group" },
            { id: "logs", label: "Nhật ký", icon: "fa-terminal" },
            { id: "ai", label: "Trợ lý AI", icon: "fa-wand-magic-sparkles" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 group
                ${activeTab === tab.id 
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                }`}
            >
              <i className={`fa-solid ${tab.icon} w-5 text-center text-sm ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Sidebar - Dark Style */}
        <div className="p-6 bg-[#1e293b]/50 border-t border-white/5 mx-4 mb-4 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <i className="fa-solid fa-crown text-indigo-400"></i>
            </div>
            <div>
              <span className="text-[10px] font-black text-white uppercase block tracking-wider">Super Admin</span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                Vận hành tốt
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-80 min-h-screen">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 h-24 flex items-center justify-between px-10">
           <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {activeTab === 'overview' ? 'Báo cáo tổng quan' : 
                 activeTab === 'books' ? 'Quản lý kho sách' :
                 activeTab === 'orders' ? 'Đơn hàng & Vận chuyển' :
                 activeTab === 'authors' ? 'Tác giả & Nhà văn' :
                 activeTab === 'categories' ? 'Phân loại danh mục' :
                 activeTab === 'coupons' ? 'Mã giảm giá & KM' :
                 activeTab === 'users' ? 'Quản lý tài khoản' :
                 activeTab === 'logs' ? 'Lịch sử hệ thống' : 'Cấu hình AI Assistant'}
              </h2>
              <p className="text-micro font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Digibook Management System v2.0</p>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-micro font-black text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
                <span className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                 <i className="fa-solid fa-calendar-check text-indigo-500"></i>
              </div>
           </div>
        </header>

        <div className="p-10">
          {activeTab === "overview" && (
            <div className="space-y-10 animate-fadeIn">
              {/* Stats Grid - Enhanced Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Doanh thu", value: formatPrice(stats.totalRevenue), icon: "fa-sack-dollar", bgColor: "bg-emerald-50", iconColor: "text-emerald-600", sub: `Trung bình ${formatPrice(stats.avgOrderValue)}/đơn` },
                  { label: "Đơn hàng", value: stats.totalOrders, icon: "fa-cart-shopping", bgColor: "bg-indigo-50", iconColor: "text-indigo-600", sub: `${stats.todayOrders} đơn trong hôm nay` },
                  { label: "Sách tồn", value: stats.totalBooks, icon: "fa-book-open-reader", bgColor: "bg-violet-50", iconColor: "text-violet-600", sub: `${stats.outOfStock} đầu sách đã hết` },
                  { label: "Đang xử lý", value: stats.pendingOrders, icon: "fa-clock", bgColor: "bg-amber-50", iconColor: "text-amber-600", sub: `${stats.completedOrders} đơn đã hoàn thành` }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className={`w-16 h-16 ${stat.bgColor} ${stat.iconColor} rounded-3xl flex items-center justify-center text-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg`}>
                        <i className={`fa-solid ${stat.icon}`}></i>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 uppercase">Live</span>
                      </div>
                    </div>
                    <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mb-1.5 relative z-10">{stat.label}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight relative z-10">{stat.value}</h3>
                    <p className="text-micro font-bold text-slate-500 mt-4 flex items-center gap-2 relative z-10">
                      <span className={`w-1.5 h-1.5 rounded-full ${stat.iconColor} animate-pulse`}></span>
                      {stat.sub}
                    </p>
                    
                    {/* Background Accent */}
                    <div className={`absolute -right-8 -bottom-8 w-32 h-32 ${stat.bgColor} opacity-0 circle group-hover:opacity-20 transition-opacity duration-700 blur-3xl`}></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <i className="fa-solid fa-database text-[120px]"></i>
                  </div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hệ thống dữ liệu</h3>
                      <p className="text-micro font-bold text-slate-400 uppercase tracking-premium mt-1">Khởi tạo và đồng bộ dữ liệu Firestore</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-3xl text-slate-300">
                        <i className="fa-solid fa-server"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">Cloud Firestore Seed Tool</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">Thiết lập môi trường làm việc nhanh chóng bằng cách đẩy dữ liệu mẫu lên Cloud. Quá trình này sẽ khởi tạo danh mục và các cấu hình mặc định khác.</p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <button
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-indigo-600 disabled:bg-slate-300 transition-all shadow-lg shadow-slate-200 flex items-center gap-3 active:scale-95"
                      >
                        {isSeeding ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                        {isSeeding ? "Đang đẩy dữ liệu..." : "Bắt đầu Seed Dữ liệu"}
                      </button>
                      <button className="px-8 py-3.5 bg-white text-slate-900 border border-slate-200 rounded-2xl text-micro font-bold uppercase tracking-premium hover:bg-slate-50 transition-all flex items-center gap-3">
                        <i className="fa-solid fa-file-export"></i>
                        Xuất báo cáo JSON
                      </button>
                    </div>

                    {seedStatus && (
                      <div className={`mt-6 p-4 rounded-2xl flex items-center gap-4 animate-scaleIn ${
                        seedStatus.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                        seedStatus.type === "info" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                        "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}>
                        <i className={`fa-solid ${seedStatus.type === "success" ? "fa-circle-check" : seedStatus.type === "info" ? "fa-circle-info" : "fa-triangle-exclamation"}`}></i>
                        <span className="text-micro font-bold uppercase tracking-premium">{seedStatus.msg}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-label font-bold text-slate-900 uppercase tracking-premium">Nội dung</h3>
                      <i className="fa-solid fa-database text-slate-300"></i>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Tác giả</span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-micro font-bold">{stats.totalAuthors}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Danh mục</span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-micro font-bold">{stats.totalCategories}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Mã khuyến mãi</span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-micro font-bold">{stats.totalCoupons}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2rem] shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-label font-bold uppercase tracking-premium">Thao tác nhanh</h3>
                      <i className="fa-solid fa-bolt text-white/50"></i>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab("books")}
                        className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-micro font-bold transition-all text-left flex items-center gap-2 uppercase tracking-premium"
                      >
                        <i className="fa-solid fa-book"></i>
                        <span>Quản lý kho sách</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-micro font-bold transition-all text-left flex items-center gap-2 uppercase tracking-premium"
                      >
                        <i className="fa-solid fa-shopping-cart"></i>
                        <span>Xử lý đơn hàng</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("coupons")}
                        className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2.5 rounded-xl text-micro font-bold transition-all text-left flex items-center gap-2 uppercase tracking-premium"
                      >
                        <i className="fa-solid fa-ticket"></i>
                        <span>Tạo khuyến mãi</span>
                      </button>
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
