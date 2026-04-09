import React, { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminChartView, AdminOverviewStats, AdminTabId, AdminTheme } from '../types';
import { formatDateVN } from '../utils/date';
import { formatAdminPrice } from '../utils/formatters';
import { getRecentOrderStatusMeta } from '../utils/overview';

import { adminService } from '../services/admin.service';
import { ErrorHandler } from '@/services/errorHandler';

interface AdminOverviewProps {
  adminTheme: AdminTheme;
  onSelectTab: (tabId: AdminTabId) => void;
  onSyncRanking: () => Promise<void>;
  isSyncing: boolean;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({
  adminTheme,
  onSelectTab,
  onSyncRanking,
  isSyncing,
}) => {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartView, setChartView] = useState<AdminChartView>('week');
  const isMidnight = adminTheme === 'midnight';

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getDashboardSummary();
        // The API returns { success: true, data: { ... } }
        setStats(response.data || null);
      } catch (error) {
        ErrorHandler.handle(error, 'tải thông tin tổng quan');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const onChangeChartView = (view: AdminChartView) => {
    setChartView(view);
  };
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isChartReady, setIsChartReady] = useState(false);

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

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-10 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        {[
          { label: 'Doanh thu', value: formatAdminPrice(stats.totalRevenue || 0), icon: 'fa-sack-dollar', bgColor: 'bg-chart-1/10', iconColor: 'text-chart-1', sub: 'Tổng doanh thu', growth: 'VNĐ' },
          { label: 'Đơn hàng', value: stats.totalOrders || 0, icon: 'fa-cart-shopping', bgColor: 'bg-primary/10', iconColor: 'text-primary', sub: `${stats.todayOrders || 0} đơn hôm nay`, growth: 'Orders' },
          { label: 'Sách tồn', value: stats.totalBooks || 0, icon: 'fa-book-open-reader', bgColor: 'bg-chart-2/10', iconColor: 'text-chart-2', sub: `${stats.outOfStock || 0} sách hết hàng`, growth: 'Books' },
          { label: 'Đang vận hành', value: stats.pendingOrders || 0, icon: 'fa-clock', bgColor: 'bg-chart-3/10', iconColor: 'text-chart-3', sub: `${stats.completedOrders || 0} đơn đã giao`, growth: 'Process' },
        ].map((stat) => (
          <div
            key={stat.label}
            data-testid="admin-overview-kpi-card"
            data-stat-label={stat.label}
            className={`p-4 rounded-2xl lg:rounded-3xl border shadow-xl transition-all duration-500 group relative overflow-hidden ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 hover:border-primary/40 hover:bg-[#1e293b]/60' : 'bg-card border-border hover:shadow-primary/5 hover:border-primary'}`}
          >
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.bgColor} ${stat.iconColor} rounded-xl lg:rounded-2xl flex items-center justify-center text-base lg:text-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_30px_rgba(112,51,255,0.2)]`}>
                <i className={`fa-solid ${stat.icon}`}></i>
              </div>
              <div className="flex flex-col items-end">
                <div className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted">
                  {stat.growth}
                </div>
              </div>
            </div>
            <p className="text-[10px] lg:text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1 relative z-10" data-testid="admin-overview-kpi-label">{stat.label}</p>
            <h3 className="text-lg lg:text-xl font-black tracking-tighter relative z-10 text-foreground" data-testid="admin-overview-kpi-value">{stat.value}</h3>
            <div className={`h-1 w-12 rounded-full mt-3 mb-2 transition-all duration-500 group-hover:w-20 ${stat.bgColor.replace('/10', '/30')}`}></div>
            <p className="text-[9px] lg:text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2 relative z-10">
              <span className={`w-1 h-1 rounded-full ${stat.iconColor} animate-pulse`}></span>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <div
          data-testid="admin-overview-revenue-section"
          className={`lg:col-span-3 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border shadow-2xl relative overflow-hidden transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border shadow-slate-200/50'}`}
        >
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-lg lg:text-xl font-black uppercase tracking-tight text-foreground">Hiệu quả kinh doanh</h3>
              <p className="text-xs lg:text-micro font-bold text-primary/60 uppercase tracking-premium mt-1">Chu kỳ {chartView === 'week' ? '7 ngày' : '30 ngày'} gần nhất VNĐ</p>
            </div>
            <div className={`flex p-1 rounded-xl border ${isMidnight ? 'bg-slate-800 border-white/5' : 'bg-muted border-border'}`}>
              <button onClick={() => onChangeChartView('week')} data-testid="admin-overview-week-toggle" className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartView === 'week' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>Tuần</button>
              <button onClick={() => onChangeChartView('month')} data-testid="admin-overview-month-toggle" className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartView === 'month' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>Tháng</button>
            </div>
          </div>

          <div ref={chartContainerRef} className="h-80 mt-10 w-full" style={{ width: '100%', height: 320 }}>
            {isChartReady && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.revenueByDay || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isMidnight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} vertical={false} />
                  <XAxis dataKey="day" stroke={isMidnight ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `Ngày ${value}`} />
                  <YAxis stroke={isMidnight ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isMidnight ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ color: isMidnight ? '#cbd5e1' : '#64748b', fontWeight: 'bold' }}
                    formatter={(value: number) => [formatAdminPrice(value), 'Doanh thu']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8">
          <div className={`p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border shadow-slate-200/50'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-premium text-foreground">Thống kê kho</h3>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <i className="fa-solid fa-cube text-primary text-xs"></i>
              </div>
            </div>
            <div className="space-y-5">
              {[
                { label: 'Tác giả', value: stats.totalAuthors || 0, icon: 'fa-pen-nib' },
                { label: 'Danh mục', value: stats.totalCategories || 0, icon: 'fa-shapes' },
                { label: 'Mã KM', value: stats.totalCoupons || 0, icon: 'fa-ticket' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between p-4 rounded-2xl border group transition-all duration-300 ${isMidnight ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-primary/40' : 'bg-muted border-border hover:bg-card hover:shadow-xl hover:shadow-slate-100 hover:border-transparent'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xs transition-transform group-hover:rotate-12 bg-primary/10 text-primary">
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
                <button onClick={() => onSelectTab('books')} className="w-full bg-white/10 hover:bg-white text-white hover:text-primary backdrop-blur-md px-6 py-4 rounded-2xl text-[10px] font-black transition-all text-left flex items-center justify-between uppercase tracking-[0.15em] border border-white/10 shadow-lg group/btn">
                  <div className="flex items-center gap-4">
                    <i className="fa-solid fa-plus-circle text-sm"></i>
                    <span>Sách mới</span>
                  </div>
                  <i className="fa-solid fa-arrow-right text-xs opacity-0 group-hover/btn:opacity-100 transition-all transform group-hover/btn:translate-x-1"></i>
                </button>
                <button onClick={onSyncRanking} disabled={isSyncing} className="w-full bg-white/10 hover:bg-white text-white hover:text-primary backdrop-blur-md px-6 py-4 rounded-2xl text-[10px] font-black transition-all text-left flex items-center justify-between uppercase tracking-[0.15em] border border-white/10 shadow-lg group/btn disabled:opacity-50">
                  <div className="flex items-center gap-4">
                    <i className={`fa-solid ${isSyncing ? 'fa-spinner fa-spin' : 'fa-rotate'} text-sm`}></i>
                    <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Ranking'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div
          data-testid="admin-overview-recent-orders-section"
          className={`p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border shadow-2xl transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border'}`}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Đơn hàng mới nhất</h3>
              <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1">Hoạt động mua hàng gần đây nhất</p>
            </div>
            <button onClick={() => onSelectTab('orders')} className="text-xs font-black uppercase tracking-premium text-primary hover:text-primary/80 transition-colors">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {stats.recentOrders?.length > 0 ? stats.recentOrders.map((order, index) => {
              const statusMeta = getRecentOrderStatusMeta(order.statusStep || 0, order.status || '');
              return (
                <div key={order.id || `${order.createdAt?.seconds || order.date || 'order'}-${index}`} className={`flex items-center justify-between p-5 rounded-3xl transition-all border ${isMidnight ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-primary/40' : 'bg-muted border-border hover:bg-card hover:shadow-xl hover:shadow-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${statusMeta.softClass}`}>
                      <i className={`fa-solid ${statusMeta.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-foreground">#{(order.id || 'N/A').slice(-6)}</h4>
                      <p className="text-xs font-bold text-muted-foreground uppercase">{order.customer?.name || 'Ẩn danh'}</p>
                      <p className={`text-[10px] font-black uppercase tracking-wider mt-1 ${statusMeta.textClass}`}>{statusMeta.label}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col gap-0.5">
                    <p className="text-xs font-black text-primary">{formatAdminPrice(order.payment?.total || 0)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{formatDateVN(order.createdAt, order.date || 'Hôm nay')}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center opacity-30">
                <i className="fa-solid fa-inbox text-4xl mb-3"></i>
                <p className="text-micro font-bold uppercase">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>

        <div
          data-testid="admin-overview-top-selling-section"
          className={`p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border shadow-2xl transition-all ${isMidnight ? 'bg-[#1e293b]/40 border-white/5 shadow-black/20' : 'bg-card border-border'}`}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Sản phẩm bán chạy</h3>
              <p className="text-micro font-bold text-muted-foreground uppercase tracking-premium mt-1">Thống kê theo số lượng đã bán</p>
            </div>
            <button onClick={() => onSelectTab('books')} className="text-xs font-black uppercase tracking-premium text-primary hover:text-primary/80 transition-colors">Quản lý kho</button>
          </div>
          <div className="space-y-4">
            {stats.topSellingBooks?.length > 0 ? stats.topSellingBooks.map((book, index) => (
              <div key={`${book.id}-${index}`} className={`flex items-center justify-between p-4 rounded-3xl transition-all border ${isMidnight ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-primary/40' : 'bg-muted border-border hover:bg-card hover:shadow-xl hover:shadow-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={book.cover} alt={book.title} className="w-12 h-16 object-cover rounded-xl shadow-lg border border-border" />
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-xs font-black text-primary-foreground shadow-lg">
                      {index + 1}
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
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${(book.salesCount / Math.max(stats.topSellingBooks[0]?.salesCount || 1, 1)) * 100}%` }}></div>
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
  );
};

export default AdminOverview;
