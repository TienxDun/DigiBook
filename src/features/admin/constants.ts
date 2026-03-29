import { AdminMenuGroup, AdminTabDefinition, AdminTabId } from './types';

export const ADMIN_TABS: Record<AdminTabId, AdminTabDefinition> = {
  overview: { id: 'overview', label: 'Tổng quan', icon: 'fa-chart-pie', title: 'Báo cáo tổng quan' },
  analytics: { id: 'analytics', label: 'Thống kê', icon: 'fa-chart-line', title: 'Thống kê' },
  books: { id: 'books', label: 'Kho sách', icon: 'fa-book', title: 'Quản lý kho sách' },
  authors: { id: 'authors', label: 'Tác giả', icon: 'fa-pen-nib', title: 'Tác giả & Nhà văn' },
  categories: { id: 'categories', label: 'Thể loại', icon: 'fa-shapes', title: 'Phân loại danh mục' },
  coupons: { id: 'coupons', label: 'Ưu đãi', icon: 'fa-percent', title: 'Mã giảm giá & KM' },
  orders: { id: 'orders', label: 'Giao dịch', icon: 'fa-receipt', title: 'Giao dịch & Giao nhận' },
  users: { id: 'users', label: 'Người dùng', icon: 'fa-user-tie', title: 'Quản lý tài khoản' },
  logs: { id: 'logs', label: 'Audit Log', icon: 'fa-fingerprint', title: 'Lịch sử hệ thống' },
  inspector: { id: 'inspector', label: 'Kiểm tra Tiki', icon: 'fa-microscope', title: 'Kiểm tra Tiki API' },
};

export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  { title: 'Phân tích', items: [ADMIN_TABS.overview, ADMIN_TABS.analytics] },
  { title: 'Quản lý nội dung', items: [ADMIN_TABS.books, ADMIN_TABS.authors, ADMIN_TABS.categories, ADMIN_TABS.coupons] },
  { title: 'Vận hành', items: [ADMIN_TABS.orders] },
  { title: 'Tài khoản', items: [ADMIN_TABS.users] },
  { title: 'Hệ thống', items: [ADMIN_TABS.logs, ADMIN_TABS.inspector] },
];

export const ADMIN_THEME_STORAGE_KEY = 'digibook_admin_theme';
