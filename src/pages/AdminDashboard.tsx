import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
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
  const isMidnight = adminTheme === "midnight";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [aiConfig, setAIConfig] = useState<AISettings>({ activeModelId: "gemini-3-flash" });
  const [chartView, setChartView] = useState<"week" | "month">("week");

  const toggleTheme = () => {
    const newTheme = adminTheme === "midnight" ? "light" : "midnight";
    setAdminTheme(newTheme);
    localStorage.setItem("digibook_admin_theme", newTheme);
  };

  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [isLoadingMoreLogs, setIsLoadingMoreLogs] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setIsChartReady(true);
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => resizeObserver.disconnect();
  }, []);


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

      // Lấy 5 logs mới nhất cho Overview
      const latestLogs = await db.getSystemLogs(0, 5);
      setLogs(latestLogs);

      if (activeTab === "logs") {
        const fullLogs = await db.getSystemLogs(0, 50);
        setLogs(fullLogs);
        setHasMoreLogs(fullLogs.length === 50);
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

  useEffect(() => {
    if (adminTheme === 'midnight') {
      document.body.classList.add('admin-midnight');
    } else {
      document.body.classList.remove('admin-midnight');
    }
    return () => document.body.classList.remove('admin-midnight');
  }, [adminTheme]);

  const menuGroups = [
    {
      title: "Phân tích",
      items: [
        { id: "overview", label: "Tổng quan", icon: "fa-chart-pie" }
      ]
    },
    {
      title: "Quản lý nội dung",
      items: [
        { id: "books", label: "Kho sách", icon: "fa-book" },
        { id: "authors", label: "Tác giả", icon: "fa-pen-nib" },
        { id: "categories", label: "Thể loại", icon: "fa-shapes" },
        { id: "coupons", label: "Ưu đãi", icon: "fa-percent" }
      ]
    },
    {
      title: "Vận hành",
      items: [
        { id: "orders", label: "Giao dịch", icon: "fa-receipt" }
      ]
    },
    {
      title: "Tài khoản",
      items: [
        { id: "users", label: "Người dùng", icon: "fa-user-tie" }
      ]
    },
    {
      title: "Hệ thống",
      items: [
        { id: "logs", label: "Audit Log", icon: "fa-fingerprint" },
        { id: "ai", label: "AI Core", icon: "fa-microchip" }
      ]
    }
  ];

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

    // Tính toán doanh thu 7 ngày hoặc 30 ngày gần nhất dựa trên chartView
    const daysToShow = chartView === "week" ? 7 : 30;
    const dateList = [...Array(daysToShow)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    const revenueByDay = dateList.map(dateStr => {
      const dayTotal = orders
        .filter(o => {
          const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.date);
          return oDate.toDateString() === dateStr;
        })
        .reduce((sum, o) => sum + (o.payment?.total || 0), 0);

      const d = new Date(dateStr);
      return {
        day: d.getDate().toString().padStart(2, '0'),
        month: (d.getMonth() + 1).toString().padStart(2, '0'),
        total: dayTotal
      };
    });

    const maxRevenue = Math.max(...revenueByDay.map(d => d.total), 1);
    const yAxisLabels = [1, 0.75, 0.5, 0.25, 0].map(p => maxRevenue * p);

    // Lấy 5 đơn hàng mới nhất
    const recentOrdersList = [...orders]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.date).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.date).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    // Tính toán Top sách bán chạy
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
      yAxisLabels,
      recentOrders: recentOrdersList,
      topSellingBooks: topSellingList
    };
  }, [orders, books, categories, authors, coupons, chartView]);



  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Menu chính */}
      <aside className={`${isSidebarCollapsed ? 'w-24' : 'w-80'} flex flex-col fixed inset-y-0 z-[100] shadow-xl transition-all duration-500 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} bg-[#0f172a] border-white/5 border-r`}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} gap-4 h-24 relative z-20 border-b border-white/5 bg-[#0f172a]`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-4 animate-fadeIn">
              <Link to="/" className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-primary-foreground hover:scale-105 shadow-xl shadow-primary/20 transition-all active:scale-95 group">
                <i className="fa-solid fa-bolt-lightning group-hover:rotate-12 transition-transform"></i>
              </Link>
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-slate-100">DigiBook</h1>
                <p className="text-[10px] font-black text-primary/80 uppercase tracking-[0.3em] mt-1.5">Architecture</p>
              </div>
            </div>
          ) : (
            <Link to="/" className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground hover:scale-105 shadow-xl shadow-primary/20 transition-all active:scale-95 group">
              <i className="fa-solid fa-bolt-lightning group-hover:rotate-12 transition-transform"></i>
            </Link>
          )}
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-slate-400 hover:text-white hover:bg-white/5">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6 mt-2 custom-scrollbar relative z-10">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {!isSidebarCollapsed && (
                <h3 className="px-4 text-xs font-black uppercase tracking-[0.2em] mb-4 animate-fadeIn text-slate-500">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    title={isSidebarCollapsed ? tab.label : ""}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4 px-5'} w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wide transition-all duration-300 group relative
                      ${activeTab === tab.id
                        ? "bg-primary text-white shadow-xl shadow-primary/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                      }`}
                  >
                    <i className={`fa-solid ${tab.icon} ${isSidebarCollapsed ? 'text-lg' : 'text-sm w-5 text-center'} ${activeTab === tab.id
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-primary'
                      }`}></i>
                    {!isSidebarCollapsed && <span className="animate-fadeIn">{tab.label}</span>}

                    {activeTab === tab.id && !isSidebarCollapsed && (
                      <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                    )}
                    {activeTab === tab.id && isSidebarCollapsed && (
                      <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full shadow-[0_0_10px_white]"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - Collapse Toggle */}
        <div className="p-4 border-t hidden lg:block border-white/5">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest overflow-hidden bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <i className={`fa-solid ${isSidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'} transition-transform duration-500`}></i>
            {!isSidebarCollapsed && <span className="whitespace-nowrap animate-fadeIn">Thu gọn menu</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 ${isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-80'} min-h-screen flex flex-col transition-all duration-500 bg-background`}>
        <header className={`backdrop-blur-xl border-b sticky top-0 z-40 h-24 flex items-center justify-between px-6 lg:px-10 transition-all ${isMidnight ? 'border-white/5 bg-[#0f172a]/80 shadow-lg' : 'border-border bg-background/80'
          }`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${isMidnight ? 'bg-slate-800 text-slate-200 border-white/5' : 'bg-card text-foreground border-border'
                }`}
            >
              <i className="fa-solid fa-bars-staggered"></i>
            </button>
            <div className="animate-fadeIn">
              <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-foreground">
                {activeTab === 'overview' ? 'Báo cáo tổng quan' :
                  activeTab === 'books' ? 'Quản lý kho sách' :
                    activeTab === 'orders' ? 'Giao dịch & Giao nhận' :
                      activeTab === 'authors' ? 'Tác giả & Nhà văn' :
                        activeTab === 'categories' ? 'Phân loại danh mục' :
                          activeTab === 'coupons' ? 'Mã giảm giá & KM' :
                            activeTab === 'users' ? 'Quản lý tài khoản' :
                              activeTab === 'logs' ? 'Lịch sử hệ thống' : 'Cấu hình AI Assistant'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                <p className="text-xs lg:text-micro font-bold text-primary/60 uppercase tracking-[0.2em] hidden sm:block">Cloud Management System v2.5</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg border ${isMidnight
                ? 'bg-slate-800 border-white/5 text-amber-400 shadow-black/20 hover:bg-slate-700'
                : 'bg-card text-indigo-600 border-border shadow-slate-200/50 hover:bg-slate-50'
                }`}
              title={isMidnight ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
            >
              <i className={`fa-solid ${isMidnight ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            <div className="hidden md:flex flex-col items-end">
              <span className="text-micro font-black text-muted-foreground uppercase tracking-widest">{new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
              <span className={`text-sm font-black ${isMidnight ? 'text-slate-200' : 'text-foreground'}`}>{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </header>



        <div className="p-4 lg:p-10 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {activeTab === "overview" && (
            <div className="space-y-6 lg:space-y-10 animate-fadeIn">
              {/* Stats Grid - Premium Glassmorphism */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                {[
                  { label: "Doanh thu", value: formatPrice(stats.totalRevenue), icon: "fa-sack-dollar", bgColor: "bg-chart-1/10", iconColor: "text-chart-1", sub: `Tổng doanh thu`, growth: "VNĐ", trend: "neutral" },
                  { label: "Đơn hàng", value: stats.totalOrders, icon: "fa-cart-shopping", bgColor: "bg-primary/10", iconColor: "text-primary", sub: `${stats.todayOrders} đơn hôm nay`, growth: "Orders", trend: "neutral" },
                  { label: "Sách tồn", value: stats.totalBooks, icon: "fa-book-open-reader", bgColor: "bg-chart-2/10", iconColor: "text-chart-2", sub: `${stats.outOfStock} sách hết hàng`, growth: "Books", trend: "neutral" },
                  { label: "Đang xử lý", value: stats.pendingOrders, icon: "fa-clock", bgColor: "bg-chart-3/10", iconColor: "text-chart-3", sub: `${stats.completedOrders} đơn hoàn tất`, growth: "Process", trend: "neutral" }
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-2xl lg:rounded-3xl border shadow-xl transition-all duration-500 group relative overflow-hidden ${isMidnight
                    ? 'bg-[#1e293b]/40 border-white/5 hover:border-primary/40 hover:bg-[#1e293b]/60'
                    : 'bg-card border-border hover:shadow-primary/5 hover:border-primary'
                    }`}>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.bgColor} ${stat.iconColor} rounded-xl lg:rounded-2xl flex items-center justify-center text-base lg:text-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_30px_rgba(112,51,255,0.2)]`}>
                        <i className={`fa-solid ${stat.icon}`}></i>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted`}>
                          {stat.growth}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] lg:text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1 relative z-10">{stat.label}</p>
                    <h3 className="text-lg lg:text-xl font-black tracking-tighter relative z-10 text-foreground">{stat.value}</h3>
                    <div className={`h-1 w-12 rounded-full mt-3 mb-2 transition-all duration-500 group-hover:w-20 ${stat.bgColor.replace('/10', '/30')}`}></div>
                    <p className="text-[9px] lg:text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2 relative z-10">
                      <span className={`w-1 h-1 rounded-full ${stat.iconColor} animate-pulse`}></span>
                      {stat.sub}
                    </p>
                    {/* Background Light Effect */}
                    <div className={`absolute -right-8 -bottom-8 w-24 h-24 ${stat.bgColor.replace('/10', '/5')} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[60px]`}></div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* Revenue Chart  */}
                <div className={`lg:col-span-3 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border shadow-2xl relative overflow-hidden transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border shadow-slate-200/50'
                  }`}>
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h3 className="text-lg lg:text-xl font-black uppercase tracking-tight text-foreground">Hiệu quả kinh doanh</h3>
                      <p className="text-xs lg:text-micro font-bold text-primary/60 uppercase tracking-premium mt-1">Chu kỳ {chartView === 'week' ? '7 ngày' : '30 ngày'} gần nhất VNĐ</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`flex p-1 rounded-xl border ${isMidnight ? 'bg-slate-800 border-white/5' : 'bg-muted border-border'}`}>
                        <button
                          onClick={() => setChartView("week")}
                          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartView === 'week' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Tuần
                        </button>
                        <button
                          onClick={() => setChartView("month")}
                          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartView === 'month' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Tháng
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Chart Visualization using Recharts */}
                  <div ref={chartContainerRef} className="h-80 mt-10 w-full" style={{ width: '100%', height: 320 }}>
                    {isChartReady && (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={stats.revenueByDay}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isMidnight ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} vertical={false} />
                          <XAxis
                            dataKey="day"
                            stroke={isMidnight ? "#94a3b8" : "#64748b"}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `Ngày ${value}`}
                          />
                          <YAxis
                            stroke={isMidnight ? "#94a3b8" : "#64748b"}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isMidnight ? '#1e293b' : '#fff',
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            labelStyle={{ color: isMidnight ? '#cbd5e1' : '#64748b', fontWeight: 'bold' }}
                            formatter={(value: any) => [formatPrice(value), 'Doanh thu']}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:gap-8">
                  <div className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border shadow-slate-200/50'
                    }`}>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black uppercase tracking-premium text-foreground">Tháng kê kho</h3>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <i className="fa-solid fa-cube text-primary text-xs"></i>
                      </div>
                    </div>
                    <div className="space-y-5">
                      {[
                        { label: "Tác giả", value: stats.totalAuthors, color: "emerald", icon: "fa-pen-nib" },
                        { label: "Danh mục", value: stats.totalCategories, color: "indigo", icon: "fa-shapes" },
                        { label: "Mã KM", value: stats.totalCoupons, color: "amber", icon: "fa-ticket" }
                      ].map((item, id) => (
                        <div key={id} className={`flex items-center justify-between p-4 rounded-2xl border group transition-all duration-300 ${isMidnight
                          ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-primary/40'
                          : 'bg-muted border-border hover:bg-card hover:shadow-xl hover:shadow-slate-100 hover:border-transparent'
                          }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs transition-transform group-hover:rotate-12 bg-primary/10 text-primary`}>
                              <i className={`fa-solid ${item.icon}`}></i>
                            </div>
                            <span className={`text-xs font-black uppercase tracking-tight ${isMidnight ? 'text-slate-400' : 'text-muted-foreground'}`}>{item.label}</span>
                          </div>
                          <span className="text-sm font-black transition-all group-hover:text-primary group-hover:scale-125 text-foreground">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl shadow-primary/30 text-primary-foreground relative overflow-hidden group flex flex-col justify-between border border-white/10">
                    <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-[60px] group-hover:bg-white/20 transition-all duration-1000"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-[40px]"></div>

                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <i className="fa-solid fa-bolt-lightning text-amber-300"></i>
                        </span>
                        Trình quản lý
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <button
                          onClick={() => setActiveTab("books")}
                          className="w-full bg-white/10 hover:bg-white text-white hover:text-primary backdrop-blur-md px-6 py-4 rounded-2xl text-[10px] font-black transition-all text-left flex items-center justify-between uppercase tracking-[0.15em] border border-white/10 shadow-lg group/btn"
                        >
                          <div className="flex items-center gap-4">
                            <i className="fa-solid fa-plus-circle text-sm"></i>
                            <span>Sách mới</span>
                          </div>
                          <i className="fa-solid fa-arrow-right text-xs opacity-0 group-hover/btn:opacity-100 transition-all transform group-hover/btn:translate-x-1"></i>
                        </button>
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="w-full bg-white/10 hover:bg-white text-white hover:text-primary backdrop-blur-md px-6 py-4 rounded-2xl text-[10px] font-black transition-all text-left flex items-center justify-between uppercase tracking-[0.15em] border border-white/10 shadow-lg group/btn"
                        >
                          <div className="flex items-center gap-4">
                            <i className="fa-solid fa-truck-fast text-sm"></i>
                            <span>Đơn hàng</span>
                          </div>
                          <i className="fa-solid fa-arrow-right text-xs opacity-0 group-hover/btn:opacity-100 transition-all transform group-hover/btn:translate-x-1"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Section - NEW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Recent Orders */}
                <div className={`p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border shadow-2xl transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border'
                  }`}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Đơn hàng mới nhất</h3>
                      <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1">Hoạt động mua hàng gần đây nhất</p>
                    </div>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-black uppercase tracking-premium text-primary hover:text-primary/80 transition-colors">Xem tất cả</button>
                  </div>

                  <div className="space-y-4">
                    {stats.recentOrders.length > 0 ? stats.recentOrders.map((order: any) => (
                      <div key={order.id} className={`flex items-center justify-between p-5 rounded-3xl transition-all border ${isMidnight
                        ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-primary/40'
                        : 'bg-muted border-border hover:bg-card hover:shadow-xl hover:shadow-slate-100'
                        }`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${order.statusStep === 3 ? 'bg-chart-1/10 text-chart-1' :
                            order.statusStep === 0 ? 'bg-chart-3/10 text-chart-3' : 'bg-primary/10 text-primary'
                            }`}>
                            <i className={`fa-solid ${order.statusStep === 3 ? 'fa-check' : 'fa-clock'}`}></i>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-foreground">#{order.id.slice(-6)}</h4>
                            <p className="text-xs font-bold text-muted-foreground uppercase">{order.customer?.name || 'Ẩn danh'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-primary">{formatPrice(order.payment?.total || 0)}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase mt-1">
                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Hôm nay'}
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
                <div className={`p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border shadow-2xl transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border'
                  }`}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Sản phẩm bán chạy</h3>
                      <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1">Tháng kê theo số lượng đã bán</p>
                    </div>
                    <button onClick={() => setActiveTab('books')} className="text-xs font-black uppercase tracking-premium text-primary hover:text-primary/80 transition-colors">Quản lý kho</button>
                  </div>

                  <div className="space-y-4">
                    {stats.topSellingBooks.length > 0 ? stats.topSellingBooks.map((book: any, idx: number) => (
                      <div key={idx} className={`flex items-center justify-between p-4 rounded-3xl transition-all border ${isMidnight
                        ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-primary/40'
                        : 'bg-muted border-border hover:bg-card hover:shadow-xl hover:shadow-slate-100'
                        }`}>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img src={book.cover} alt={book.title} className="w-12 h-16 object-cover rounded-xl shadow-lg border border-border" />
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-xs font-black text-primary-foreground shadow-lg">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="max-w-[180px]">
                            <h4 className="text-xs font-black uppercase tracking-tight line-clamp-1 text-foreground">{book.title}</h4>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{book.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="px-2 py-1 rounded-lg text-micro font-black uppercase border bg-primary/10 text-primary border-primary/20">
                              Đã bán: {book.salesCount}
                            </span>
                            <div className="w-24 h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${(book.salesCount / Math.max(stats.topSellingBooks[0]?.salesCount || 1, 1)) * 100}%` }}
                              ></div>
                            </div>
                            <p className={`text-xs font-bold uppercase mt-1 ${book.stockQuantity < 10 ? 'text-destructive' : 'text-muted-foreground'}`}>
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
            <AdminBooks theme={adminTheme} books={books} authors={authors} categories={categories} refreshData={refreshData} />
          )}
          {activeTab === "authors" && <AdminAuthors theme={adminTheme} authors={authors} refreshData={refreshData} />}
          {activeTab === "categories" && <AdminCategories theme={adminTheme} categories={categories} refreshData={refreshData} />}
          {activeTab === "coupons" && <AdminCoupons theme={adminTheme} coupons={coupons} refreshData={refreshData} />}
          {activeTab === "orders" && <AdminOrders theme={adminTheme} orders={orders} refreshData={refreshData} />}
          {activeTab === "users" && <AdminUsers theme={adminTheme} users={users} refreshData={refreshData} />}
          {activeTab === "ai" && <AdminAI theme={adminTheme} aiConfig={{ activeModelId: aiConfig.activeModelId }} refreshData={refreshData} />}
          {activeTab === "logs" && (
            <AdminLogs
              theme={adminTheme}
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



