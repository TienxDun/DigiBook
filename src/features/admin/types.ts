import { Author, Book, CategoryInfo, Coupon, Order, SystemLog, UserProfile } from '@/shared/types';

export type AdminTabId =
  | 'overview'
  | 'books'
  | 'orders'
  | 'categories'
  | 'authors'
  | 'coupons'
  | 'users'
  | 'logs'
  | 'analytics'
  | 'inspector';

export type AdminTheme = 'midnight' | 'light';
export type AdminChartView = 'week' | 'month';

export interface AdminActionState {
  isLoading: boolean;
  error: string | null;
}

export interface AdminChartPoint {
  day: string;
  month: string;
  total: number;
}

export interface AdminOverviewStats {
  totalRevenue: number;
  lowStock: number;
  outOfStock: number;
  pendingOrders: number;
  completedOrders: number;
  totalOrders: number;
  totalBooks: number;
  avgOrderValue: number;
  todayOrders: number;
  totalCategories: number;
  totalAuthors: number;
  totalCoupons: number;
  revenueByDay: AdminChartPoint[];
  maxRevenue: number;
  recentOrders: Order[];
  topSellingBooks: Array<Book & { salesCount: number }>;
}

export interface AdminTabDefinition {
  id: AdminTabId;
  label: string;
  icon: string;
  title: string;
}

export interface AdminMenuGroup {
  title: string;
  items: AdminTabDefinition[];
}

export interface AdminFilterState {
  [key: string]: string | number | boolean | null | undefined;
}

export type { Author, Book, CategoryInfo, Coupon, Order, SystemLog, UserProfile };
