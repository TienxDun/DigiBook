import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { AdminLayout } from '@/layouts';
import toast from '@/shared/utils/toast';
import { ADMIN_MENU_GROUPS } from '../constants';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { AdminChartView, AdminTabId } from '../types';
import { buildAdminOverviewStats } from '../utils/overview';
import { confirmAdminAction } from '../utils/actions';
import { adminService } from '../services/admin.service';
import { useAdminBooks } from '../hooks/useAdminBooks';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { useAdminAuthors } from '../hooks/useAdminAuthors';
import { useAdminCategories } from '../hooks/useAdminCategories';
import { useAdminCoupons } from '../hooks/useAdminCoupons';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminLogs } from '../hooks/useAdminLogs';
import AdminSidebar from '../sections/AdminSidebar';
import AdminHeader from '../sections/AdminHeader';
import AdminOverview from '../sections/AdminOverview';

const AdminBooks = React.lazy(() => import('../components/AdminBooks'));
const AdminOrders = React.lazy(() => import('../components/AdminOrders'));
const AdminAuthors = React.lazy(() => import('../components/AdminAuthors'));
const AdminCategories = React.lazy(() => import('../components/AdminCategories'));
const AdminCoupons = React.lazy(() => import('../components/AdminCoupons'));
const AdminUsers = React.lazy(() => import('../components/AdminUsers'));
const AdminLogs = React.lazy(() => import('../components/AdminLogs'));
const AdminAnalytics = React.lazy(() => import('../components/AdminAnalytics'));
const AdminTikiInspector = React.lazy(() => import('../components/AdminTikiInspector'));

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chartView, setChartView] = useState<AdminChartView>('week');
  const [isSyncing, setIsSyncing] = useState(false);

  const { theme, toggleTheme } = useAdminTheme();

  const shouldLoadOverview = activeTab === 'overview' || activeTab === 'analytics';
  const booksState = useAdminBooks(shouldLoadOverview || activeTab === 'books');
  const ordersState = useAdminOrders(shouldLoadOverview || activeTab === 'orders');
  const authorsState = useAdminAuthors(shouldLoadOverview || activeTab === 'books' || activeTab === 'authors');
  const categoriesState = useAdminCategories(shouldLoadOverview || activeTab === 'books' || activeTab === 'categories');
  const couponsState = useAdminCoupons(shouldLoadOverview || activeTab === 'coupons');
  const usersState = useAdminUsers(activeTab === 'users');
  const overviewLogsState = useAdminLogs(activeTab === 'overview', 5);
  const logsState = useAdminLogs(activeTab === 'logs', 50);

  const refreshBooksModule = useCallback(async () => {
    await Promise.all([booksState.refresh(), authorsState.refresh(), categoriesState.refresh()]);
  }, [authorsState, booksState, categoriesState]);

  const refreshOverviewData = useCallback(async () => {
    await Promise.all([
      booksState.refresh(),
      ordersState.refresh(),
      authorsState.refresh(),
      categoriesState.refresh(),
      couponsState.refresh(),
      overviewLogsState.refresh(),
    ]);
  }, [authorsState, booksState, categoriesState, couponsState, ordersState, overviewLogsState]);

  const handleSelectTab = (tabId: AdminTabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleSyncRanking = useCallback(async () => {
    if (isSyncing) return;
    if (!confirmAdminAction('Hệ thống sẽ tính toán lại totalSpent cho toàn bộ người dùng dựa trên lịch sử đơn hàng. Quá trình này có thể mất vài phút. Bạn có muốn tiếp tục?')) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await adminService.syncAllUsersMembership();
      if (result.success) {
        toast.success(`Đã đồng bộ thành công cho ${result.updatedCount} người dùng!`);
        await Promise.all([refreshOverviewData(), usersState.refresh()]);
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi đồng bộ.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi kết nối máy chủ khi đồng bộ.');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshOverviewData, usersState]);

  const overviewStats = useMemo(
    () => buildAdminOverviewStats({
      orders: ordersState.orders,
      books: booksState.books,
      categories: categoriesState.categories,
      authors: authorsState.authors,
      coupons: couponsState.coupons,
      chartView,
    }),
    [
      authorsState.authors,
      booksState.books,
      categoriesState.categories,
      chartView,
      couponsState.coupons,
      ordersState.orders,
    ],
  );

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <AdminOverview
            adminTheme={theme}
            chartView={chartView}
            stats={overviewStats}
            isSyncing={isSyncing}
            onChangeChartView={setChartView}
            onSelectTab={handleSelectTab}
            onSyncRanking={handleSyncRanking}
          />
        );
      case 'books':
        return (
          <AdminBooks
            theme={theme}
            books={booksState.books}
            authors={authorsState.authors}
            categories={categoriesState.categories}
            refreshData={refreshBooksModule}
          />
        );
      case 'authors':
        return <AdminAuthors theme={theme} authors={authorsState.authors} refreshData={authorsState.refresh} />;
      case 'categories':
        return (
          <AdminCategories
            theme={theme}
            categories={categoriesState.categories}
            setCategories={categoriesState.setData}
            refreshData={categoriesState.refresh}
          />
        );
      case 'coupons':
        return <AdminCoupons theme={theme} coupons={couponsState.coupons} refreshData={couponsState.refresh} />;
      case 'orders':
        return <AdminOrders theme={theme} orders={ordersState.orders} refreshData={ordersState.refresh} />;
      case 'users':
        return <AdminUsers theme={theme} users={usersState.users} refreshData={usersState.refresh} />;
      case 'logs':
        return (
          <AdminLogs
            theme={theme}
            logs={logsState.logs}
            hasMoreLogs={logsState.hasMore}
            onLoadMore={logsState.loadMore}
            isLoadingMoreLogs={logsState.isLoadingMore}
          />
        );
      case 'analytics':
        return <AdminAnalytics />;
      case 'inspector':
        return <AdminTikiInspector theme={theme} />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-screen overflow-hidden bg-background">
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden animate-fadeIn"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        <AdminSidebar
          activeTab={activeTab}
          isMobileMenuOpen={isMobileMenuOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          menuGroups={ADMIN_MENU_GROUPS}
          onSelectTab={handleSelectTab}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
        />

        <main className={`flex-1 min-w-0 ${isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-80'} h-screen flex flex-col transition-all duration-500 bg-background`}>
          <AdminHeader
            activeTab={activeTab}
            adminTheme={theme}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onToggleTheme={toggleTheme}
          />

          <div className="p-4 lg:p-10 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center p-20 opacity-50">
                  <i className="fa-solid fa-spinner fa-spin text-3xl text-primary mb-4"></i>
                  <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Đang tải phân hệ...</p>
                </div>
              }
            >
              {renderActiveModule()}
            </Suspense>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
